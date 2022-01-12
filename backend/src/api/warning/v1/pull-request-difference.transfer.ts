import AffectedLine from './affected-line.transfer';

export default class PullRequestDifferenceTransfer {
  path?: string;

  sourceLines: AffectedLine[] = [];

  targetLines: AffectedLine[] = [];
}
