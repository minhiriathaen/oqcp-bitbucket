import path from 'path';
import { Sequelize } from 'sequelize-typescript';

const {
  POSTGRES_HOST,
  POSTGRES_PORT,
  POSTGRES_DB,
  POSTGRES_USER,
  POSTGRES_PASSWORD,
  POSTGRES_MIN_POOL_SIZE,
  POSTGRES_MAX_POOL_SIZE,
} = process.env;

const sequelize: Sequelize = new Sequelize({
  dialect: 'postgres',
  host: POSTGRES_HOST,
  port: Number(POSTGRES_PORT),
  username: POSTGRES_USER,
  password: POSTGRES_PASSWORD,
  database: POSTGRES_DB,
  pool: {
    min: Number(POSTGRES_MIN_POOL_SIZE),
    max: Number(POSTGRES_MAX_POOL_SIZE),
  },
  models: [path.join(__dirname, 'entity')],
  define: {
    underscored: true,
    freezeTableName: true,
  },
});

export default sequelize;
