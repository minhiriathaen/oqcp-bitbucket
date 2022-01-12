import { Request, Response } from 'express';
import { Service } from 'typedi';
import { StatusCodes } from 'http-status-codes';
import { plainToClass } from 'class-transformer';
import { getBitbucketWorkspaceUuid } from '../../../../atlassian-connect/request/atlassian-connect-request.helper';
import RepositoryWebhookTransfer from './repository-webhook.transfer';
import RepositoryWebhookService from './repository-webhook.service';

@Service()
export default class RepositoryWebhookController {
  constructor(private repositoryWebhookService: RepositoryWebhookService) {}

  repositoryCreated = async (request: Request, response: Response): Promise<void> => {
    const bitbucketWorkspaceUuid = getBitbucketWorkspaceUuid(request);

    console.log(`[${bitbucketWorkspaceUuid}] createdRepositoryNotification`, request.body);

    const repositoryWebhookTransfer = plainToClass(RepositoryWebhookTransfer, request.body);

    await this.repositoryWebhookService.handleRepositoryCreated(
      bitbucketWorkspaceUuid,
      repositoryWebhookTransfer,
    );

    response.status(StatusCodes.OK).send();
  };

  repositoryDeleted = async (request: Request, response: Response): Promise<void> => {
    const bitbucketWorkspaceUuid = getBitbucketWorkspaceUuid(request);

    console.log(`[${bitbucketWorkspaceUuid}] repositoryDeleted:`, request.body);

    const bitbucketRepositoryUuid = request.body.data.repository.uuid;

    await this.repositoryWebhookService.handleRepositoryDeleted(
      bitbucketWorkspaceUuid,
      bitbucketRepositoryUuid,
    );

    response.status(StatusCodes.OK).send();
  };
}
