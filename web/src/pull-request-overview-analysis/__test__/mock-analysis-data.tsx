/* eslint-disable sonarjs/no-duplicate-string */
import {Analysis} from '../../shared/model/analysis';
import {Project} from '../type/project';

export const mockAnalysisResult: Analysis[] = [
  {
    qualifications: [
      {
        name: 'Clone Complexity',
        value: 6.18,
        difference: 0,
      },
      {
        name: 'Minor Warnings',
        value: 2.12,
        difference: 1.02,
      },
    ],
    metrics: [
      {
        name: 'Average Number Of Added Lines',
        value: 24,
        difference: 4,
        group: 'Process',
      },
    ],
    projectName: 'backend',
    projectId: '203',
    commitHash: 'c949053ee718',
    commitUrl: 'https://bitbucket.org/minhiriathaen/mock-test/commits/c445054er718',
    reportDate: '2021-05-03T18:00:04.484Z',
    status: 'IN_PROGRESS',
    success: true,
  },
  {
    qualifications: [
      {
        name: 'Clone Complexity',
        value: 5.18,
        difference: -0.040000000000000036,
      },
      {
        name: 'Minor Warnings',
        value: 1.12,
        difference: 1.02,
      },
    ],
    metrics: [
      {
        name: 'API Documentation',
        value: 0,
        difference: -5,
        group: 'Documentation',
      },
      {
        name: 'Average Number Of Added Lines',
        value: 23,
        difference: 0,
        group: 'Process',
      },
    ],
    projectName: 'analyzer-client',
    projectId: '212',
    commitHash: 'c445054er718',
    commitUrl: 'https://bitbucket.org/minhiriathaen/mock-test/commits/c445054er718',
    reportDate: '2021-05-03T10:05:50.703Z',
    status: 'DONE',
    success: false,
  },
  {
    qualifications: [
      {
        name: 'Valami qualification',
        value: 1,
        difference: -2,
      },
    ],
    metrics: [
      {
        name: 'Valami Process',
        value: 2,
        difference: -1,
        group: 'Process',
      },
    ],
    projectName: '2691 last analyzed filter',
    projectId: '6502',
    commitHash: 'c445054er718',
    commitUrl: 'https://bitbucket.org/minhiriathaen/mock-test/commits/c445054er718',
    reportDate: '2021-05-03T10:05:02.394Z',
    status: 'DONE',
    success: true,
  },
  {
    metrics: [],
    projectId: '111',
    projectName: 'test-project',
    qualifications: [],
    status: 'NOT_STARTED',
  },
];

export const projectList: Project[] = [
  {
    projectName: 'backend',
    projectId: '203',
    commitHash: 'c949053ee718',
    commitUrl: 'https://bitbucket.org/minhiriathaen/mock-test/commits/c949053ee718',
    reportDate: '2021-05-03T18:00:04.484Z',
    status: 'IN_PROGRESS',
    success: true,
  },
  {
    projectName: 'analyzer-client',
    projectId: '212',
    commitHash: '40e5a710903d',
    commitUrl: 'https://bitbucket.org/minhiriathaen/mock-test/commits/40e5a710903d',
    reportDate: '2021-05-03T10:05:50.703Z',
    status: 'DONE',
    success: false,
  },
  {
    projectName: '2691 last analyzed filter',
    projectId: '6502',
    commitHash: '40e5a710903d',
    commitUrl: 'https://bitbucket.org/minhiriathaen/mock-test/commits/40e5a710903d',
    reportDate: '2021-05-03T10:05:02.394Z',
    status: 'DONE',
    success: true,
  },
  {
    projectName: 'test-project',
    projectId: '111',
    status: 'NOT_STARTED',
  },
];
