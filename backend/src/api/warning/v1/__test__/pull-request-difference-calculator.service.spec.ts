import PullRequestDifferenceCalculatorService from '../pull-request-difference-calculator.service';
import PullRequestDifferenceTransfer from '../pull-request-difference.transfer';
import fs from 'fs';

jest.mock('../../../../bitbucket/pullrequest/bitbucket-pullrequest.service');

describe('PullRequestDifferenceCalculatorService', () => {
  describe('calculatePullRequestDifference', () => {
    it('Should calculate difference from a dif file containing complex changes', async () => {

      const inputGitDifference = fs.readFileSync('./src/api/warning/v1/__test__/inputGitDifference.dif', 'utf-8');
      const pullRequestServiceMock = {
        getPullRequestDifference: jest.fn((
          clientKey: string,
          workspaceId: string,
          repositoryId: string,
          pullRequestId: string) => {
          return Promise.resolve(inputGitDifference);
        }),
      };

      const pullRequestDifferenceCalculatorService = new PullRequestDifferenceCalculatorService(pullRequestServiceMock as any);

      const calculatedResult: PullRequestDifferenceTransfer[] = await pullRequestDifferenceCalculatorService.calculatePullRequestDifference(
        "bitbucketClientKey",
        "bitbucketWorkspaceId",
        "bitbucketRepositoryId",
        "bitbucketPullRequestId"
      );

      const expected: PullRequestDifferenceTransfer[] = [
        //Test cases: special character, new file multiple rows
        { path: "+++˛?:_LáááOPÚŐÁß{}&~ˇ^°˛°˘˙`ú×", sourceLines: [{ from: 0, to: 0 }], targetLines: [{ from: 1, to: 11 }] },
        //Test cases: File edit, 
        { path: ".gitignore", sourceLines: [{ from: 7, to: 24 }, { from: 58, to: 64 }], targetLines: [{ from: 7, to: 17 }, { from: 51, to: 57 }] },
        //Test cases: Conflict file
        { path: "conflict", sourceLines: [{ from: 1, to: 3 }, { from: 7, to: 10 }], targetLines: [{ from: 1, to: 4 }, { from: 8, to: 23 }] },
        //Test cases: new file one row
        { path: "onerow", sourceLines: [{ from: 0, to: 0 }], targetLines: [{ from: 1, to: 1 }] },
        //Test cases: existing 1 row file which got deleted
        { path: "onerowdelete", sourceLines: [{ from: 1, to: 1 }], targetLines: [{ from: 0, to: 0 }] }
        //Test cases: empty file which won't appear
      ];

      expect(calculatedResult).toEqual(expected);

    });

    it('Should not calculate difference from blank diff', async () => {

      const pullRequestServiceMock = {
        getPullRequestDifference: jest.fn((
          clientKey: string,
          workspaceId: string,
          repositoryId: string,
          pullRequestId: string) => {
          return Promise.resolve("");
        }),
      };

      const pullRequestDifferenceCalculatorService = new PullRequestDifferenceCalculatorService(pullRequestServiceMock as any);

      const calculatedResult: PullRequestDifferenceTransfer[] = await pullRequestDifferenceCalculatorService.calculatePullRequestDifference(
        "bitbucketClientKey",
        "bitbucketWorkspaceId",
        "bitbucketRepositoryId",
        "bitbucketPullRequestId"
      );

      expect(calculatedResult).toEqual([]);

    });

    it('Should not calculate difference from empty dif file', async () => {

      const inputEmptyGitDifference = fs.readFileSync('./src/api/warning/v1/__test__/inputEmptyGitDifference.dif', 'utf-8');
      const pullRequestServiceMock = {
        getPullRequestDifference: jest.fn((
          clientKey: string,
          workspaceId: string,
          repositoryId: string,
          pullRequestId: string) => {
          return Promise.resolve(inputEmptyGitDifference);
        }),
      };

      const pullRequestDifferenceCalculatorService = new PullRequestDifferenceCalculatorService(pullRequestServiceMock as any);

      const calculatedResult: PullRequestDifferenceTransfer[] = await pullRequestDifferenceCalculatorService.calculatePullRequestDifference(
        "bitbucketClientKey",
        "bitbucketWorkspaceId",
        "bitbucketRepositoryId",
        "bitbucketPullRequestId"
      );

      expect(calculatedResult).toEqual([]);

    });

    it('Should calculate difference from a dif file containing only delete changes', async () => {

      const inputDeleteGitDifference = fs.readFileSync('./src/api/warning/v1/__test__/inputDeleteGitDifference.dif', 'utf-8');
      const pullRequestServiceMock = {
        getPullRequestDifference: jest.fn((
          clientKey: string,
          workspaceId: string,
          repositoryId: string,
          pullRequestId: string) => {
          return Promise.resolve(inputDeleteGitDifference);
        }),
      };

      const pullRequestDifferenceCalculatorService = new PullRequestDifferenceCalculatorService(pullRequestServiceMock as any);

      const calculatedResult: PullRequestDifferenceTransfer[] = await pullRequestDifferenceCalculatorService.calculatePullRequestDifference(
        "bitbucketClientKey",
        "bitbucketWorkspaceId",
        "bitbucketRepositoryId",
        "bitbucketPullRequestId"
      );

      expect(calculatedResult).toEqual([]);

    });
  });
});

