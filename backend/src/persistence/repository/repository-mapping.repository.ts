import { Service } from 'typedi';
import RepositoryMapping from '../entity/repository-mapping.entity';

@Service()
export default class RepositoryMappingRepository {
  async save(repositoryMapping: RepositoryMapping): Promise<RepositoryMapping> {
    return repositoryMapping.save();
  }

  // TODO: lehet nem jo, workspaceMappingId alapján tobb elem is lehet a DB-ben!
  async findByWorkspaceMappingId(workspaceMappingId: number): Promise<RepositoryMapping | null> {
    return RepositoryMapping.findOne({
      where: {
        workspaceMappingId,
      },
    });
  }

  async findByOpenQualityCheckerProjectId(
    openQualityCheckerProjectId: string,
  ): Promise<RepositoryMapping[] | null> {
    return RepositoryMapping.findAll({
      where: {
        openQualityCheckerProjectId,
      },
      include: 'workspaceMapping',
    });
  }

  async findByWorkspaceAndRepository(
    workspaceMappingId: number,
    bitbucketRepositoryId: string,
  ): Promise<RepositoryMapping[] | null> {
    return RepositoryMapping.findAll({
      where: {
        workspaceMappingId,
        bitbucketRepositoryId,
      },
      include: 'workspaceMapping',
    });
  }

  async destroyByWorkspaceMappingIdAndOpenQualityCheckerProjectIdIn(
    workspaceMappingId: number,
    openQualityCheckerProjectIds: string[],
  ): Promise<void> {
    await RepositoryMapping.destroy({
      where: {
        workspaceMappingId,
        openQualityCheckerProjectId: openQualityCheckerProjectIds,
      },
    });
  }
}
