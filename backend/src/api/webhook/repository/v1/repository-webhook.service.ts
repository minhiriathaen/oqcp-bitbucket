import { StatusCodes } from 'http-status-codes';
import { Service } from 'typedi';
import ErrorCode from '../../../../error/error-code';
import ServiceError from '../../../../error/service-error';
import RepositoryMappingRepository from '../../../../persistence/repository/repository-mapping.repository';
import WorkspaceMappingRepository from '../../../../persistence/repository/workspace-mapping.repository';
import OpenQualityCheckerProjectApiClient from '../../../../openqualitychecker/project/open-quality-checker-project-api.client';
import OpenQualityCheckerProjectService from '../../../project/v1/open-quality-checker-project.service';
import RepositoryMappingService from '../../../repository/v1/repository-mapping.service';
import RepositoryWebhookTransfer from './repository-webhook.transfer';

@Service()
export default class RepositoryWebhookService {
  constructor(
    private repositoryMappingService: RepositoryMappingService,
    private openQualityCheckerProjectService: OpenQualityCheckerProjectService,
    private workspaceMappingRepository: WorkspaceMappingRepository,
    private repositoryMappingRepository: RepositoryMappingRepository,
    private openQualityCheckerProjectApiClient: OpenQualityCheckerProjectApiClient,
  ) {}

  handleRepositoryCreated = async (
    bitbucketWorkspaceUuid: string,
    repositoryWebhookTransfer: RepositoryWebhookTransfer,
  ): Promise<void> => {
    console.log(`[${bitbucketWorkspaceUuid}] handleRepositoryCreated: `, repositoryWebhookTransfer);

    const openQualityCheckerProjectIds = await this.openQualityCheckerProjectService.createNewProject(
      bitbucketWorkspaceUuid,
      repositoryWebhookTransfer,
    );

    const workspaceMapping = await this.workspaceMappingRepository.findByBitbucketWorkspaceUuid(
      bitbucketWorkspaceUuid,
    );

    if (!workspaceMapping) {
      throw new ServiceError(StatusCodes.FORBIDDEN, ErrorCode.WORKSPACE_MAPPING_NOT_FOUND);
    }

    await this.repositoryMappingService.persist(
      bitbucketWorkspaceUuid,
      repositoryWebhookTransfer.repositoryId as string,
      workspaceMapping.id as number,
      openQualityCheckerProjectIds,
    );
  };

  handleRepositoryDeleted = async (
    bitbucketWorkspaceUuid: string,
    bitbucketRepositoryUuid: string,
  ): Promise<void> => {
    console.log(`[${bitbucketWorkspaceUuid}] handleRepositoryDeleted: `, bitbucketRepositoryUuid);

    const workspaceMapping = await this.workspaceMappingRepository.findByBitbucketWorkspaceUuid(
      bitbucketWorkspaceUuid,
    );

    if (!workspaceMapping) {
      throw new ServiceError(StatusCodes.FORBIDDEN, ErrorCode.WORKSPACE_MAPPING_NOT_FOUND);
    }

    const repositoryMappings = await this.repositoryMappingRepository.findByWorkspaceAndRepository(
      workspaceMapping.id as number,
      bitbucketRepositoryUuid,
    );

    if (repositoryMappings) {
      const openQualityCheckerProjectIds = repositoryMappings.map(
        (mapping) => mapping.openQualityCheckerProjectId,
      ) as string[];

      openQualityCheckerProjectIds.forEach((projectId) => {
        this.openQualityCheckerProjectApiClient.deleteProject(
          workspaceMapping.openQualityCheckerAdminToken as string,
          projectId,
        );
      });

      await this.repositoryMappingRepository.destroyByWorkspaceMappingIdAndOpenQualityCheckerProjectIdIn(
        workspaceMapping.id as number,
        openQualityCheckerProjectIds,
      );
    } else {
      console.log(
        `[${bitbucketWorkspaceUuid}] Mapping not exists for repository: ${bitbucketRepositoryUuid}`,
      );
    }
  };
}
