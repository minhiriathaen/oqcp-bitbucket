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

const OPEN_QUALITY_CHECKER_TOKEN = 'openQualityCheckerAdminToken';

describe('OpenQualityCheckerProjectController', () => {
  beforeAll(async () => {
    openQualityCheckerApi.defaults.baseURL = process.env.OQC_BASE_URL;
    return sequelize.sync();
  });

  beforeEach(async () => {
    await truncateAll();
    await timeout(WAIT_TIMEOUT);
  });

  describe('getOpenQualityCheckerProjects', () => {
    it('Should throw WORKSPACE_MAPPING_NOT_FOUND error because workspaceMapping is undefined', async () => {
      await request
        .get('/v1/projects/openqualitychecker')
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(403, {
          code: 'WORKSPACE_MAPPING_NOT_FOUND',
          message: 'Workspace mapping not found',
        });
    });

    it('Should get array filled with mocked project id', async () => {
      await saveWorkspaceMapping();

      await request
        .get('/v1/projects/openqualitychecker')
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(200, [
          { id: '6502', name: '2691 last analyzed filter' },
          { id: '212', name: 'analyzer-client' },
          { id: '203', name: 'backend' },
          { id: '233', name: 'Bianka03-oqc003' },
          { id: '221', name: 'Bianka03-teszt' },
          { id: '206', name: 'dataflow' },
          { id: '6417', name: 'Dátum választó teszt' },
          { id: '209', name: 'differ' },
          { id: '599584', name: 'Elemző ikon' },
          { id: '599660', name: 'Elemző ikon 01' },
          { id: '501242', name: 'Faildelemzesekteszt' },
          { id: '75085', name: 'jiraPluginTest2' },
          { id: '516526', name: 'JiraPlugintestNew' },
          { id: '230', name: 'kezdő dátum teszt' },
          { id: '16045', name: 'linuxelemzoproba' },
          { id: '502858', name: 'példa%2Fprojéktáúő./*$001' },
          { id: '501939', name: 'példa%2Fprojéktáúő./*$_01' },
          { id: '502807', name: 'példa%2Fprojéktáúő./*$0302' },
          { id: '502834', name: 'példa%2Fprojéktáúő./*$030201' },
          { id: '215', name: 'process-metrics' },
          { id: '612769', name: 'Project elemzési státusz jelölése' },
          { id: '502326', name: 'Qualityprofiletest' },
          { id: '486129', name: 'Regotafutoelemtoteszt' },
          { id: '487360', name: 'Regotafutoelemzesteszt01' },
          { id: '491612', name: 'Regotafutoelemzesteszt02' },
          { id: '496175', name: 'Regotafutoelemzesteszt03' },
          { id: '496307', name: 'Regotafutoelemzesteszt04' },
          { id: '501328', name: 'segmentsTest2' },
          { id: '619494', name: 'Skip_version_test01' },
          { id: '5770', name: 'Sonar teszt' },
          { id: '501962', name: 'specialiskarakterteszt' },
          { id: '15104', name: 'tesztElemzesLinux' },
        ]);
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

async function timeout(ms: number) {
  await new Promise<void>((resolve) =>
    setTimeout(() => {
      resolve();
    }, ms),
  ).then(() => console.log(`Timeout expired after ${ms} ms`));
}
