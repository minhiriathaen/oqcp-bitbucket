import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Service } from 'typedi';
import { getBitbucketWorkspaceUuid } from '../../../atlassian-connect/request/atlassian-connect-request.helper';
import OpenQualityCheckerProjectService from './open-quality-checker-project.service';

@Service()
export default class OpenQualityCheckerProjectController {
  constructor(private openQualityCheckerProjectService: OpenQualityCheckerProjectService) {}

  getProjects = async (request: Request, response: Response): Promise<void> => {
    const bitbucketWorkspaceUuid = getBitbucketWorkspaceUuid(request);
    const openQualityCheckerProjects = await this.openQualityCheckerProjectService.getOpenQualityCheckerProjects(
      bitbucketWorkspaceUuid,
    );

    response.status(StatusCodes.OK).json(openQualityCheckerProjects);
  };
}
