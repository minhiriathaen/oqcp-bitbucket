import { Exclude, Expose } from 'class-transformer';

@Exclude()
export default class MetricTransfer {
  @Expose()
  name?: string;

  @Expose()
  displayName?: string;

  @Expose()
  value?: number;

  @Expose()
  package?: string;
}
