import app from './app';
import sequelize from './persistence/sequelize';
import Logger from './util/winston.logger';

// Sync all defined Sequelize models to the DB.
sequelize.sync();

// Boot the HTTP server
app.listen(app.get('port'), () => {
  Logger('server.ts').info('App server is running');
});
