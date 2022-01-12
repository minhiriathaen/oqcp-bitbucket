import { plainToClass } from 'class-transformer';
import { StatusCodes } from 'http-status-codes';
import { Service } from 'typedi';
import ErrorCode from '../../../error/error-code';
import ServiceError from '../../../error/service-error';
import WorkspaceMapping from '../../../persistence/entity/workspace-mapping.entity';
import RepositoryMappingRepository from '../../../persistence/repository/repository-mapping.repository';
import WorkspaceMappingRepository from '../../../persistence/repository/workspace-mapping.repository';
import RepositoryMappingService from '../../repository/v1/repository-mapping.service';
import WorkspaceMappingTransfer from './workspace-mapping.transfer';
import Logger from '../../../util/winston.logger';

const logger = Logger('WorkspaceMappingService');

@Service()
export default class WorkspaceMappingService {
  constructor(
    private workspaceMappingRepository: WorkspaceMappingRepository,
    private rmRepository: RepositoryMappingRepository,
    private repositoryMappingService: RepositoryMappingService,
  ) {}

  getWorkspaceMapping = async (
    bitbucketWorkspaceUuid: string,
  ): Promise<WorkspaceMappingTransfer> => {
    const workspaceMapping = await this.workspaceMappingRepository.findByBitbucketWorkspaceUuid(
      bitbucketWorkspaceUuid,
    );

    if (!workspaceMapping) {
      return new WorkspaceMappingTransfer();
    }
    return plainToClass(WorkspaceMappingTransfer, workspaceMapping);
  };

  storeWorkspaceMapping = async (
    bitbucketWorkspaceUuid: string,
    workspaceMappingTransfer: WorkspaceMappingTransfer,
    bitbucketClientKey: string,
  ): Promise<void> => {
    const { openQualityCheckerAdminToken } = { ...workspaceMappingTransfer };

    if (!openQualityCheckerAdminToken) {
      throw new ServiceError(StatusCodes.BAD_REQUEST, ErrorCode.OPEN_QUALITY_CHECKER_ADMIN_TOKEN_REQUIRED);
    }

    let workspaceMapping = await this.workspaceMappingRepository.findByBitbucketWorkspaceUuid(
      bitbucketWorkspaceUuid,
    );

    if (workspaceMapping) {
      workspaceMapping.openQualityCheckerAdminToken = openQualityCheckerAdminToken;
    } else {
      workspaceMapping = new WorkspaceMapping({
        openQualityCheckerAdminToken,
        bitbucketWorkspaceUuid,
      });
    }

    const newWorkspaceMapping = await this.workspaceMappingRepository.save(workspaceMapping);

    const repositoryMapping = await this.rmRepository.findByWorkspaceMappingId(
      newWorkspaceMapping.id as number,
    );

    if (!repositoryMapping) {
      logger.info(
        `[${bitbucketWorkspaceUuid}] No repository mapping yet, starting automatic repository mapping`,
      );
      this.repositoryMappingService
        .automaticRepositoryMapping(
          bitbucketClientKey,
          newWorkspaceMapping.openQualityCheckerAdminToken as string,
          newWorkspaceMapping.id as number,
          bitbucketWorkspaceUuid,
        )
        .then(() => {
          logger.info(`[${bitbucketWorkspaceUuid}] Automatic repository mapping finished`);
        })
        .catch((error) => {
          logger.error(
            `[${bitbucketWorkspaceUuid}] Error occurred during automatic repository mapping`,
            error,
          );
        });
    } else {
      logger.info(
        `[${bitbucketWorkspaceUuid}] Repository mapping found, no automatic repository mapping required`,
      );
    }
  };
}
