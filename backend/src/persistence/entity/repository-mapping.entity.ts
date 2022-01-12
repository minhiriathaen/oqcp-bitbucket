import {
  AutoIncrement,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  NotEmpty,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import WorkspaceMapping from './workspace-mapping.entity';

const UNIQUE_CONSTRAINT_NAME =
  'UNIQUE__REPOSITORY_MAPPING__WORKSPACE_MAPPING_ID__BITBUCKET_REPOSITORY_ID__OPEN_QUALITY_CHECKER_PROJECT_ID';

@Table({ tableName: 'repository_mapping' })
export default class RepositoryMapping extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id?: number;

  @ForeignKey(() => WorkspaceMapping)
  @Column({
    type: DataType.BIGINT,
    unique: UNIQUE_CONSTRAINT_NAME,
  })
  workspaceMappingId?: number;

  @BelongsTo(() => WorkspaceMapping)
  workspaceMapping?: WorkspaceMapping;

  @NotEmpty
  @Column({
    unique: UNIQUE_CONSTRAINT_NAME,
    allowNull: false,
  })
  bitbucketRepositoryId?: string;

  @NotEmpty
  @Column({
    unique: UNIQUE_CONSTRAINT_NAME,
    allowNull: false,
  })
  openQualityCheckerProjectId?: string;
}
