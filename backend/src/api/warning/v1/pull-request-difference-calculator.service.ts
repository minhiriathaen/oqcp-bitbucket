/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-useless-escape */

import { Service } from 'typedi';
import { last } from 'lodash';
import BitbucketPullRequestService from '../../../bitbucket/pullrequest/bitbucket-pullrequest.service';
import AffectedLine from './affected-line.transfer';
import PullRequestDifferenceTransfer from './pull-request-difference.transfer';
import StringUtil from '../../../util/string.util';

const PATH_START_INDEX = '+++ b/'.length;
const SOURCE_FROM_REGEX = /-(\d*)(\s)?(,)?/;
const SOURCE_TO_REGEX = /-\d*,(\d*)(\s)/;
const TARGET_FROM_REGEX = /\+(\d*)(\s)?(,)?/;
const TARGET_TO_REGEX = /\+\d*,(\d*)(\s)/;

@Service()
export default class PullRequestDifferenceCalculatorService {
  constructor(private bitbucketPullRequestService: BitbucketPullRequestService) {}

  calculatePullRequestDifference = async (
    bitbucketClientKey: string,
    bitbucketWorkspaceId: string,
    bitbucketRepositoryId: string,
    bitbucketPullRequestId: string,
  ): Promise<PullRequestDifferenceTransfer[]> => {
    console.log(
      `[${bitbucketRepositoryId}/${bitbucketPullRequestId}] Pull request difference calculation started`,
    );

    const pullRequestDifference = await this.bitbucketPullRequestService.getPullRequestDifference(
      bitbucketClientKey,
      bitbucketWorkspaceId,
      bitbucketRepositoryId,
      bitbucketPullRequestId,
    );

    const diffLines = pullRequestDifference.split(/\r?\n/);

    const pullRequestDifferences: PullRequestDifferenceTransfer[] = [];

    let prDifferenceTransfer: PullRequestDifferenceTransfer;
    let isNewOrModified: boolean;

    diffLines.forEach((line: string, index) => {
      if (line.startsWith('+++') && diffLines[index + 1]?.startsWith('@@')) {
        console.log(
          `[${bitbucketRepositoryId}/${bitbucketPullRequestId}] Currently watched diff line is: ${line}`,
        );

        const unQuotedLine = line.replace(/"/g, '');
        const unQuotedPrevLine = diffLines[index - 1]?.replace(/"/g, '');

        isNewOrModified = PullRequestDifferenceCalculatorService.isNewOrModifiedFile(
          unQuotedLine,
          unQuotedPrevLine,
        );

        if (isNewOrModified) {
          const filePath = unQuotedLine.substring(PATH_START_INDEX);
          const decodedFilePath = StringUtil.decodeFilePath(filePath);

          console.log(
            `[${bitbucketRepositoryId}/${bitbucketPullRequestId}] Extracted file path: ${filePath}`,
          );

          console.log(
            `[${bitbucketRepositoryId}/${bitbucketPullRequestId}] Decoded file path: ${decodedFilePath}`,
          );

          prDifferenceTransfer = new PullRequestDifferenceTransfer();
          prDifferenceTransfer.path = decodedFilePath;
          pullRequestDifferences.push(prDifferenceTransfer);
        }
      }

      if (line.startsWith('@@') && isNewOrModified) {
        console.log(
          `[${bitbucketRepositoryId}/${bitbucketPullRequestId}] Currently watched diff line is: ${line}`,
        );

        last(pullRequestDifferences)?.sourceLines.push(
          PullRequestDifferenceCalculatorService.getLineNumbers(
            line,
            SOURCE_FROM_REGEX,
            SOURCE_TO_REGEX,
          ),
        );
        last(pullRequestDifferences)?.targetLines.push(
          PullRequestDifferenceCalculatorService.getLineNumbers(
            line,
            TARGET_FROM_REGEX,
            TARGET_TO_REGEX,
          ),
        );
      }
    });

    console.log(
      `[${bitbucketRepositoryId}/${bitbucketPullRequestId}] Pull request difference calculation finished`,
    );

    return pullRequestDifferences;
  };

  private static isNewOrModifiedFile(unQuotedLine: string, unQuotedPrevLine?: string): boolean {
    const isModified = unQuotedPrevLine?.startsWith('--- a/') && unQuotedLine.startsWith('+++ b/');
    const isNew = unQuotedPrevLine === '--- /dev/null' && unQuotedLine.startsWith('+++ b/');

    return isModified || isNew;
  }

  private static getLineNumbers(line: string, fromRegexp: RegExp, toRegexp: RegExp): AffectedLine {
    const from = line.match(fromRegexp)!;
    const to = line.match(toRegexp);

    const fromNumber = Number(from[1]);
    let toNumber = fromNumber;

    if (to && to[1]) {
      toNumber = Number(to[1]);
      if (toNumber > 0) toNumber -= 1;
      toNumber += fromNumber;
    }

    const affectedLine = new AffectedLine();
    affectedLine.from = fromNumber;
    affectedLine.to = toNumber;

    return affectedLine;
  }
}
