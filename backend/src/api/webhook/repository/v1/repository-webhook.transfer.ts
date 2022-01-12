import { Exclude, Expose, Transform } from 'class-transformer';

@Exclude()
export default class RepositoryWebhookTransfer {
  @Expose()
  @Transform(({ obj }) => obj.data.repository.uuid, {
    toClassOnly: true,
  })
  repositoryId?: string;

  @Expose()
  @Transform(({ obj }) => obj.data.repository.full_name, {
    toClassOnly: true,
  })
  full_name?: string;

  @Expose()
  @Transform(({ obj }) => obj.data.repository.scm, { toClassOnly: true })
  url?: string;

  @Expose()
  @Transform(({ obj }) => obj.data.repository.links.html.href, { toClassOnly: true })
  scm?: string;
}
