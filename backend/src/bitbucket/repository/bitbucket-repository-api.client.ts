import { Service } from 'typedi';
import BitbucketApiClient from '../bitbucket-api.client';
import { BitbucketPagedRepositories } from '../transfer/bitbucket-paged-repositories';

@Service()
export default class BitbucketRepositoryApiClient {
  constructor(private bitbucketApiClient: BitbucketApiClient) {}

  async getPagedRepositories(
    bitbucketClientKey: string,
    workspaceUuid: string,
    pageSize: number,
    page: number,
  ): Promise<BitbucketPagedRepositories> {
    const rawResponse = await this.bitbucketApiClient.get<string>(
      bitbucketClientKey,
      `2.0/repositories/${workspaceUuid}?pagelen=${pageSize}&page=${page}`,
    );

    return JSON.parse(rawResponse);
  }
}
