import { Sequelize } from 'sequelize-typescript';
import path from 'path';
import Logger from '../util/winston.logger';

export const WAIT_TIMEOUT = 300;

const logger = Logger('test-sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'src/__tests__/database_test.sqlite:oqcp-bitbucket-memory-db?mode=memory&cache=shared',
  models: [
    path.join(__dirname, '../persistence/entity'),
    path.join(__dirname, '../atlassian-connect/addon/model'),
  ],
  define: {
    underscored: true,
    freezeTableName: true,
  },
});

export async function truncateAll(): Promise<void> {
  logger.info('Truncating tables...');

  await sequelize.truncate();

  logger.info('Truncating finished');
}

export default sequelize;
