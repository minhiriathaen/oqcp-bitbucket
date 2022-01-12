import { StatusCodes } from 'http-status-codes';
import { Service } from 'typedi';
import ErrorCode from '../../../error/error-code';
import ServiceError from '../../../error/service-error';
import WorkspaceMappingRepository from '../../../persistence/repository/workspace-mapping.repository';
import OpenQualityCheckerProjectApiClient from '../../../openqualitychecker/project/open-quality-checker-project-api.client';
import RepositoryWebhookTransfer from '../../webhook/repository/v1/repository-webhook.transfer';
import OpenQualityCheckerProjectTransfer from './open-quality-checker-project.transfer';

@Service()
export default class OpenQualityCheckerProjectService {
  constructor(
    private workspaceMappingRepository: WorkspaceMappingRepository,
    private openQualityCheckerProjectApiClient: OpenQualityCheckerProjectApiClient,
  ) {}

  createNewProject = async (
    bitbucketWorkspaceUuid: string,
    repositoryWebhookTransfer: RepositoryWebhookTransfer,
  ): Promise<string[]> => {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { url, full_name, scm } = repositoryWebhookTransfer;

    const workspaceMapping = await this.workspaceMappingRepository.findByBitbucketWorkspaceUuid(
      bitbucketWorkspaceUuid,
    );

    if (!workspaceMapping) {
      throw new ServiceError(StatusCodes.FORBIDDEN, ErrorCode.WORKSPACE_MAPPING_NOT_FOUND);
    }

    return this.openQualityCheckerProjectApiClient.createNewProject(
      workspaceMapping.openQualityCheckerAdminToken as string,
      encodeURIComponent(url as string),
      scm as string,
      (full_name as string).replace(/\//gm, '-'),
    );
  };

  getOpenQualityCheckerProjects = async (
    bitbucketWorkspaceUuid: string,
  ): Promise<OpenQualityCheckerProjectTransfer[]> => {
    const workspaceMapping = await this.workspaceMappingRepository.findByBitbucketWorkspaceUuid(
      bitbucketWorkspaceUuid,
    );

    if (!workspaceMapping) {
      throw new ServiceError(StatusCodes.FORBIDDEN, ErrorCode.WORKSPACE_MAPPING_NOT_FOUND);
    }

    const openQualityCheckerProjects = await this.openQualityCheckerProjectApiClient.getPrivateProjects(
      workspaceMapping.openQualityCheckerAdminToken as string,
    );

    return openQualityCheckerProjects.map((openQualityCheckerProject) => {
      const openQualityCheckerProjectTransfer = new OpenQualityCheckerProjectTransfer();
      openQualityCheckerProjectTransfer.id = openQualityCheckerProject.id?.toString();
      openQualityCheckerProjectTransfer.name = openQualityCheckerProject.projectName;

      return openQualityCheckerProjectTransfer;
    });
  };
}
