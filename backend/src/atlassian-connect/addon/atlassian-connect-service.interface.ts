import { RequestHandler } from 'express';

export default interface AtlassianConnectServiceInterface {
  authenticate(): RequestHandler;

  provideClientInfo(): RequestHandler;
}
