import morgan, { StreamOptions } from 'morgan';
import getLogger from './winston.logger';

const logger = getLogger('Morgan');

// Override the stream method by telling
// Morgan to use our custom logger instead of the console.log.
const stream: StreamOptions = {
  // Use the http severity
  write: (message) => logger.http(message),
};

export default function getMorganMiddleware(developmentMode: boolean) {
  return morgan(
    // Define message format string (this is the default one).
    // The message format is made from tokens, and each token is
    // defined inside the Morgan library.
    // You can create your custom token to show what do you want from a request.
    developmentMode ? 'dev' : 'combined',
    // Options: in this case, I overwrote the stream and the skip logic.
    // See the methods above.
    { stream },
  );
}
