import { Service } from 'typedi';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import AtlassianConnectServiceInterface from '../atlassian-connect/addon/atlassian-connect-service.interface';
import AtlassianConnectRequest from '../atlassian-connect/request/atlassian-connect.request';

@Service()
export default class TestAtlassianConnectService implements AtlassianConnectServiceInterface {
  public static TEST_WORKSPACE_ID = 'mocked-workspace-id';

  public static TEST_CLIENT_KEY = 'mocked-bitbucket-client-key';

  public static TEST_OPEN_QUALITY_CHECKER_TOKEN = 'mocked-oqc-token';

  authenticate(): RequestHandler {
    return async (request: Request, response: Response, next: NextFunction): Promise<void> => {
      console.log('Skipping authentication...');
      next();
    };
  }

  provideClientInfo(): RequestHandler {
    return async (request: Request, response: Response, next: NextFunction): Promise<void> => {
      const { context } = request as AtlassianConnectRequest;

      console.log('Using mocked ClientInfo');

      context.clientInfo = {
        principal: {
          uuid: TestAtlassianConnectService.TEST_WORKSPACE_ID,
        },
      };

      context.clientKey = TestAtlassianConnectService.TEST_CLIENT_KEY;

      next();
    };
  }
}
