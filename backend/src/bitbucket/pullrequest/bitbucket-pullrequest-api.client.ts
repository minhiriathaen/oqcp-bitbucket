import { Service } from 'typedi';
import { StatusCodes } from 'http-status-codes';
import BitbucketApiClient from '../bitbucket-api.client';
import ServiceError from '../../error/service-error';
import ErrorCode from '../../error/error-code';
import BitbucketPullRequestTransfer from '../transfer/bitbucket-pullrequest.transfer';
import PagedResponse from './bitbucket-paged-response';

const API_ERROR_MESSAGE = 'Bitbucket API error:';

@Service()
export default class BitbucketPullRequestApiClient {
  constructor(private bitbucketApiClient: BitbucketApiClient) {}

  async getPullRequest(
    clientKey: string,
    workspaceId: string,
    repositoryId: string,
    pullRequestId: string,
  ): Promise<string> {
    const endpointUrl = `2.0/repositories/${workspaceId}/${repositoryId}/pullrequests/${pullRequestId}`;

    try {
      return await this.bitbucketApiClient.get(clientKey, endpointUrl);
    } catch (error) {
      console.error('Bitbucket API error:', error);
      throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, ErrorCode.BITBUCKET_API_ERROR);
    }
  }

  async getPullRequests(
    clientKey: string,
    workspaceId: string,
    repositoryId: string,
    pageSize: number,
    page: number,
    query = '',
  ): Promise<PagedResponse<BitbucketPullRequestTransfer>> {
    const endpointUrl = `/2.0/repositories/${workspaceId}/${repositoryId}/pullrequests?pagelen=${pageSize}&page=${page}&q=${query}`;

    try {
      return JSON.parse(await this.bitbucketApiClient.get<string>(clientKey, endpointUrl));
    } catch (error) {
      console.error(API_ERROR_MESSAGE, error);
      throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, ErrorCode.BITBUCKET_API_ERROR);
    }
  }

  async getPullRequestDifference(
    clientKey: string,
    workspaceId: string,
    repositoryId: string,
    pullRequestId: string,
  ): Promise<string> {
    const endpointUrl = `2.0/repositories/${workspaceId}/${repositoryId}/pullrequests/${pullRequestId}/diff`;

    try {
      return await this.bitbucketApiClient.get(clientKey, endpointUrl);
    } catch (error) {
      console.error(API_ERROR_MESSAGE, error);
      throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, ErrorCode.BITBUCKET_API_ERROR);
    }
  }
}
