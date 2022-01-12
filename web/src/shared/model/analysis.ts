import { MetricDifference } from './metric-difference';

const analysisStatusLabels = {
  DONE: 'Done',
  IN_PROGRESS: 'In progress',
  NOT_STARTED: 'No information',
};

export default analysisStatusLabels;

export interface Analysis {
  projectName?: string;
  projectId?: string;
  status?: keyof typeof analysisStatusLabels;
  commitHash?: string;
  commitUrl?: string;
  reportDate?: string;
  success?: boolean;
  qualifications?: MetricDifference[];
  metrics?: MetricDifference[];
}
