import {
  AutoIncrement,
  Column,
  DataType,
  Model,
  NotEmpty,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Exclude, Expose } from 'class-transformer';

const UNIQUE_CONSTRAINT_NAME = 'UNIQUE__METRIC__ANALYSIS_ID__NAME';

@Exclude()
@Table({ tableName: 'metric' })
export default class Metric extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id?: number;

  @Expose()
  @Column({
    type: DataType.BIGINT,
    unique: UNIQUE_CONSTRAINT_NAME,
  })
  analysisId?: number;

  @Expose()
  @NotEmpty
  @Column({
    allowNull: false,
    unique: UNIQUE_CONSTRAINT_NAME,
  })
  name?: string;

  @Expose()
  @Column
  group?: string;

  @Expose()
  @Column({
    type: DataType.FLOAT,
  })
  value?: number;

  @Expose()
  @Column({
    type: DataType.FLOAT,
  })
  difference?: number;

  @Expose()
  @Column({
    type: DataType.BOOLEAN,
    unique: UNIQUE_CONSTRAINT_NAME,
  })
  qualification?: boolean;
}
