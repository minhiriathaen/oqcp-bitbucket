import {
  AutoIncrement,
  Column,
  DataType,
  Model,
  NotEmpty,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

const UNIQUE_CONSTRAINT_NAME = 'UNIQUE__RESULT_OF_RULE__TYPE__ENTITY__ANALYSIS_ID';

@Table({ tableName: 'result_of_rule' })
export default class ResultOfRule extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id?: number;

  @Column({
    type: DataType.BIGINT,
    unique: UNIQUE_CONSTRAINT_NAME,
  })
  analysisId?: number;

  @Column({
    type: DataType.FLOAT,
  })
  actualValue?: number;

  @Column
  result?: boolean;

  @NotEmpty
  @Column({
    unique: UNIQUE_CONSTRAINT_NAME,
    allowNull: false,
  })
  type?: string;

  @NotEmpty
  @Column({
    unique: UNIQUE_CONSTRAINT_NAME,
    allowNull: false,
  })
  entity?: string;

  @NotEmpty
  @Column({
    allowNull: false,
  })
  operator?: string;

  @Column({
    type: DataType.FLOAT,
  })
  value?: number;
}
