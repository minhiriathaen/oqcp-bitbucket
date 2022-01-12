import { Exclude, Expose, Transform } from 'class-transformer';

@Exclude()
export default class BitbucketPullRequestTransfer {
  @Expose()
  id?: string;

  @Expose()
  title?: string;

  @Expose()
  @Transform(({ obj }) => obj.source.branch.name, {
    toClassOnly: true,
  })
  sourceBranch?: string;

  @Expose()
  @Transform(({ obj }) => obj.source.commit.hash, {
    toClassOnly: true,
  })
  sourceCommit?: string;

  @Expose()
  @Transform(({ obj }) => obj.source.commit.links.html.href, {
    toClassOnly: true,
  })
  sourceCommitUrl?: string;

  @Expose()
  @Transform(({ obj }) => obj.destination.branch.name, {
    toClassOnly: true,
  })
  destinationBranch?: string;

  @Expose()
  @Transform(({ obj }) => obj.destination.commit.hash, {
    toClassOnly: true,
  })
  destinationCommit?: string;
}
