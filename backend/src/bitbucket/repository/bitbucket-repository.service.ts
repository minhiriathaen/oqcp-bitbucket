import { StatusCodes } from 'http-status-codes';
import { Service } from 'typedi';
import { plainToClass } from 'class-transformer';
import BitbucketRepositoryApiClient from './bitbucket-repository-api.client';
import ErrorCode from '../../error/error-code';
import ServiceError from '../../error/service-error';
import BitbucketRepositoryTransfer from '../transfer/bitbucket-repository.transfer';

const PAGE_SIZE = 100;

@Service()
export default class BitbucketRepositoryService {
  constructor(private bitbucketRepositoryApiClient: BitbucketRepositoryApiClient) {}

  async getRepositories(
    bitbucketClientKey: string,
    workspaceUuid: string,
  ): Promise<BitbucketRepositoryTransfer[]> {
    let repositories: BitbucketRepositoryTransfer[] = [];
    let page = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const pagedRepositories = await this.bitbucketRepositoryApiClient.getPagedRepositories(
          bitbucketClientKey,
          workspaceUuid,
          PAGE_SIZE,
          page,
        );

        repositories = repositories.concat(
          pagedRepositories.values.map((repository) => {
            const bitbucketRepositoryTransfer = plainToClass(
              BitbucketRepositoryTransfer,
              repository,
            );

            repository.links.clone.forEach((repositoryLink) => {
              bitbucketRepositoryTransfer.hrefs = bitbucketRepositoryTransfer.hrefs?.concat(
                repositoryLink.href,
              );
            });

            return bitbucketRepositoryTransfer;
          }),
        );

        hasNextPage = !!pagedRepositories.next;
        page += 1;
      } catch (error) {
        console.error('Bitbucket API error:', error);
        throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, ErrorCode.BITBUCKET_API_ERROR);
      }
    }

    return repositories;
  }
}
