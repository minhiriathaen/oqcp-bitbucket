import { Service } from 'typedi';
import WorkspaceMapping from '../entity/workspace-mapping.entity';

@Service()
export default class WorkspaceMappingRepository {
  async findByBitbucketWorkspaceUuid(
    bitbucketWorkspaceUuid: string,
  ): Promise<WorkspaceMapping | null> {
    return WorkspaceMapping.findOne({
      where: { bitbucketWorkspaceUuid },
    });
  }

  async save(workspaceMapping: WorkspaceMapping): Promise<WorkspaceMapping> {
    return workspaceMapping.save();
  }
}
