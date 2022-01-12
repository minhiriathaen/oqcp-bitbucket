import { RequestHandler, Router } from 'express';
import Container from 'typedi';
import AtlassianConnectService from '../addon/atlassian-connect.service';
import TestAtlassianConnectService from '../../__tests__/test-atlassian-connect.service';

export default function authenticate(): RequestHandler {
  const atlassianConnectService = Container.get(
    process.env.NODE_ENV === 'test' ? TestAtlassianConnectService : AtlassianConnectService,
  );

  return Router().use(
    atlassianConnectService.authenticate(),
    atlassianConnectService.provideClientInfo(),
  );
}
