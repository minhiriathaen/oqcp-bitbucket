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

import openQualityCheckerApi from '../../../../../openqualitychecker/open-quality-checker-api';
import TestUtil from '../../../../../__tests__/test.util';

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
const MOCKED_BB_REPOSITORY_ID = 'mocked-repo-id';
const MOCKED_OQC_PROJECT_ID = 'mocked-oqc-project-id';

describe('RepositoryWebhookController', () => {
  beforeAll(async () => {
    openQualityCheckerApi.defaults.baseURL = process.env.OQC_BASE_URL;
    return sequelize.sync();
  });

  beforeEach(async () => {
    await truncateAll();
    await TestUtil.timeout(WAIT_TIMEOUT);
  });

  describe('repositoryCreated', () => {
    it('Should not get any workspace mapping', async () => {
      await request
        .post('/webhook/v1/repository/created')
        .send({
          data: {
            repository: {
              uuid: MOCKED_BB_REPOSITORY_ID,
              full_name: 'asd',
              scm: 'test_scm',
              links: {
                html: {
                  href: 'test_hrel',
                },
              },
            },
          },
        })
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(403, {
          code: 'WORKSPACE_MAPPING_NOT_FOUND',
          message: 'Workspace mapping not found',
        });
    });

    it('Should save one repository mapping', async () => {
      const savedWorkspaceMapping = await saveWorkspaceMapping();

      await request
        .post('/webhook/v1/repository/created')
        .send({
          data: {
            repository: {
              uuid: MOCKED_BB_REPOSITORY_ID,
              full_name: 'asd',
              scm: 'test_scm',
              links: {
                html: {
                  href: 'test_href',
                },
              },
            },
          },
        })
        .expect(200);

      const savedRepositoryMapping = await repositoryMappingRepository.findByWorkspaceAndRepository(
        savedWorkspaceMapping.id as number,
        MOCKED_BB_REPOSITORY_ID,
      );

      expect(savedRepositoryMapping).toBeDefined();
      expect(savedRepositoryMapping?.length).toBe(3);
      expect(savedRepositoryMapping?.[0].openQualityCheckerProjectId).toBe('teszt_1');
      expect(savedRepositoryMapping?.[1].openQualityCheckerProjectId).toBe('teszt_2');
      expect(savedRepositoryMapping?.[2].openQualityCheckerProjectId).toBe('teszt_3');
    });
  });

  describe('repositoryDeleted', () => {
    it('Should throw error if no workspace mapping', async () => {
      await request
        .post('/webhook/v1/repository/deleted')
        .send({
          data: {
            repository: {
              uuid: TestAtlassianConnectService.TEST_WORKSPACE_ID,
            },
          },
        })
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(403, {
          code: 'WORKSPACE_MAPPING_NOT_FOUND',
          message: 'Workspace mapping not found',
        });
    });

    it('Should delete saved repository mapping', async () => {
      const savedWorkspaceMapping = await saveWorkspaceMapping();
      await saveRepositoryMapping(savedWorkspaceMapping.id as number, 'teszt_1');
      await saveRepositoryMapping(savedWorkspaceMapping.id as number, 'teszt_2');

      await request
        .post('/webhook/v1/repository/deleted')
        .send({
          data: {
            repository: {
              uuid: MOCKED_BITBUCKET_REPOSITORY,
            },
          },
        })
        .expect(200);

      const savedRepositoryMapping = await repositoryMappingRepository.findByWorkspaceAndRepository(
        savedWorkspaceMapping.id as number,
        MOCKED_BITBUCKET_REPOSITORY,
      );

      expect(savedRepositoryMapping).toBeDefined();
      expect(savedRepositoryMapping).toEqual([]);
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
