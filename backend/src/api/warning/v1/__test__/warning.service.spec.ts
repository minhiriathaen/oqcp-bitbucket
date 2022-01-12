/* eslint-disable @typescript-eslint/no-use-before-define */
import Container from 'typedi';
import { plainToClass } from 'class-transformer';
import createAddOn, { AddOn } from 'atlassian-connect-express';
import express, { Application } from 'express';
import * as dotenv from 'dotenv';
import path from 'path';
import RepositoryMappingRepository from '../../../../persistence/repository/repository-mapping.repository';
import WarningService from '../warning.service';
import AnalysisResponse from '../../../analysis/v1/__test__/analysis-response.json';
import AnalysisTransfer from '../../../analysis/v1/analysis.transfer';
import sequelize, { truncateAll, WAIT_TIMEOUT } from '../../../../__tests__/sequelize';
import TestUtil from '../../../../__tests__/test.util';
import openQualityCheckerApi from '../../../../openqualitychecker/open-quality-checker-api';
import RepositoryMapping from '../../../../persistence/entity/repository-mapping.entity';
import WorkspaceMapping from '../../../../persistence/entity/workspace-mapping.entity';
import TestAtlassianConnectService from '../../../../__tests__/test-atlassian-connect.service';
import WorkspaceMappingRepository from '../../../../persistence/repository/workspace-mapping.repository';
import { setAddonInContainer } from '../../../../atlassian-connect/addon/addon';
import AnnotationTransfer from '../../../../bitbucket/transfer/bitbucket-annoation.transfer';
import BitbucketCommitApiClient from '../../../../bitbucket/commit/bitbucket-commit-api.client';
import CreateReportResponse from '../../../../bitbucket/transfer/bitbucket-create-riport.response';
import CreateReportRequest from '../../../../bitbucket/transfer/bitbucket-create-riport.request';
import AnnotationType from '../../../../bitbucket/transfer/annotation-type';
import AnnotationSeverity from '../../../../bitbucket/transfer/annotation-severity';
import ExpectedAnnotations from './expected-annotations-transfer.json';

dotenv.config({
  path: path.join(__dirname, '../../../../__tests__/jest-test.env'),
});

const app: Application = express();
const addon: AddOn = createAddOn(app);
setAddonInContainer(addon);

const repositoryMappingRepository = new RepositoryMappingRepository();
const workspaceMappingRepository = new WorkspaceMappingRepository();

const OPEN_QUALITY_CHECKER_TOKEN = 'openQualityCheckerAdminToken';
const MOCKED_OQC_PROJECT_ID = '628212';
const MOCKED_BITBUCKET_REPOSITORY = 'bitbucketRepositoryId';
const warningService = Container.get(WarningService);

describe('WarningService', () => {
  beforeAll(async () => {
    openQualityCheckerApi.defaults.baseURL = process.env.OQC_BASE_URL;
    return sequelize.sync();
  });

  beforeEach(async () => {
    await truncateAll();
    await TestUtil.timeout(WAIT_TIMEOUT);
    await TestUtil.mockAddonSettings();
  });
  describe('startOpenQualityCheckerWarningProcessing', () => {
    it('Reports and annotations should not be created because the repository mapping does not exists', async () => {
      const bitbucketCommitApiClientSpy = mockCommitApiClient();

      await saveWorkspaceMapping();

      const mockAnalysisTransfer = plainToClass(AnalysisTransfer, AnalysisResponse);

      await warningService.startOpenQualityCheckerWarningProcessing(mockAnalysisTransfer);

      expect(bitbucketCommitApiClientSpy.createReport).not.toHaveBeenCalled();
      expect(bitbucketCommitApiClientSpy.createAnnotations).not.toHaveBeenCalled();
    });

    it('Reports and annotations should not be created because the analysis is not finished', async () => {
      const bitbucketCommitApiClientSpy = mockCommitApiClient();

      const savedWorkspaceMapping = await saveWorkspaceMapping();
      await saveRepositoryMapping(savedWorkspaceMapping.id as number);

      const mockAnalysisTransfer = plainToClass(AnalysisTransfer, AnalysisResponse);
      mockAnalysisTransfer.sourceBranchRev = 'not_working_source_branch_rev';

      await warningService.startOpenQualityCheckerWarningProcessing(mockAnalysisTransfer);

      expect(bitbucketCommitApiClientSpy.createReport).not.toHaveBeenCalled();
      expect(bitbucketCommitApiClientSpy.createAnnotations).not.toHaveBeenCalled();
    });

    it('Reports and annotations should be created with the given parameters', async () => {
      const bitbucketCommitApiClientSpy = mockCommitApiClient();

      const savedWorkspaceMapping = await saveWorkspaceMapping();
      await saveRepositoryMapping(savedWorkspaceMapping.id as number);

      const mockAnalysisTransfer = plainToClass(AnalysisTransfer, AnalysisResponse);

      await warningService.startOpenQualityCheckerWarningProcessing(mockAnalysisTransfer);

      expect(bitbucketCommitApiClientSpy.createReport).toHaveBeenCalled();
      expect(bitbucketCommitApiClientSpy.createReport).toHaveBeenCalledWith(
        'mocked-bitbucket-client-key',
        'mocked-workspace-id',
        'bitbucketRepositoryId',
        '897f7a105702798d14318928cf5a90e33e0f0afc',
        'open-quality-checker-warning-report-1',
        {
          details: 'No issues were found',
          report_type: 3,
          reporter: 'OpenQualityChecker Plugin',
          result: 0,
          title: 'OpenQualityChecker Assessment 1',
        },
      );
      expect(bitbucketCommitApiClientSpy.createAnnotations).toHaveBeenCalled();
      expect(bitbucketCommitApiClientSpy.createAnnotations).toHaveBeenCalledWith(
        'mocked-bitbucket-client-key',
        'mocked-workspace-id',
        'bitbucketRepositoryId',
        '897f7a105702798d14318928cf5a90e33e0f0afc',
        'open-quality-checker-warning-report-1',
        ExpectedAnnotations,
      );
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

function mockCommitApiClient() {
  const bitbucketCommitApiClientSpy = Container.get(BitbucketCommitApiClient);
  bitbucketCommitApiClientSpy.createReport = jest.fn(
    (
      clientKey: string,
      workspaceId: string,
      repositoryId: string,
      commitId: string,
      reportId: string,
      createReportRequest: CreateReportRequest,
    ): Promise<CreateReportResponse> => {
      const createReportResponse = new CreateReportResponse();
      createReportResponse.uuid = 'test_return_UUID_for_report';

      return Promise.resolve(createReportResponse);
    },
  );

  bitbucketCommitApiClientSpy.createAnnotations = jest.fn(
    (
      clientKey: string,
      workspaceId: string,
      repositoryId: string,
      commitId: string,
      reportId: string,
      annotations: AnnotationTransfer[],
    ): Promise<AnnotationTransfer[]> => {
      const annotationTransfers = [
        {
          uuid: 'test_create_annotations_uuid',
          external_id: 'test_create_annotations_external_id',
          title: 'test_create_annotations_title',
          annotation_type: AnnotationType.BUG,
          summary: 'test_create_annotations_dummary',
          severity: AnnotationSeverity.HIGH,
          path: 'test_create_annotations_path',
          line: 191,
        },
      ];

      return Promise.resolve(annotationTransfers);
    },
  );

  return bitbucketCommitApiClientSpy;
}
