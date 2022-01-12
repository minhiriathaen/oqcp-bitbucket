import { Service } from 'typedi';
import OpenQualityCheckerProjectService from '../../api/project/v1/open-quality-checker-project.service';
import OpenQualityCheckerProjectTransfer from '../../api/project/v1/open-quality-checker-project.transfer';

@Service()
export default class OpenQualityCheckerProjectCache {
  cache: Map<string, OpenQualityCheckerProjectTransfer> | undefined;

  bitbucketWorkspaceUuid: string | undefined;

  constructor(private projectService: OpenQualityCheckerProjectService) {}

  public init = async (bitbucketWorkspaceUuid: string): Promise<void> => {
    console.log(`[${bitbucketWorkspaceUuid}] Initializing project list`);

    this.cache = new Map<string, OpenQualityCheckerProjectTransfer>();
    this.bitbucketWorkspaceUuid = bitbucketWorkspaceUuid;

    const projects = await this.projectService.getOpenQualityCheckerProjects(bitbucketWorkspaceUuid);

    projects.forEach((project) => {
      if (project.id) {
        (this.cache as Map<string, OpenQualityCheckerProjectTransfer>).set(project.id, project);
      }
    });

    console.log(`[${bitbucketWorkspaceUuid}] ${this.cache.size} projects are cached`);
  };

  public getProjectName = (projectId: string): string | undefined => {
    if (!this.cache) {
      throw new Error('Cache is not initialized, call init method first');
    }

    console.log(`[${this.bitbucketWorkspaceUuid}] Getting project for id: ${projectId}`);

    if ((this.cache as Map<string, OpenQualityCheckerProjectTransfer>).has(projectId)) {
      console.log(`[${this.bitbucketWorkspaceUuid}] Project for id: ${projectId} found in cache`);
      return ((this.cache as Map<string, OpenQualityCheckerProjectTransfer>).get(
        projectId,
      ) as OpenQualityCheckerProjectTransfer).name;
    }

    console.warn(
      `[${this.bitbucketWorkspaceUuid}] Project for id: ${projectId} NOT found in cache`,
    );

    return undefined;
  };
}
