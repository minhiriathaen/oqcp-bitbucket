import { Service } from 'typedi';
import { deserialize, plainToClass } from 'class-transformer';
import BitbucketPullRequestTransfer from '../transfer/bitbucket-pullrequest.transfer';
import BitbucketPullRequestApiClient from './bitbucket-pullrequest-api.client';

const PAGE_SIZE = 50;

@Service()
export default class BitbucketPullRequestService {
  constructor(private pullRequestApiClient: BitbucketPullRequestApiClient) {}

  async getPullRequest(
    clientKey: string,
    workspaceId: string,
    repositoryId: string,
    pullRequestId: string,
  ): Promise<BitbucketPullRequestTransfer> {
    console.info(
      `[${workspaceId}] Getting pull request: '${pullRequestId}' from repository: ${repositoryId}`,
    );

    const response: string = await this.pullRequestApiClient.getPullRequest(
      clientKey,
      workspaceId,
      repositoryId,
      pullRequestId,
    );

    return deserialize(BitbucketPullRequestTransfer, response);
  }

  async getBySourceAndDestination(
    clientKey: string,
    workspaceId: string,
    repositoryId: string,
    sourceBranchName: string,
    destinationBranchName: string,
  ): Promise<BitbucketPullRequestTransfer | undefined> {
    console.info(
      `[${workspaceId}] Getting pull request by source branch: '${sourceBranchName}' and destination branch: '${destinationBranchName}' from repository: ${repositoryId}`,
    );

    const query = encodeURIComponent(
      `source.branch.name = "${sourceBranchName}" AND destination.branch.name = "${destinationBranchName}" AND  state = "OPEN"`,
    );

    const pagedResponse = await this.pullRequestApiClient.getPullRequests(
      clientKey,
      workspaceId,
      repositoryId,
      PAGE_SIZE,
      1,
      query,
    );

    if (pagedResponse && pagedResponse.values && pagedResponse.values.length > 0) {
      if (pagedResponse.values.length > 1) {
        console.log('Paged response has more than one element:', pagedResponse.values);
      }
      return plainToClass(BitbucketPullRequestTransfer, pagedResponse.values[0]);
    }
    return undefined;
  }

  async getPullRequestDifference(
    clientKey: string,
    workspaceId: string,
    repositoryId: string,
    pullRequestId: string,
  ): Promise<string> {
    console.info(
      `[${workspaceId}] Getting differences of the pull request: '${pullRequestId}' from repository: ${repositoryId}`,
    );

    return this.pullRequestApiClient.getPullRequestDifference(
      clientKey,
      workspaceId,
      repositoryId,
      pullRequestId,
    );
  }
}
