import { Service } from 'typedi';
import PullRequest from '../entity/pullrequest.entity';

@Service()
export default class PullRequestRepository {
  async save(pullRequest: PullRequest): Promise<PullRequest> {
    return pullRequest.save();
  }

  async remove(bitbucketId: string, repositoryId: string, workspaceId: string): Promise<void> {
    await PullRequest.destroy({
      where: {
        bitbucketId,
        bitbucketRepositoryId: repositoryId,
        bitbucketWorkspaceId: workspaceId,
      },
    });
  }

  async find(
    bitbucketId: string,
    repositoryId: string,
    workspaceId: string,
  ): Promise<PullRequest | null> {
    return PullRequest.findOne({
      where: {
        bitbucketId,
        bitbucketRepositoryId: repositoryId,
        bitbucketWorkspaceId: workspaceId,
      },
    });
  }

  async updateDestinationBranch(
    pullRequestId: number,
    newDestinationBranch: string,
  ): Promise<void> {
    await PullRequest.update(
      { destinationBranchName: newDestinationBranch },
      {
        where: {
          id: pullRequestId,
        },
      },
    );
  }
}
