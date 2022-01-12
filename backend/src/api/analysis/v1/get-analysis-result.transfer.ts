import MetricDifferenceTransfer from './metric-difference.transfer';
import QualificationDifferenceTransfer from './qualification-difference.transfer';

export default class GetAnalysisResultTransfer {
  projectName?: string;

  projectId?: string;

  reportDate?: Date;

  commitHash?: string;

  commitUrl?: string;

  status?: string;

  qualifications?: QualificationDifferenceTransfer[] = [];

  metrics?: MetricDifferenceTransfer[] = [];

  success?: boolean;
}
