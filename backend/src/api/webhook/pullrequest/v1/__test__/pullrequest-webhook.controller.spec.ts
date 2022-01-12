/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable @typescript-eslint/no-use-before-define */
import supertest from 'supertest';
import * as dotenv from 'dotenv';
import path from 'path';
import app from '../../../../../app';
import WorkspaceMapping from '../../../../../persistence/entity/workspace-mapping.entity';
import sequelize, { truncateAll, WAIT_TIMEOUT } from '../../../../../__tests__/sequelize';
import TestAtlassianConnectService from '../../../../../__tests__/test-atlassian-connect.service';
import WorkspaceMappingRepository from '../../../../../persistence/repository/workspace-mapping.repository';
import RepositoryMappingRepository from '../../../../../persistence/repository/repository-mapping.repository';
import RepositoryMapping from '../../../../../persistence/entity/repository-mapping.entity';
import AddonSettings from '../../../../../atlassian-connect/addon/model/addon-setting.model';

import openQualityCheckerApi from '../../../../../openqualitychecker/open-quality-checker-api';
import PullRequest from '../../../../../persistence/entity/pullrequest.entity';
import PullRequestWebhookTransfer from '../pullrequest-webhook.transfer';
import PullRequestRepository from '../../../../../persistence/repository/pullrequest.repository';

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
const pullrequestRepository = new PullRequestRepository();

const MOCKED_BITBUCKET_REPOSITORY = 'bitbucketRepositoryId';
const OPEN_QUALITY_CHECKER_TOKEN = 'openQualityCheckerAdminToken';
const MOCKED_OQC_PROJECT_ID = 'openQualityCheckerId';
const MOCKED_PR_DESTINATION_BRANCH_NAME = 'mock-destination-branch-name';
const MOCKED_PR_DESTINATION_BRANCH_NAME_FOR_UPDATE = 'mock-destination-branch-name-for-update';
const MOCKED_PR_SOURCE_BRANCH_NAME = 'mock-source-branch-name';
const MOCKED_PR_ID = 10;
const MOCKED_BITBUCKET_ID = 5;

describe('PullrequestWebhookController', () => {
  beforeAll(async () => {
    openQualityCheckerApi.defaults.baseURL = process.env.OQC_BASE_URL;
    return sequelize.sync();
  });

  beforeEach(async () => {
    await truncateAll();
    await timeout(WAIT_TIMEOUT);
  });

  describe('pullRequestCreated', () => {
    it('Should call pullRequestCreated and save new pullerquest into the database', async () => {
      const savedWorksapceMapping = await saveWorkspaceMapping();
      await saveRepositoryMapping(savedWorksapceMapping.id as number);

      await request
        .post('/webhook/v1/pullrequest/created')
        .send({
          data: {
            pullrequest: {
              id: MOCKED_PR_ID as number,
              destination: {
                branch: {
                  name: MOCKED_PR_DESTINATION_BRANCH_NAME,
                },
              },
              source: {
                branch: {
                  name: MOCKED_PR_SOURCE_BRANCH_NAME,
                },
              },
            },
            repository: {
              uuid: MOCKED_BITBUCKET_REPOSITORY,
              workspace: {
                uuid: TestAtlassianConnectService.TEST_WORKSPACE_ID,
              },
            },
          },
        })
        .expect(200);

      const savedPullRequest = await pullrequestRepository.find(
        MOCKED_PR_ID.toString(),
        MOCKED_BITBUCKET_REPOSITORY,
        TestAtlassianConnectService.TEST_WORKSPACE_ID,
      );

      expect(savedPullRequest).toBeDefined();
      expect(savedPullRequest?.destinationBranchName).toBe(MOCKED_PR_DESTINATION_BRANCH_NAME);
      expect(savedPullRequest?.bitbucketId).toBe(MOCKED_PR_ID.toString());
      expect(savedPullRequest?.bitbucketRepositoryId).toBe(MOCKED_BITBUCKET_REPOSITORY);
      expect(savedPullRequest?.bitbucketWorkspaceId).toBe(
        TestAtlassianConnectService.TEST_WORKSPACE_ID,
      );
      expect(savedPullRequest?.id).toBeDefined();
    });
  });

  describe('pullRequestRejected', () => {
    it('Should delete saved pullrequest', async () => {
      const savedWorkspaceMapping = await saveWorkspaceMapping();
      await saveRepositoryMapping(savedWorkspaceMapping.id as number);
      await savePullrequest();

      await request
        .post('/webhook/v1/pullrequest/rejected')
        .send({
          data: {
            pullrequest: {
              id: MOCKED_BITBUCKET_ID as number,
              destination: {
                branch: {
                  name: MOCKED_PR_DESTINATION_BRANCH_NAME,
                },
              },
              source: {
                branch: {
                  name: MOCKED_PR_SOURCE_BRANCH_NAME,
                },
              },
            },
            repository: {
              uuid: MOCKED_BITBUCKET_REPOSITORY,
              workspace: {
                uuid: TestAtlassianConnectService.TEST_WORKSPACE_ID,
              },
            },
          },
        })
        .expect(200);

      const savedPullrequest1 = await pullrequestRepository.find(
        MOCKED_BITBUCKET_ID.toString(),
        MOCKED_BITBUCKET_REPOSITORY,
        TestAtlassianConnectService.TEST_WORKSPACE_ID,
      );

      expect(savedPullrequest1).toBeDefined();
      expect(savedPullrequest1).toBeNull();
    });
  });

  describe('pullRequestMerged', () => {
    it('Should delete saved pullrequest', async () => {
      const savedWorkspaceMapping = await saveWorkspaceMapping();
      await saveRepositoryMapping(savedWorkspaceMapping.id as number);
      await savePullrequest();

      await request
        .post('/webhook/v1/pullrequest/rejected')
        .send({
          data: {
            pullrequest: {
              id: MOCKED_BITBUCKET_ID as number,
              destination: {
                branch: {
                  name: MOCKED_PR_DESTINATION_BRANCH_NAME,
                },
              },
              source: {
                branch: {
                  name: MOCKED_PR_SOURCE_BRANCH_NAME,
                },
              },
            },
            repository: {
              uuid: MOCKED_BITBUCKET_REPOSITORY,
              workspace: {
                uuid: TestAtlassianConnectService.TEST_WORKSPACE_ID,
              },
            },
          },
        })
        .expect(200);

      const savedPullrequest = await pullrequestRepository.find(
        MOCKED_BITBUCKET_ID.toString(),
        MOCKED_BITBUCKET_REPOSITORY,
        TestAtlassianConnectService.TEST_WORKSPACE_ID,
      );

      expect(savedPullrequest).toBeDefined();
      expect(savedPullrequest).toBeNull();
    });
  });

  describe('pullRequestUpdated', () => {
    it('Should update the destinationBrancheName of the existing pullrequest', async () => {
      const savedWorkspaceMapping = await saveWorkspaceMapping();
      await saveRepositoryMapping(savedWorkspaceMapping.id as number);
      await savePullrequest();

      await request
        .post('/webhook/v1/pullrequest/updated')
        .send({
          data: {
            pullrequest: {
              id: MOCKED_BITBUCKET_ID as number,
              destination: {
                branch: {
                  name: MOCKED_PR_DESTINATION_BRANCH_NAME_FOR_UPDATE,
                },
              },
              source: {
                branch: {
                  name: MOCKED_PR_SOURCE_BRANCH_NAME,
                },
              },
            },
            repository: {
              uuid: MOCKED_BITBUCKET_REPOSITORY,
              workspace: {
                uuid: TestAtlassianConnectService.TEST_WORKSPACE_ID,
              },
            },
          },
        })
        .expect(200);

      const savedPullrequest = await pullrequestRepository.find(
        MOCKED_BITBUCKET_ID.toString(),
        MOCKED_BITBUCKET_REPOSITORY,
        TestAtlassianConnectService.TEST_WORKSPACE_ID,
      );

      expect(savedPullrequest).toBeDefined();
      expect(savedPullrequest?.bitbucketId).toBe(`${MOCKED_BITBUCKET_ID}`);
      expect(savedPullrequest?.bitbucketRepositoryId).toBe(MOCKED_BITBUCKET_REPOSITORY);
      expect(savedPullrequest?.bitbucketWorkspaceId).toBe(
        TestAtlassianConnectService.TEST_WORKSPACE_ID,
      );
      expect(savedPullrequest?.destinationBranchName).toBe(
        MOCKED_PR_DESTINATION_BRANCH_NAME_FOR_UPDATE,
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

async function savePullrequest(): Promise<PullRequest> {
  return pullrequestRepository.save(
    new PullRequest({
      bitbucketWorkspaceId: TestAtlassianConnectService.TEST_WORKSPACE_ID,
      bitbucketRepositoryId: MOCKED_BITBUCKET_REPOSITORY,
      bitbucketId: MOCKED_BITBUCKET_ID,
      destinationBranchName: MOCKED_PR_DESTINATION_BRANCH_NAME,
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
