import { Service } from 'typedi';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { plainToClass } from 'class-transformer';
import OpenQualityCheckerAnalysisService from './open-quality-checker-analysis.service';
import PullRequestWebhookTransfer from './pullrequest-webhook.transfer';

@Service()
export default class PullRequestWebhookController {
  constructor(private openQualityCheckerAnalysisService: OpenQualityCheckerAnalysisService) {}

  pullRequestCreated = async (request: Request, response: Response): Promise<void> => {
    const pullRequestWebhookTransfer = plainToClass(PullRequestWebhookTransfer, request.body);

    console.log(
      `[${pullRequestWebhookTransfer.bitbucketWorkspaceId}] pullRequestCreated:`,
      pullRequestWebhookTransfer,
    );

    await this.openQualityCheckerAnalysisService.handlePullRequestCreatedEvent(pullRequestWebhookTransfer);

    response.status(StatusCodes.OK).send();
  };

  pullRequestRejected = async (request: Request, response: Response): Promise<void> => {
    const pullRequestWebhookTransfer = plainToClass(PullRequestWebhookTransfer, request.body);

    console.log(
      `[${pullRequestWebhookTransfer.bitbucketWorkspaceId}] pullRequestRejected:`,
      pullRequestWebhookTransfer,
    );

    await this.openQualityCheckerAnalysisService.handlePullRequestDeletedEvent(pullRequestWebhookTransfer);

    response.status(StatusCodes.OK).send();
  };

  pullRequestMerged = async (request: Request, response: Response): Promise<void> => {
    const pullRequestWebhookTransfer = plainToClass(PullRequestWebhookTransfer, request.body);

    console.log(
      `[${pullRequestWebhookTransfer.bitbucketWorkspaceId}] pullRequestMerged:`,
      pullRequestWebhookTransfer,
    );

    await this.openQualityCheckerAnalysisService.handlePullRequestDeletedEvent(pullRequestWebhookTransfer);

    response.status(StatusCodes.OK).send();
  };

  pullRequestUpdated = async (request: Request, response: Response): Promise<void> => {
    const pullRequestWebhookTransfer = plainToClass(PullRequestWebhookTransfer, request.body);

    console.log(
      `[${pullRequestWebhookTransfer.bitbucketWorkspaceId}] pullRequestUpdated:`,
      pullRequestWebhookTransfer,
    );

    await this.openQualityCheckerAnalysisService.handlePullRequestUpdatedEvent(pullRequestWebhookTransfer);

    response.status(StatusCodes.OK).send();
  };
}
