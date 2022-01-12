import { Exclude, Expose } from 'class-transformer';

@Exclude()
export default class BitbucketRepositoryTransfer {
  @Expose()
  uuid?: string;

  @Expose()
  hrefs?: string[] = [];

  @Expose()
  name?: string;

  @Expose()
  slug?: string;
}
