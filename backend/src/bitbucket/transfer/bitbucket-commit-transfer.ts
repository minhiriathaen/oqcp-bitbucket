import { Exclude, Expose } from 'class-transformer';

@Exclude()
export default class BitbucketCommitTransfer {
  @Expose()
  hash?: string;
}
