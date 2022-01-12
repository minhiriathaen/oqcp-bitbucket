import { plainToClass } from 'class-transformer';
import { StatusCodes } from 'http-status-codes';
import { Service } from 'typedi';
import ErrorCode from '../../../../error/error-code';
import ServiceError from '../../../../error/service-error';
import PullRequest from '../../../../persistence/entity/pullrequest.entity';
import WorkspaceMapping from '../../../../persistence/entity/workspace-mapping.entity';
import PullRequestRepository from '../../../../persistence/repository/pullrequest.repository';
import RepositoryMappingRepository from '../../../../persistence/repository/repository-mapping.repository';
import WorkspaceMappingRepository from '../../../../persistence/repository/workspace-mapping.repository';
import OpenQualityCheckerAnalysisApiClient from '../../../../openqualitychecker/analysis/open-quality-checker-analysis-api.client';
import PullRequestWebhookTransfer from './pullrequest-webhook.transfer';

@Service()
export default class OpenQualityCheckerAnalysisService {
  constructor(
    private openQualityCheckerAnalysisApiClient: OpenQualityCheckerAnalysisApiClient,
    private repositoryMappingRepository: RepositoryMappingRepository,
    private workspaceMappingRepository: WorkspaceMappingRepository,
    private pullRequestRepository: PullRequestRepository,
  ) {}

  handlePullRequestCreatedEvent = async (
    pullRequestWebhookTransfer: PullRequestWebhookTransfer,
  ): Promise<void> => {
    console.log(
      `[${pullRequestWebhookTransfer.bitbucketWorkspaceId}] pullRequestCreatedNotification:`,
      pullRequestWebhookTransfer,
    );

    const workspace = await this.getWorkspaceMapping(
      pullRequestWebhookTransfer.bitbucketWorkspaceId as string,
    );

    const openQualityCheckerProjectIds = await this.getOpenQualityCheckerProjectIds(
      workspace,
      pullRequestWebhookTransfer.bitbucketRepositoryId as string,
    );

    if (openQualityCheckerProjectIds.length === 0) {
      console.log(
        `[${pullRequestWebhookTransfer.bitbucketWorkspaceId}] No OpenQualityChecker project assigned to this repository: ${pullRequestWebhookTransfer.bitbucketRepositoryId}`,
      );
      return;
    }

    await this.persistPullRequest(pullRequestWebhookTransfer);

    await this.openQualityCheckerAnalysisApiClient.subscribe(
      workspace.openQualityCheckerAdminToken as string,
      openQualityCheckerProjectIds,
      pullRequestWebhookTransfer.sourceBranchName as string,
      pullRequestWebhookTransfer.destinationBranchName as string,
    );
  };

  private persistPullRequest = async (
    pullRequestWebhookTransfer: PullRequestWebhookTransfer,
  ): Promise<void> => {
    const pullRequest = plainToClass(PullRequest, pullRequestWebhookTransfer);

    await this.pullRequestRepository.save(pullRequest);

    console.info(
      `[${pullRequestWebhookTransfer.bitbucketWorkspaceId}] Pull Request persisted: `,
      pullRequest,
    );
  };

  handlePullRequestDeletedEvent = async (
    pullRequestWebhookTransfer: PullRequestWebhookTransfer,
  ): Promise<void> => {
    console.log(
      `[${pullRequestWebhookTransfer.bitbucketWorkspaceId}] pullRequestDeletedNotification:`,
      pullRequestWebhookTransfer,
    );

    const workspace = await this.getWorkspaceMapping(
      pullRequestWebhookTransfer.bitbucketWorkspaceId as string,
    );

    const openQualityCheckerProjectIds = await this.getOpenQualityCheckerProjectIds(
      workspace,
      pullRequestWebhookTransfer.bitbucketRepositoryId as string,
    );

    if (openQualityCheckerProjectIds.length === 0) {
      console.log(
        `[${pullRequestWebhookTransfer.bitbucketWorkspaceId}] No OpenQualityChecker project assigned to this repository: ${pullRequestWebhookTransfer.bitbucketRepositoryId}`,
      );
      return;
    }

    await this.openQualityCheckerAnalysisApiClient.unsubscribe(
      workspace.openQualityCheckerAdminToken as string,
      openQualityCheckerProjectIds,
      pullRequestWebhookTransfer.sourceBranchName as string,
      pullRequestWebhookTransfer.destinationBranchName as string,
    );

    await this.pullRequestRepository.remove(
      pullRequestWebhookTransfer.bitbucketId as string,
      pullRequestWebhookTransfer.bitbucketRepositoryId as string,
      pullRequestWebhookTransfer.bitbucketWorkspaceId as string,
    );
  };

  handlePullRequestUpdatedEvent = async (
    pullRequestWebhookTransfer: PullRequestWebhookTransfer,
  ): Promise<void> => {
    console.log(
      `[${pullRequestWebhookTransfer.bitbucketWorkspaceId}] pullRequestUpdatedNotification:`,
      pullRequestWebhookTransfer,
    );

    const workspace = await this.getWorkspaceMapping(
      pullRequestWebhookTransfer.bitbucketWorkspaceId as string,
    );

    const openQualityCheckerProjectIds = await this.getOpenQualityCheckerProjectIds(
      workspace,
      pullRequestWebhookTransfer.bitbucketRepositoryId as string,
    );

    if (openQualityCheckerProjectIds.length === 0) {
      console.log(
        `[${pullRequestWebhookTransfer.bitbucketWorkspaceId}] No OpenQualityChecker project assigned to this repository: ${pullRequestWebhookTransfer.bitbucketRepositoryId}`,
      );
      return;
    }

    const savedPullRequest = await this.pullRequestRepository.find(
      pullRequestWebhookTransfer.bitbucketId as string,
      pullRequestWebhookTransfer.bitbucketRepositoryId as string,
      pullRequestWebhookTransfer.bitbucketWorkspaceId as string,
    );
    if (
      savedPullRequest &&
      pullRequestWebhookTransfer.destinationBranchName !== savedPullRequest.destinationBranchName
    ) {
      await this.openQualityCheckerAnalysisApiClient.unsubscribe(
        workspace.openQualityCheckerAdminToken as string,
        openQualityCheckerProjectIds,
        pullRequestWebhookTransfer.sourceBranchName as string,
        savedPullRequest.destinationBranchName as string,
      );

      await this.openQualityCheckerAnalysisApiClient.subscribe(
        workspace.openQualityCheckerAdminToken as string,
        openQualityCheckerProjectIds,
        pullRequestWebhookTransfer.sourceBranchName as string,
        pullRequestWebhookTransfer.destinationBranchName as string,
      );

      await this.updatePullRequest(pullRequestWebhookTransfer, savedPullRequest);
    }
  };

  private updatePullRequest = async (
    pullRequestWebhookTransfer: PullRequestWebhookTransfer,
    pullRequest: PullRequest,
  ): Promise<void> => {
    await this.pullRequestRepository.updateDestinationBranch(
      pullRequest.id as number,
      pullRequestWebhookTransfer.destinationBranchName as string,
    );
    console.info(`[${this.getOpenQualityCheckerProjectIds}] Pull Request updated: `, pullRequest);
  };

  private getOpenQualityCheckerProjectIds = async (
    workspace: WorkspaceMapping,
    repositoryId: string,
  ): Promise<string[]> => {
    let openQualityCheckerProjectIds: string[] = [];

    const repositoryMappings = await this.repositoryMappingRepository.findByWorkspaceAndRepository(
      workspace.id as number,
      repositoryId,
    );

    if (repositoryMappings) {
      openQualityCheckerProjectIds = repositoryMappings.map(
        (mapping) => mapping.openQualityCheckerProjectId,
      ) as string[];
    }
    return openQualityCheckerProjectIds;
  };

  private getWorkspaceMapping = async (workspaceId: string): Promise<WorkspaceMapping> => {
    const workspaceMapping = await this.workspaceMappingRepository.findByBitbucketWorkspaceUuid(
      workspaceId,
    );

    if (!workspaceMapping) {
      throw new ServiceError(StatusCodes.FORBIDDEN, ErrorCode.WORKSPACE_MAPPING_NOT_FOUND);
    }

    return workspaceMapping;
  };
}
