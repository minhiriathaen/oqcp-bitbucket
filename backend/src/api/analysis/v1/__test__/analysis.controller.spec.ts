import supertest from 'supertest';
import app from '../../../../app';
import WorkspaceMapping from '../../../../persistence/entity/workspace-mapping.entity';
import sequelize, {truncateAll, WAIT_TIMEOUT} from '../../../../__tests__/sequelize';
import TestAtlassianConnectService from '../../../../__tests__/test-atlassian-connect.service';
import WorkspaceMappingRepository
  from '../../../../persistence/repository/workspace-mapping.repository';
import RepositoryMappingRepository
  from '../../../../persistence/repository/repository-mapping.repository';
import RepositoryMapping from '../../../../persistence/entity/repository-mapping.entity';
import {orderBy} from 'lodash';

import * as dotenv from 'dotenv';
import path from 'path';
import openQualityCheckerApi from '../../../../openqualitychecker/open-quality-checker-api';
import Analysis from '../../../../persistence/entity/analysis.entity';
import AnalysisRepository from '../../../../persistence/repository/analysis.repository';
import AnalysisResponse from './analysis-response.json';
import Logger from '../../../../util/winston.logger';
import TestUtil from '../../../../__tests__/test.util';
// import GetAnalysisResultTransfer from '../get-analysis-result.transfer';

/**
 * Mockoon Docker services should be started before test run,
 * in test/Mockoon directory exec:
 *
 * docker-compose up --build
 *
 * If you run it in IDE, jest option --runInBand should be used to prevent parallel test running,
 * preventing conflicts in sqlite file based database.
 */

dotenv.config({
  path: path.join(__dirname, '../../../../__tests__/jest-test.env'),
});

const logger = Logger();

const request: supertest.SuperTest<supertest.Test> = supertest(app);

const MOCKED_BB_PULL_REQUEST_ID = 'mocked-pr-id';
const MOCKED_BB_REPOSITORY_ID = 'mocked-repo-id';
const MOCKED_OQC_PROJECT_ID = '628212';
const MOCKED_SOURCE_BRANCH = 'feature/test';
const MOCKED_DESTINATION_BRANCH = 'master';
const MOCKED_SOURCE_COMMIT = 'test_source_commit';
const MOCKED_DESTINATION_COMMIT = 'test_destination_commit';

const workspaceMappingRepository = new WorkspaceMappingRepository();
const repositoryMappingRepository = new RepositoryMappingRepository();
const analysisRepository = new AnalysisRepository();

describe('AnalysisController', () => {
  beforeAll(async () => {
    openQualityCheckerApi.defaults.baseURL = process.env.OQC_BASE_URL;
    return sequelize.sync();
  });

  beforeEach(async () => {
    await truncateAll();
    await timeout(WAIT_TIMEOUT);
  });

  describe('getResults', () => {
    it('Should throw error if repository id is missing', async () => {
      await request
        .get('/v1/analyses/results')
        .query({pullRequestId: MOCKED_BB_PULL_REQUEST_ID})
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(400, {
          code: 'BITBUCKET_REPOSITORY_ID_REQUIRED',
          message: 'Repository id is required',
        });
    });

    it('Should throw error if pull request id is missing', async () => {
      await request
        .get('/v1/analyses/results')
        .query({repositoryId: MOCKED_BB_REPOSITORY_ID})
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(400, {
          code: 'BITBUCKET_PULL_REQUEST_ID_REQUIRED',
          message: 'Pull request id is required',
        });
    });

    it('Should throw error if no workspace mapping', async () => {
      await request
        .get('/v1/analyses/results')
        .query({repositoryId: MOCKED_BB_REPOSITORY_ID, pullRequestId: MOCKED_BB_PULL_REQUEST_ID})
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(403, {
          code: 'WORKSPACE_MAPPING_NOT_FOUND',
          message: 'Workspace mapping not found',
        });
    });

    it('Should throw error if no repository mapping', async () => {
      await mockWorkspaceMapping();

      await request
        .get('/v1/analyses/results')
        .query({repositoryId: MOCKED_BB_REPOSITORY_ID, pullRequestId: MOCKED_BB_PULL_REQUEST_ID})
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(404, {
          code: 'REPOSITORY_MAPPING_NOT_FOUND',
          message: 'No OpenQualityChecker project is mapped',
        });
    });

    it.skip('Should not get any analysis if no stored analysis', async () => {
      await TestUtil.mockAddonSettings();
      const savedWorkspaceMapping = await mockWorkspaceMapping();
      await mockRepositoryMapping(savedWorkspaceMapping.id!);

      const expectedResult = [
        {
          qualifications: [],
          metrics: [],
          projectId: MOCKED_OQC_PROJECT_ID,
          status: 'NOT_STARTED',
        },
      ];

      await request
        .get('/v1/analyses/results')
        .query({repositoryId: MOCKED_BB_REPOSITORY_ID, pullRequestId: MOCKED_BB_PULL_REQUEST_ID})
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(200, expectedResult);
    });

    /*it('Should get stored analysis', async () => {
        await mockAddonSettings();
        const savedWorkspaceMapping = await mockWorkspaceMapping();
        await mockRepositoryMapping(savedWorkspaceMapping.id!);
        await mockAnalysis();

        const expectedResult: GetAnalysisResultTransfer[] = [
            {
                qualifications: [],
                metrics: [],
                projectId: MOCKED_OQC_PROJECT_ID,
                commitHash: MOCKED_SOURCE_COMMIT,
                commitUrl: `https://bitbucket.org/minhiriathaen/mock-test/commits/${MOCKED_SOURCE_COMMIT}`,
                reportDate: new Date(2021, 5, 14, 9, 34, 30, 0), // teszt azt írja, hogy stringet kap, így nem egyezik
                status: 'IN_PROGRESS'
            }
        ];

        await request
            .get('/v1/analyses/results')
            .query({ repositoryId: MOCKED_BB_REPOSITORY_ID, pullRequestId: MOCKED_BB_PULL_REQUEST_ID })
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200, expectedResult);
    });*/
  });

  describe('storeAnalysis', () => {
    const mockResultOfRules = [
      {
        actualValue: 2,
        result: false,
        type: 'Code complexity',
        entity: 'Code',
        operator: 'GT',
        value: 4,
      },
      {
        type: 'QUALIFICATION_NODE',
        entity: 'Maintainability',
        operator: 'GE',
        value: 5.0,
        actualValue: 7.979551192647265,
        result: true,
      },
    ];

    const mockAnalysisTransfer = AnalysisResponse;

    const expectedMetrics = orderBy(
      [
        {
          name: 'Code duplication',
          value: 7.72,
          difference: 0.61,
          group: null,
          qualification: true,
        },
        {
          name: 'Maintainability',
          value: 4.76,
          difference: 0.01,
          group: null,
          qualification: true,
        },
        {
          name: 'Clone Complexity',
          value: 0,
          difference: 0,
          group: 'Clone Complexity',
          qualification: false,
        },
        {
          name: 'Minor Warnings',
          value: 114,
          difference: -5,
          group: 'Minor Warnings',
          qualification: false,
        },
      ],
      'name',
    );

    it.skip('Should find mocked analysis', async () => {
      await mockAnalysis();

      await request.post('/v1/analyses/results').send(mockAnalysisTransfer).expect(200);

      const persistentAnalysis = await analysisRepository.find(
        mockAnalysisTransfer.projectId.toString(),
        mockAnalysisTransfer.sourceBranchName,
        mockAnalysisTransfer.targetBranchName,
        mockAnalysisTransfer.sourceBranchRev,
        mockAnalysisTransfer.targetBranchRev,
      );

      expect(persistentAnalysis).not.toBeNull();
      expect(persistentAnalysis?.sourceBranch).toBe(MOCKED_SOURCE_BRANCH);
      expect(persistentAnalysis?.destinationBranch).toBe(MOCKED_DESTINATION_BRANCH);
      expect(persistentAnalysis?.sourceCommit).toBe(MOCKED_SOURCE_COMMIT);
      expect(persistentAnalysis?.destinationCommit).toBe(MOCKED_DESTINATION_COMMIT);
      expect(persistentAnalysis?.success).toBe(false);
      expect(persistentAnalysis?.openQualityCheckerProjectId).toBe(MOCKED_OQC_PROJECT_ID);
    });

    it.skip('Should update existing analysis', async () => {
      await mockAnalysis();

      const existingAnalysis = await findAnalysis(
        mockAnalysisTransfer.projectId.toString(),
        mockAnalysisTransfer.sourceBranchName,
        mockAnalysisTransfer.targetBranchName,
        mockAnalysisTransfer.sourceBranchRev,
        mockAnalysisTransfer.targetBranchRev,
      );

      expect(existingAnalysis).not.toBeNull();
      expect(existingAnalysis?.success).toBe(true);
      expect(existingAnalysis?.metrics?.length).toBe(0);
      expect(existingAnalysis?.resultsOfRules?.length).toBe(0);

      await request.post('/v1/analyses/results').send(mockAnalysisTransfer).expect(200);

      const modifiedAnalysis = await findAnalysis(
        mockAnalysisTransfer.projectId.toString(),
        mockAnalysisTransfer.sourceBranchName,
        mockAnalysisTransfer.targetBranchName,
        mockAnalysisTransfer.sourceBranchRev,
        mockAnalysisTransfer.targetBranchRev,
      );

      expect(modifiedAnalysis?.success).toBe(false);

      expect(modifiedAnalysis?.metrics?.length).toBe(4);
      const modifiedAnalysisMetrics = orderBy(modifiedAnalysis?.metrics, 'name');
      for (let i = 0; i < expectedMetrics.length; i++) {
        expect(modifiedAnalysisMetrics[i].name).toBe(expectedMetrics[i].name);
        expect(modifiedAnalysisMetrics[i].group).toBe(expectedMetrics[i].group);
        expect(modifiedAnalysisMetrics[i].value).toBe(expectedMetrics[i].value);
        expect(modifiedAnalysisMetrics[i].difference).toBe(expectedMetrics[i].difference);
        expect(modifiedAnalysisMetrics[i].qualification).toBe(expectedMetrics[i].qualification);
      }

      const modifiedAnalysisResultsOfRule = modifiedAnalysis?.resultsOfRules || [];
      expect(modifiedAnalysis?.resultsOfRules?.length).toBe(2);
      expect(modifiedAnalysisResultsOfRule[0]).toMatchObject(mockResultOfRules[0]);
      expect(modifiedAnalysisResultsOfRule[1]).toMatchObject(mockResultOfRules[1]);
    });

    it.skip('Should save new analysis', async () => {
      let newAnalysis = await analysisRepository.find(
        mockAnalysisTransfer.projectId.toString(),
        mockAnalysisTransfer.sourceBranchName,
        mockAnalysisTransfer.targetBranchName,
        mockAnalysisTransfer.sourceBranchRev,
        mockAnalysisTransfer.targetBranchRev,
      );

      expect(newAnalysis).toBeNull();

      await request.post('/v1/analyses/results').send(mockAnalysisTransfer).expect(200);

      newAnalysis = await findAnalysis(
        mockAnalysisTransfer.projectId.toString(),
        mockAnalysisTransfer.sourceBranchName,
        mockAnalysisTransfer.targetBranchName,
        mockAnalysisTransfer.sourceBranchRev,
        mockAnalysisTransfer.targetBranchRev,
      );

      expect(newAnalysis).not.toBeNull();
      expect(newAnalysis?.sourceBranch).toBe(MOCKED_SOURCE_BRANCH);
      expect(newAnalysis?.destinationBranch).toBe(MOCKED_DESTINATION_BRANCH);
      expect(newAnalysis?.sourceCommit).toBe(MOCKED_SOURCE_COMMIT);
      expect(newAnalysis?.destinationCommit).toBe(MOCKED_DESTINATION_COMMIT);
      expect(newAnalysis?.success).toBe(false);
      expect(newAnalysis?.openQualityCheckerProjectId).toBe(MOCKED_OQC_PROJECT_ID);

      expect(newAnalysis?.metrics?.length).toBe(4);
      const newAnalysisAnalysisMetrics = orderBy(newAnalysis?.metrics, 'name');
      for (let i = 0; i < expectedMetrics.length; i++) {
        expect(newAnalysisAnalysisMetrics[i].name).toBe(expectedMetrics[i].name);
        expect(newAnalysisAnalysisMetrics[i].group).toBe(expectedMetrics[i].group);
        expect(newAnalysisAnalysisMetrics[i].value).toBe(expectedMetrics[i].value);
        expect(newAnalysisAnalysisMetrics[i].difference).toBe(expectedMetrics[i].difference);
        expect(newAnalysisAnalysisMetrics[i].qualification).toBe(expectedMetrics[i].qualification);
      }

      const modifiedAnalysisResultsOfRule = newAnalysis?.resultsOfRules || [];
      expect(newAnalysis?.resultsOfRules?.length).toBe(2);
      expect(modifiedAnalysisResultsOfRule[0]).toMatchObject(mockResultOfRules[0]);
      expect(modifiedAnalysisResultsOfRule[1]).toMatchObject(mockResultOfRules[1]);
    });
  });
});

async function mockWorkspaceMapping(): Promise<WorkspaceMapping> {
  return await workspaceMappingRepository.save(
    new WorkspaceMapping({
      bitbucketWorkspaceUuid: TestAtlassianConnectService.TEST_WORKSPACE_ID,
      openQualityCheckerAdminToken: TestAtlassianConnectService.TEST_OPEN_QUALITY_CHECKER_TOKEN,
    }),
  );
}

async function mockRepositoryMapping(savedWorkspaceMappingId: number): Promise<RepositoryMapping> {
  return await repositoryMappingRepository.save(
    new RepositoryMapping({
      workspaceMappingId: savedWorkspaceMappingId,
      bitbucketRepositoryId: MOCKED_BB_REPOSITORY_ID,
      openQualityCheckerProjectId: MOCKED_OQC_PROJECT_ID,
    }),
  );
}

async function mockAnalysis(): Promise<Analysis> {
  return await analysisRepository.save(
    new Analysis({
      sourceBranch: MOCKED_SOURCE_BRANCH,
      destinationBranch: MOCKED_DESTINATION_BRANCH,
      sourceCommit: MOCKED_SOURCE_COMMIT,
      destinationCommit: MOCKED_DESTINATION_COMMIT,
      success: true,
      reportDate: new Date(2021, 5, 14, 9, 34, 30, 0),
      openQualityCheckerProjectId: MOCKED_OQC_PROJECT_ID,
    }),
  );
}

async function findAnalysis(
  openQualityCheckerProjectId: string,
  sourceBranch: string,
  destinationBranch: string,
  sourceCommit: string,
  destinationCommit: string,
): Promise<Analysis | null> {
  return Analysis.findOne({
    where: {
      openQualityCheckerProjectId,
      sourceBranch,
      destinationBranch,
      sourceCommit,
      destinationCommit,
    },
    include: ['metrics', 'resultsOfRules'],
  });
}

async function timeout(ms: number) {
  await new Promise<void>((resolve) =>
    setTimeout(() => {
      resolve();
    }, ms),
  ).then(() => logger.debug(`Timeout expired after ${ms} ms`));
}
