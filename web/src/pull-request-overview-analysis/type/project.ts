import analysisStatusLabels from '../../shared/model/analysis';

export interface Project {
  projectId?: string;
  projectName?: string;
  status?: keyof typeof analysisStatusLabels;
  commitHash?: string;
  commitUrl?: string;
  reportDate?: string;
  success?: boolean;
}
