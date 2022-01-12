import 'reflect-metadata';
import 'express-async-errors';

// We need a few stock Node modules
import path from 'path';

// Express is the underlying web framework: https://expressjs.com
import express, { Application } from 'express';

// https://expressjs.com/en/guide/using-middleware.html
import bodyParser from 'body-parser';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import errorHandler from 'errorhandler';

// atlassian-connect-express also provides a middleware
import createAddOn, { AddOn } from 'atlassian-connect-express';
import registerRoutes from './routes';
import handleServiceError from './error/service-error-handler.middleware';
import { setAddonInContainer } from './atlassian-connect/addon/addon';
import getMorganMiddleware from './util/morgan.middleware';
import getLogger from './util/winston.logger';

// Bootstrap Express and atlassian-connect-express
const app: Application = express();
const addon: AddOn = createAddOn(app);
const logger = getLogger('app.ts');

// See config.json
const port = addon.config.port();
app.set('port', port);

// Log requests, using an appropriate formatter by env
const developmentMode = app.get('env') === 'development';
app.use(getMorganMiddleware(developmentMode));

// Include request parsers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Gzip responses when appropriate
app.use(compression());

// Use api.bitbucket.org instead of the deprecated bitbucket.org/api
app.post('/installed', (request, response, next) => {
  request.body.baseUrl = request.body.baseApiUrl;
  next();
});

// Include atlassian-connect-express middleware
app.use(addon.middleware());
setAddonInContainer(addon);

// Mount the static files directory
// Anything in ./public is served up as static content
const staticDir = path.join(__dirname, 'public');
app.use(express.static(staticDir));

// Show nicer errors in dev mode
if (developmentMode) {
  app.use(errorHandler());
}

// Wire up routes
registerRoutes(app);

// Mapping service errors to HTTP responses
app.use(handleServiceError);

logger.info(
  `Express app created with env ${process.env.NODE_ENV}, development mode is${
    developmentMode ? '' : ' NOT'
  } active`,
);

export default app;
