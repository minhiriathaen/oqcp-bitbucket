import { Application } from 'express';
import Container from 'typedi';
import authenticate from './atlassian-connect/authentication/authentication.middleware';
import LifecycleEventController from './controller/lifecycle-event.controller';
import RepositoryMappingController from './api/repository/v1/repository-mapping.controller';
import OpenQualityCheckerProjectController from './api/project/v1/open-quality-checker-project.controller';
import PullRequestWebhookController from './api/webhook/pullrequest/v1/pullrequest-webhook.controller';
import AnalysisController from './api/analysis/v1/analysis.controller';
import RepositoryWebhookController from './api/webhook/repository/v1/repository-webhook.controller';
import WorkspaceMappingController from './api/workspace/v1/workspace-mapping.controller';
import JwtController from './controller/jwt.controller';

export default function registerRoutes(app: Application): void {
  app.get('/', (request, response) => response.redirect('/atlassian-connect.json'));

  const jwtController = Container.get(JwtController);
  app.get('/renewJwt', authenticate(), jwtController.renewJwt);

  const lifecycleEventController = Container.get(LifecycleEventController);
  app.post('/uninstalled', authenticate(), lifecycleEventController.handleUninstalledEvent);

  const workspaceMappingController = Container.get(WorkspaceMappingController);
  app.get(
    '/v1/workspacemappings/current',
    authenticate(),
    workspaceMappingController.getWorkspaceMapping,
  );
  app.put(
    '/v1/workspacemappings/current',
    authenticate(),
    workspaceMappingController.storeWorkspaceMapping,
  );

  const repositoryController = Container.get(RepositoryMappingController);
  app.get(
    '/v1/repositorymappings/:bitbucketRepositoryId',
    authenticate(),
    repositoryController.getRepositoryMapping,
  );
  app.put(
    '/v1/repositorymappings/:bitbucketRepositoryId',
    authenticate(),
    repositoryController.storeRepositoryMapping,
  );
  const pullRequestController = Container.get(PullRequestWebhookController);
  app.post(
    '/webhook/v1/pullrequest/created',
    authenticate(),
    pullRequestController.pullRequestCreated,
  );

  app.post(
    '/webhook/v1/pullrequest/rejected',
    authenticate(),
    pullRequestController.pullRequestRejected,
  );
  app.post(
    '/webhook/v1/pullrequest/fulfilled',
    authenticate(),
    pullRequestController.pullRequestMerged,
  );
  app.post(
    '/webhook/v1/pullrequest/updated',
    authenticate(),
    pullRequestController.pullRequestUpdated,
  );

  const repositoryWebhookController = Container.get(RepositoryWebhookController);
  app.post(
    '/webhook/v1/repository/created',
    authenticate(),
    repositoryWebhookController.repositoryCreated,
  );

  app.post(
    '/webhook/v1/repository/deleted',
    authenticate(),
    repositoryWebhookController.repositoryDeleted,
  );

  const openQualityCheckerProjectController = Container.get(OpenQualityCheckerProjectController);
  app.get('/v1/projects/openqualitychecker', authenticate(), openQualityCheckerProjectController.getProjects);

  const analysisController = Container.get(AnalysisController);
  app.post('/v1/analyses/results', analysisController.storeResults);
  app.get('/v1/analyses/results', authenticate(), analysisController.getResults);
}
