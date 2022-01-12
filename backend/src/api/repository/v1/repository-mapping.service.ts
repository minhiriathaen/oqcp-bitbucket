import { Service } from 'typedi';
import { StatusCodes } from 'http-status-codes';
import { difference } from 'lodash';
import { serialize } from 'class-transformer';
import RepositoryMappingTransfer from './repository-mapping.transfer';
import RepositoryMappingRepository from '../../../persistence/repository/repository-mapping.repository';
import ServiceError from '../../../error/service-error';
import ErrorCode from '../../../error/error-code';
import WorkspaceMappingRepository from '../../../persistence/repository/workspace-mapping.repository';
import RepositoryMapping from '../../../persistence/entity/repository-mapping.entity';
import OpenQualityCheckerProjectApiClient from '../../../openqualitychecker/project/open-quality-checker-project-api.client';
import BitbucketRepositoryService from '../../../bitbucket/repository/bitbucket-repository.service';
import OpenQualityCheckerProject from '../../../openqualitychecker/transfer/open-quality-checker-project.transfer';
import BitbucketRepositoryTransfer from '../../../bitbucket/transfer/bitbucket-repository.transfer';
import Logger from '../../../util/winston.logger';

const logger = Logger('RepositoryMappingService');

@Service()
export default class RepositoryMappingService {
  constructor(
    private repositoryMappingRepository: RepositoryMappingRepository,
    private workspaceMappingRepository: WorkspaceMappingRepository,
    private openQualityCheckerProjectApiClient: OpenQualityCheckerProjectApiClient,
    private bitbucketRepositoryService: BitbucketRepositoryService,
  ) {}

  getRepositoryMapping = async (
    bitbucketWorkspaceId: string,
    bitbucketRepositoryId: string,
  ): Promise<RepositoryMappingTransfer> => {
    const workspaceMapping = await this.workspaceMappingRepository.findByBitbucketWorkspaceUuid(
      bitbucketWorkspaceId,
    );

    if (!workspaceMapping) {
      throw new ServiceError(StatusCodes.FORBIDDEN, ErrorCode.WORKSPACE_MAPPING_NOT_FOUND);
    }

    const repositoryMappings = await this.repositoryMappingRepository.findByWorkspaceAndRepository(
      workspaceMapping.id as number,
      bitbucketRepositoryId,
    );

    const repositoryMappingTransfer = new RepositoryMappingTransfer();

    if (repositoryMappings) {
      repositoryMappingTransfer.openQualityCheckerProjectIds = repositoryMappings.map(
        (repositoryMapping) => repositoryMapping.openQualityCheckerProjectId,
      ) as string[];
    }

    logger.info(
      `[${bitbucketWorkspaceId}] getRepositoryMapping: ${serialize(repositoryMappingTransfer)}`,
    );

    return repositoryMappingTransfer;
  };

  update = async (
    bitbucketWorkspaceId: string,
    bitbucketRepositoryId: string,
    repositoryMappingTransfer: RepositoryMappingTransfer,
  ): Promise<void> => {
    if (!repositoryMappingTransfer || !repositoryMappingTransfer.openQualityCheckerProjectIds) {
      throw new ServiceError(StatusCodes.BAD_REQUEST, ErrorCode.OPEN_QUALITY_CHECKER_PROJECT_IDS_REQUIRED);
    }

    const workspaceMapping = await this.workspaceMappingRepository.findByBitbucketWorkspaceUuid(
      bitbucketWorkspaceId,
    );

    if (!workspaceMapping) {
      throw new ServiceError(StatusCodes.FORBIDDEN, ErrorCode.WORKSPACE_MAPPING_NOT_FOUND);
    }

    const projectIdsInRequest = repositoryMappingTransfer.openQualityCheckerProjectIds;

    const repositoryMappings = await this.repositoryMappingRepository.findByWorkspaceAndRepository(
      workspaceMapping.id as number,
      bitbucketRepositoryId,
    );

    let persistentProjectIds: string[] = [];
    if (repositoryMappings) {
      persistentProjectIds = repositoryMappings.map(
        (repositoryMapping) => repositoryMapping.openQualityCheckerProjectId,
      ) as string[];

      const projectIdsToDelete = difference(persistentProjectIds, projectIdsInRequest);

      await this.repositoryMappingRepository.destroyByWorkspaceMappingIdAndOpenQualityCheckerProjectIdIn(
        workspaceMapping.id as number,
        projectIdsToDelete,
      );

      if (projectIdsToDelete.length > 0) {
        logger.info(
          `[${bitbucketWorkspaceId}] RepositoryMappings were deleted for Bitbucket repository: ` +
            `${bitbucketRepositoryId} and Open Quality Checker project ids: ${projectIdsToDelete}`,
        );
      }
    }

    const projectIdsToSave = difference(projectIdsInRequest, persistentProjectIds);

    await this.persist(
      bitbucketWorkspaceId,
      bitbucketRepositoryId,
      workspaceMapping.id as number,
      projectIdsToSave,
    );

    logger.info(`[${bitbucketWorkspaceId}] Storing repository mapping finished`);
  };

  persist = async (
    bitbucketWorkspaceId: string,
    bitbucketRepositoryId: string,
    workspaceMappingId: number,
    openQualityCheckerProjectIds: string[],
  ): Promise<void> => {
    openQualityCheckerProjectIds.forEach((openQualityCheckerProjectId) => {
      const repositoryMapping = new RepositoryMapping({
        workspaceMappingId,
        bitbucketRepositoryId,
        openQualityCheckerProjectId,
      });

      this.repositoryMappingRepository.save(repositoryMapping);
    });

    if (openQualityCheckerProjectIds.length > 0) {
      logger.info(
        `[${bitbucketWorkspaceId}] RepositoryMappings were saved for Bitbucket repository: ` +
          `${bitbucketRepositoryId} and Open Quality Checker project ids: ${openQualityCheckerProjectIds}`,
      );
    }
  };

  automaticRepositoryMapping = async (
    bitbucketClientKey: string,
    openQualityCheckerAdminToken: string,
    workspaceMappingId: number,
    bitbucketWorkspaceUuid: string,
  ): Promise<void> => {
    const openQualityCheckerProjects = await this.openQualityCheckerProjectApiClient.getPrivateProjects(
      openQualityCheckerAdminToken,
    );

    const repositories = await this.bitbucketRepositoryService.getRepositories(
      bitbucketClientKey,
      bitbucketWorkspaceUuid,
    );

    repositories.forEach((repository) => {
      const openQualityCheckerProjectIds: string[] = [];

      openQualityCheckerProjects.forEach((openQualityCheckerProject) => {
        if (openQualityCheckerProject.id && this.isMatchingProject(openQualityCheckerProject, repository)) {
          openQualityCheckerProjectIds.push(openQualityCheckerProject.id.toString());
        }
      });

      if (openQualityCheckerProjectIds.length > 0) {
        this.persist(
          bitbucketWorkspaceUuid,
          repository.uuid as string,
          workspaceMappingId,
          openQualityCheckerProjectIds,
        );
      } else {
        logger.info(
          `[${bitbucketWorkspaceUuid}] No matching OpenQualityChecker projects for repository '${repository.uuid}' with slug '${repository.slug}'`,
        );
      }
    });
  };

  isMatchingProject(
    openQualityCheckerProject: OpenQualityCheckerProject,
    repository: BitbucketRepositoryTransfer,
  ): boolean {
    if (!openQualityCheckerProject.url || !repository.slug) {
      return false;
    }
    return openQualityCheckerProject.url.toLowerCase().includes(repository.slug.toLowerCase());
  }
}
