import { Exclude, Expose } from 'class-transformer';

@Exclude()
export default class ResultOfRuleTransfer {
  @Expose()
  actualValue?: number;

  @Expose()
  result?: boolean;

  // Enum values: METRIC, QUALIFICATION_NODE, WARNING, WARNING_CATEGORY
  @Expose()
  type?: string;

  @Expose()
  entity?: string;

  // Json value | Enum value
  // LT         | LESS_THAN
  // LE         | LESS_THAN_EQ
  // GT         | GREATER_THAN
  // GE         | GREATER_THAN_EQ
  // MAINTAIN_LE| MAINTAIN_LE_VALUE
  // MAINTAIN_GE| MAINTAIN_GE_VALUE
  @Expose()
  operator?: string;

  @Expose()
  value?: number;
}
