import {
  AutoIncrement,
  Column,
  DataType,
  Index,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

@Table({ tableName: 'AddonSettings', timestamps: false, underscored: false })
export default class AddonSettings extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id?: number;

  @Index
  @Column
  clientKey?: string;

  @Index
  @Column
  key?: string;

  @Column(DataType.JSON)
  val?: unknown;
}
