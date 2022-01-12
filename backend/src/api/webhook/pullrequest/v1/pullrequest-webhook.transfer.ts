import { Exclude, Expose, Transform } from 'class-transformer';

@Exclude()
export default class PullRequestWebhookTransfer {
  @Expose()
  @Transform(({ obj }) => obj.data.pullrequest.destination.branch.name, {
    toClassOnly: true,
  })
  destinationBranchName?: string;

  @Expose()
  @Transform(({ obj }) => obj.data.pullrequest.source.branch.name, {
    toClassOnly: true,
  })
  sourceBranchName?: string;

  @Expose()
  @Transform(({ obj }) => obj.data.repository.workspace.uuid, {
    toClassOnly: true,
  })
  bitbucketWorkspaceId?: string;

  @Expose()
  @Transform(({ obj }) => obj.data.repository.uuid, {
    toClassOnly: true,
  })
  bitbucketRepositoryId?: string;

  @Expose()
  @Transform(
    ({ obj }) => {
      if (obj.data.pullrequest.id && Number.isFinite(obj.data.pullrequest.id)) {
        return obj.data.pullrequest.id.toString();
      }

      return obj.data.pullrequest.id;
    },
    {
      toClassOnly: true,
    },
  )
  bitbucketId?: string;
}
