import PullRequestDifferenceTransfer from '../../api/warning/v1/pull-request-difference.transfer';

export default class OpenQualityCheckerGetWarningTransfer {
  sourceHash?: string;

  targetHash?: string;

  diff?: PullRequestDifferenceTransfer[];

  projectId?: string;
}
