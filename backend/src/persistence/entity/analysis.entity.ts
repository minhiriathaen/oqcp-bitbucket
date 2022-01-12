import {
  AutoIncrement,
  Column,
  DataType,
  HasMany,
  Model,
  NotEmpty,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Exclude, Expose, Transform } from 'class-transformer';
import Metric from './metrics.entity';
import ResultOfRule from './result-of-rule.entity';

const UNIQUE_CONSTRAINT_NAME = 'UNIQUE__ANALYSIS__SOURCE__DESTINATION_BRANCH__COMMIT';

@Exclude()
@Table({ tableName: 'analysis' })
export default class Analysis extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id?: number;

  @Expose()
  @NotEmpty
  @Transform(({ obj }) => obj.sourceBranchName, {
    toClassOnly: true,
  })
  @Column({
    unique: UNIQUE_CONSTRAINT_NAME,
    allowNull: false,
  })
  sourceBranch?: string;

  @Expose()
  @NotEmpty
  @Transform(({ obj }) => obj.targetBranchName, {
    toClassOnly: true,
  })
  @Column({
    unique: UNIQUE_CONSTRAINT_NAME,
    allowNull: false,
  })
  destinationBranch?: string;

  @NotEmpty
  @Expose({ name: 'sourceBranchRev' })
  @Column({
    unique: UNIQUE_CONSTRAINT_NAME,
    allowNull: false,
  })
  sourceCommit?: string;

  @NotEmpty
  @Expose({ name: 'targetBranchRev' })
  @Column({
    unique: UNIQUE_CONSTRAINT_NAME,
    allowNull: false,
  })
  destinationCommit?: string;

  @Expose({ name: 'success' })
  @Transform(({ obj }) => obj.result, {
    toClassOnly: true,
  })
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  success?: boolean;

  @Column({ type: DataType.DATE, allowNull: false })
  reportDate?: Date;

  @Expose({ name: 'projectId' })
  @Column({
    unique: UNIQUE_CONSTRAINT_NAME,
    allowNull: false,
  })
  openQualityCheckerProjectId?: string;

  @HasMany(() => Metric, {
    foreignKey: { name: 'analysisId' },
  })
  metrics?: Metric[];

  @HasMany(() => ResultOfRule, {
    foreignKey: { name: 'analysisId' },
  })
  resultsOfRules?: ResultOfRule[];
}
