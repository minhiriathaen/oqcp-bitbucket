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

const UNIQUE_CONSTRAINT_NAME = 'UNIQUE__WORKSPACE_ID__REPOSITORY_ID__BITBUCKET_ID';

@Exclude()
@Table({ tableName: 'pullrequest' })
export default class PullRequest extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id?: number;

  @Expose()
  @NotEmpty
  @Column({
    unique: UNIQUE_CONSTRAINT_NAME,
    allowNull: false,
  })
  bitbucketWorkspaceId?: string;

  @Expose()
  @NotEmpty
  @Column({
    unique: UNIQUE_CONSTRAINT_NAME,
    allowNull: false,
  })
  bitbucketRepositoryId?: string;

  @Expose()
  @NotEmpty
  @Column({
    unique: UNIQUE_CONSTRAINT_NAME,
    allowNull: false,
  })
  bitbucketId?: string;

  @Expose()
  @NotEmpty
  @Column({
    allowNull: false,
  })
  destinationBranchName?: string;
}
