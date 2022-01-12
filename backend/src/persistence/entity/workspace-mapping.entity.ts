import {
  Table,
  Model,
  Column,
  PrimaryKey,
  AutoIncrement,
  NotEmpty,
  Unique,
  DataType,
} from 'sequelize-typescript';

@Table({ tableName: 'workspace_mapping' })
export default class WorkspaceMapping extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id?: number;

  @Unique
  @NotEmpty
  @Column({
    allowNull: false,
  })
  bitbucketWorkspaceUuid?: string;

  @NotEmpty
  @Column({
    allowNull: false,
  })
  openQualityCheckerAdminToken?: string;
}
