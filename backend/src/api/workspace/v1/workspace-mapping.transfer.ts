import { Exclude, Expose } from 'class-transformer';

@Exclude()
export default class WorkspaceMappingTransfer {
  @Expose()
  openQualityCheckerAdminToken?: string;

  @Expose()
  id?: number;
}
