/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable @typescript-eslint/no-use-before-define */
import supertest from 'supertest';
import * as dotenv from 'dotenv';
import path from 'path';
import app from '../../../../app';
import WorkspaceMapping from '../../../../persistence/entity/workspace-mapping.entity';
import sequelize, { truncateAll, WAIT_TIMEOUT } from '../../../../__tests__/sequelize';
import TestAtlassianConnectService from '../../../../__tests__/test-atlassian-connect.service';
import WorkspaceMappingRepository from '../../../../persistence/repository/workspace-mapping.repository';
import RepositoryMappingRepository from '../../../../persistence/repository/repository-mapping.repository';
import RepositoryMapping from '../../../../persistence/entity/repository-mapping.entity';

import openQualityCheckerApi from '../../../../openqualitychecker/open-quality-checker-api';

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

const request: supertest.SuperTest<supertest.Test> = supertest(app);

const workspaceMappingRepository = new WorkspaceMappingRepository();
const repositoryMappingRepository = new RepositoryMappingRepository();

const MOCKED_BITBUCKET_REPOSITORY = 'bitbucketRepositoryId';
const OPEN_QUALITY_CHECKER_TOKEN = 'openQualityCheckerAdminToken';
const MOCKED_OQC_PROJECT_ID = 'openQualityCheckerId';
const MOCKED_OQC_PROJECT_IDS = ['quality_project_1', 'quality_project_2', 'quality_project_3'];

describe('RepositoryMappingController', () => {
  beforeAll(async () => {
    openQualityCheckerApi.defaults.baseURL = process.env.OQC_BASE_URL;
    return sequelize.sync();
  });

  beforeEach(async () => {
    await truncateAll();
    await timeout(WAIT_TIMEOUT);
  });

  describe('getRepositoryMapping', () => {
    it('Should throw WORKSPACE_MAPPING_NOT_FOUND error', async () => {
      await request
        .get(`/v1/repositorymappings/${MOCKED_BITBUCKET_REPOSITORY}`)
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(403, {
          code: 'WORKSPACE_MAPPING_NOT_FOUND',
          message: 'Workspace mapping not found',
        });
    });

    it('Should get empty array because there is no repository mapping', async () => {
      await saveWorkspaceMapping();

      await request
        .get(`/v1/repositorymappings/${MOCKED_BITBUCKET_REPOSITORY}`)
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(200, {
          openQualityCheckerProjectIds: [],
        });
    });

    it('Should get array filled with mocked project id', async () => {
      const savedWorkspaceMapping = await saveWorkspaceMapping();
      await saveRepositoryMapping(savedWorkspaceMapping.id as number);

      await request
        .get(`/v1/repositorymappings/${MOCKED_BITBUCKET_REPOSITORY}`)
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(200, {
          openQualityCheckerProjectIds: [MOCKED_OQC_PROJECT_ID],
        });
    });

    it('Should get array filled with mocked project ids', async () => {
      const savedWorkspaceMapping = await saveWorkspaceMapping();
      await saveRepositoryMapping(savedWorkspaceMapping.id as number, MOCKED_OQC_PROJECT_IDS[0]);
      await saveRepositoryMapping(savedWorkspaceMapping.id as number, MOCKED_OQC_PROJECT_IDS[1]);
      await saveRepositoryMapping(savedWorkspaceMapping.id as number, MOCKED_OQC_PROJECT_IDS[2]);

      await request
        .get(`/v1/repositorymappings/${MOCKED_BITBUCKET_REPOSITORY}`)
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(200, {
          openQualityCheckerProjectIds: MOCKED_OQC_PROJECT_IDS,
        });
    });
  });

  describe('storeRepositoryMapping', () => {
    it('Should throw OPEN_QUALITY_CHECKER_PROJECT_IDS_REQUIRED error because the RepositoryMappingTransfer is empty', async () => {
      await request
        .put(`/v1/repositorymappings/${MOCKED_BITBUCKET_REPOSITORY}`)
        .send({
          bitbucketWorkspaceId: OPEN_QUALITY_CHECKER_TOKEN,
          bitbucketRepositoryId: MOCKED_BITBUCKET_REPOSITORY,
        })
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(400, {
          code: 'OPEN_QUALITY_CHECKER_PROJECT_IDS_REQUIRED',
          message: 'openQualityCheckerProjectIds cannot be null',
        });
    });

    it('Should throw OPEN_QUALITY_CHECKER_PROJECT_IDS_REQUIRED error because the RepositoryMappingTransfer.openQualityCheckerProjectIds are null', async () => {
      await request
        .put(`/v1/repositorymappings/${MOCKED_BITBUCKET_REPOSITORY}`)
        .send({
          bitbucketWorkspaceId: OPEN_QUALITY_CHECKER_TOKEN,
          bitbucketRepositoryId: MOCKED_BITBUCKET_REPOSITORY,
          openQualityCheckerProjectIds: null,
        })
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(400, {
          code: 'OPEN_QUALITY_CHECKER_PROJECT_IDS_REQUIRED',
          message: 'openQualityCheckerProjectIds cannot be null',
        });
    });

    it('Should throw WORKSPACE_MAPPING_NOT_FOUND error', async () => {
      await request
        .put(`/v1/repositorymappings/${MOCKED_BITBUCKET_REPOSITORY}`)
        .send({
          bitbucketWorkspaceId: OPEN_QUALITY_CHECKER_TOKEN,
          bitbucketRepositoryId: MOCKED_BITBUCKET_REPOSITORY,
          openQualityCheckerProjectIds: MOCKED_OQC_PROJECT_IDS,
        })
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(403, {
          code: 'WORKSPACE_MAPPING_NOT_FOUND',
          message: 'Workspace mapping not found',
        });
    });

    it('Should delete all repository mappings', async () => {
      const savedWorkspaceMapping = await saveWorkspaceMapping();
      await saveRepositoryMapping(savedWorkspaceMapping.id as number, MOCKED_OQC_PROJECT_IDS[0]);
      await saveRepositoryMapping(savedWorkspaceMapping.id as number, MOCKED_OQC_PROJECT_IDS[1]);
      await saveRepositoryMapping(savedWorkspaceMapping.id as number, MOCKED_OQC_PROJECT_IDS[2]);

      await request
        .put(`/v1/repositorymappings/${MOCKED_BITBUCKET_REPOSITORY}`)
        .send({
          bitbucketWorkspaceId: TestAtlassianConnectService.TEST_WORKSPACE_ID,
          bitbucketRepositoryId: MOCKED_BITBUCKET_REPOSITORY,
          openQualityCheckerProjectIds: [],
        })
        .expect(200);

      // eslint-disable-next-line max-len
      const savedRepositoryMapping = await repositoryMappingRepository.findByWorkspaceAndRepository(
        savedWorkspaceMapping.id as number,
        MOCKED_BITBUCKET_REPOSITORY,
      );

      expect(savedRepositoryMapping).toBeDefined();
      expect(savedRepositoryMapping?.length).toBe(0);
    });

    it('Should save no repository mapping', async () => {
      const savedWorkspaceMapping = await saveWorkspaceMapping();

      await request
        .put(`/v1/repositorymappings/${MOCKED_BITBUCKET_REPOSITORY}`)
        .send({
          bitbucketWorkspaceId: TestAtlassianConnectService.TEST_WORKSPACE_ID,
          bitbucketRepositoryId: MOCKED_BITBUCKET_REPOSITORY,
          openQualityCheckerProjectIds: [],
        })
        .expect(200);

      // eslint-disable-next-line max-len
      const savedRepositoryMapping = await repositoryMappingRepository.findByWorkspaceAndRepository(
        savedWorkspaceMapping.id as number,
        MOCKED_BITBUCKET_REPOSITORY,
      );

      expect(savedRepositoryMapping).toBeDefined();
      expect(savedRepositoryMapping?.length).toBe(0);
    });

    it('Should delete existing repository mapping', async () => {
      const savedWorkspaceMapping = await saveWorkspaceMapping();
      await saveRepositoryMapping(savedWorkspaceMapping.id as number, MOCKED_OQC_PROJECT_IDS[0]);
      await saveRepositoryMapping(savedWorkspaceMapping.id as number, MOCKED_OQC_PROJECT_IDS[1]);
      await saveRepositoryMapping(savedWorkspaceMapping.id as number, MOCKED_OQC_PROJECT_IDS[2]);

      await request
        .put(`/v1/repositorymappings/${MOCKED_BITBUCKET_REPOSITORY}`)
        .send({
          bitbucketWorkspaceId: OPEN_QUALITY_CHECKER_TOKEN,
          bitbucketRepositoryId: MOCKED_BITBUCKET_REPOSITORY,
          openQualityCheckerProjectIds: [MOCKED_OQC_PROJECT_ID],
        })
        .expect(200);

      // eslint-disable-next-line max-len
      const repositoryMappings = await repositoryMappingRepository.findByWorkspaceAndRepository(
        savedWorkspaceMapping.id as number,
        MOCKED_BITBUCKET_REPOSITORY,
      );

      expect(repositoryMappings).toBeDefined();
      expect(repositoryMappings?.length).toBe(1);
      expect(repositoryMappings?.[0].openQualityCheckerProjectId).toBe(MOCKED_OQC_PROJECT_ID);
    });

    it('Should save new repository mappings', async () => {
      const savedWorkspaceMapping = await saveWorkspaceMapping();

      await request
        .put(`/v1/repositorymappings/${MOCKED_BITBUCKET_REPOSITORY}`)
        .send({
          bitbucketWorkspaceId: TestAtlassianConnectService.TEST_WORKSPACE_ID,
          bitbucketRepositoryId: MOCKED_BITBUCKET_REPOSITORY,
          openQualityCheckerProjectIds: MOCKED_OQC_PROJECT_IDS,
        })
        .expect(200);

      // eslint-disable-next-line max-len
      const savedRepositoryMapping = await repositoryMappingRepository.findByWorkspaceAndRepository(
        savedWorkspaceMapping.id as number,
        MOCKED_BITBUCKET_REPOSITORY,
      );

      expect(savedRepositoryMapping).toBeDefined();
      expect(savedRepositoryMapping?.length).toBe(MOCKED_OQC_PROJECT_IDS.length);
      expect(savedRepositoryMapping?.[0].openQualityCheckerProjectId).toBe(MOCKED_OQC_PROJECT_IDS[0]);
      expect(savedRepositoryMapping?.[1].openQualityCheckerProjectId).toBe(MOCKED_OQC_PROJECT_IDS[1]);
      expect(savedRepositoryMapping?.[2].openQualityCheckerProjectId).toBe(MOCKED_OQC_PROJECT_IDS[2]);
    });
  });
});

async function saveWorkspaceMapping(): Promise<WorkspaceMapping> {
  return workspaceMappingRepository.save(
    new WorkspaceMapping({
      bitbucketWorkspaceUuid: TestAtlassianConnectService.TEST_WORKSPACE_ID,
      openQualityCheckerAdminToken: OPEN_QUALITY_CHECKER_TOKEN,
    }),
  );
}

async function saveRepositoryMapping(
  savedWorkspaceMappingId: number,
  oqcProjectId: string = MOCKED_OQC_PROJECT_ID,
): Promise<RepositoryMapping> {
  return repositoryMappingRepository.save(
    new RepositoryMapping({
      workspaceMappingId: savedWorkspaceMappingId,
      bitbucketRepositoryId: MOCKED_BITBUCKET_REPOSITORY,
      openQualityCheckerProjectId: oqcProjectId,
    }),
  );
}

async function timeout(ms: number) {
  await new Promise<void>((resolve) =>
    setTimeout(() => {
      resolve();
    }, ms),
  ).then(() => console.log(`Timeout expired after ${ms} ms`));
}
