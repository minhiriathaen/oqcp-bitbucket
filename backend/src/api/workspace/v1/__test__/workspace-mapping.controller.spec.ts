import supertest from 'supertest';
import app from '../../../../app';
import WorkspaceMapping from '../../../../persistence/entity/workspace-mapping.entity';
import sequelize, { truncateAll, WAIT_TIMEOUT } from '../../../../__tests__/sequelize';
import TestAtlassianConnectService from '../../../../__tests__/test-atlassian-connect.service';
import WorkspaceMappingRepository from '../../../../persistence/repository/workspace-mapping.repository';
import RepositoryMappingRepository from '../../../../persistence/repository/repository-mapping.repository';
import RepositoryMapping from '../../../../persistence/entity/repository-mapping.entity';

import * as dotenv from 'dotenv';
import path from 'path';
import openQualityCheckerApi from '../../../../openqualitychecker/open-quality-checker-api';
import Logger from '../../../../util/winston.logger';
import TestUtil from '../../../../__tests__/test.util';

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

const EXISTING_BITBUCKET_REPOSITORY = 'repositoryUuid';
const MOCKED_BITBUCKET_REPOSITORY = 'bitbucketRepositoryId';
const OPEN_QUALITY_CHECKER_TOKEN = 'openQualityCheckerAdminToken';
const AUTOMATIC_REPO_MAPPING_TIMEOUT = 3500;

const logger = Logger();

describe('WorkspaceMappingController', () => {
  beforeAll(async () => {
    openQualityCheckerApi.defaults.baseURL = process.env.OQC_BASE_URL;
    return sequelize.sync();
  });

  beforeEach(async () => {
    await timeout(WAIT_TIMEOUT);
    await truncateAll();
  });

  describe('getWorkspaceMapping', () => {
    it('Should not get any workspace mapping', async () => {
      await request
        .get('/v1/workspacemappings/current')
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(200);
    });

    it('Should get stored workspace mapping', async () => {
      await mockWorkspaceMapping();

      await request
        .get('/v1/workspacemappings/current')
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(200)
        .expect((res) => {
          expect(res.body.openQualityCheckerAdminToken).toBe(OPEN_QUALITY_CHECKER_TOKEN);
          expect(res.body.id).toBeDefined();
        });
    });
  });

  describe('storeWorkspaceMapping', () => {
    it('Should throw OPEN_QUALITY_CHECKER_ADMIN_TOKEN_REQUIRED error', async () => {
      await request
        .put('/v1/workspacemappings/current')
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(400, {
          code: 'OPEN_QUALITY_CHECKER_ADMIN_TOKEN_REQUIRED',
          message: 'openQualityCheckerAdminToken cannot be empty',
        });
    });

    it.skip('Should save new workspace mapping', async () => {
      await TestUtil.mockAddonSettings();
      await request
        .put('/v1/workspacemappings/current')
        .send({ openQualityCheckerAdminToken: OPEN_QUALITY_CHECKER_TOKEN })
        .expect(200);

      let workspaceMapping = await workspaceMappingRepository.findByBitbucketWorkspaceUuid(
        TestAtlassianConnectService.TEST_WORKSPACE_ID,
      );

      expect(workspaceMapping).toBeDefined();
      expect(workspaceMapping?.bitbucketWorkspaceUuid).toBe(
        TestAtlassianConnectService.TEST_WORKSPACE_ID,
      );
      expect(workspaceMapping?.openQualityCheckerAdminToken).toBe(OPEN_QUALITY_CHECKER_TOKEN);

      // Waiting for automatic repository mapping to finish
      await timeout(AUTOMATIC_REPO_MAPPING_TIMEOUT);
    });

    it('Should update existing workspace mapping', async () => {
      const savedWorkspaceMapping = await mockWorkspaceMapping();
      await mockRepositoryMapping(savedWorkspaceMapping.id as number);

      await request
        .put('/v1/workspacemappings/current')
        .send({ openQualityCheckerAdminToken: 'updatedOpenQualityCheckerAdminToken' })
        .expect(200);

      let workspaceMapping = await workspaceMappingRepository.findByBitbucketWorkspaceUuid(
        TestAtlassianConnectService.TEST_WORKSPACE_ID,
      );

      expect(workspaceMapping).toBeDefined();
      expect(workspaceMapping?.bitbucketWorkspaceUuid).toBe(
        TestAtlassianConnectService.TEST_WORKSPACE_ID,
      );
      expect(workspaceMapping?.openQualityCheckerAdminToken).toBe('updatedOpenQualityCheckerAdminToken');
    });

    it('Should not start automatic repository mapping', async () => {
      const savedWorkspaceMapping = await mockWorkspaceMapping();
      await mockRepositoryMapping(savedWorkspaceMapping.id as number);

      const response = await request
        .put('/v1/workspacemappings/current')
        .send({ openQualityCheckerAdminToken: OPEN_QUALITY_CHECKER_TOKEN })
        .expect(200);

      expect(response.status).toBe(200);

      // Waiting for automatic repository mapping NOT to start
      await timeout(AUTOMATIC_REPO_MAPPING_TIMEOUT);

      let workspaceMapping = await workspaceMappingRepository.findByBitbucketWorkspaceUuid(
        TestAtlassianConnectService.TEST_WORKSPACE_ID,
      );

      expect(workspaceMapping).toBeDefined();
      expect(workspaceMapping?.bitbucketWorkspaceUuid).toBe(
        TestAtlassianConnectService.TEST_WORKSPACE_ID,
      );
      expect(workspaceMapping?.openQualityCheckerAdminToken).toBe(OPEN_QUALITY_CHECKER_TOKEN);

      let alreadyPersistedRepositoryMappings = await repositoryMappingRepository.findByWorkspaceAndRepository(
        savedWorkspaceMapping.id as number,
        MOCKED_BITBUCKET_REPOSITORY,
      );

      expect(alreadyPersistedRepositoryMappings).toBeDefined();
      expect(alreadyPersistedRepositoryMappings?.length).toBe(1);

      let mappingsForExistingBitbucketRepository = await repositoryMappingRepository.findByWorkspaceAndRepository(
        savedWorkspaceMapping.id as number,
        EXISTING_BITBUCKET_REPOSITORY,
      );

      expect(mappingsForExistingBitbucketRepository).toBeDefined();
      expect(mappingsForExistingBitbucketRepository?.length).toBe(0);
    });
  });
});

async function mockWorkspaceMapping(): Promise<WorkspaceMapping> {
  return workspaceMappingRepository.save(
    new WorkspaceMapping({
      bitbucketWorkspaceUuid: TestAtlassianConnectService.TEST_WORKSPACE_ID,
      openQualityCheckerAdminToken: OPEN_QUALITY_CHECKER_TOKEN,
    }),
  );
}

async function mockRepositoryMapping(workspaceMappingId: number): Promise<void> {
  await repositoryMappingRepository.save(
    new RepositoryMapping({
      workspaceMappingId: workspaceMappingId,
      bitbucketRepositoryId: MOCKED_BITBUCKET_REPOSITORY,
      openQualityCheckerProjectId: 'openQualityCheckerProjectId',
    }),
  );
}

async function timeout(ms: number) {
  logger.debug(`Starting wait for ${ms} ms...`);

  await new Promise<void>((resolve) =>
    setTimeout(() => {
      resolve();
    }, ms),
  ).then(() => logger.debug(`Timeout expired after ${ms} ms`));
}
