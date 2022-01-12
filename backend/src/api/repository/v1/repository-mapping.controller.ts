import { Request, Response } from 'express';
import { Service } from 'typedi';
import { StatusCodes } from 'http-status-codes';
import RepositoryMappingService from './repository-mapping.service';
import RepositoryMappingTransfer from './repository-mapping.transfer';
import { getBitbucketWorkspaceUuid } from '../../../atlassian-connect/request/atlassian-connect-request.helper';

@Service()
export default class RepositoryMappingController {
  constructor(private repositoryMappingService: RepositoryMappingService) {}

  getRepositoryMapping = async (request: Request, response: Response): Promise<void> => {
    const bitbucketWorkspaceUuid = getBitbucketWorkspaceUuid(request);
    const { bitbucketRepositoryId } = request.params;

    console.log(`[${bitbucketWorkspaceUuid}] getRepositoryMapping`);

    const repositoryMappingTransfer = await this.repositoryMappingService.getRepositoryMapping(
      bitbucketWorkspaceUuid,
      bitbucketRepositoryId,
    );

    response.status(StatusCodes.OK).json(repositoryMappingTransfer);
  };

  storeRepositoryMapping = async (request: Request, response: Response): Promise<void> => {
    const bitbucketWorkspaceUuid = getBitbucketWorkspaceUuid(request);
    const { bitbucketRepositoryId } = request.params;
    const repositoryMappingTransfer: RepositoryMappingTransfer = request.body;

    console.log(`[${bitbucketWorkspaceUuid}] storeRepositoryMapping: `, repositoryMappingTransfer);

    await this.repositoryMappingService.update(
      bitbucketWorkspaceUuid,
      bitbucketRepositoryId,
      repositoryMappingTransfer,
    );

    response.status(StatusCodes.OK).send();
  };
}
