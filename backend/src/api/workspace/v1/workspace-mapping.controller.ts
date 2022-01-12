import { Request, Response } from 'express';
import { Service } from 'typedi';
import { StatusCodes } from 'http-status-codes';
import WorkspaceMappingService from './workspace-mapping.service';
import WorkspaceMappingTransfer from './workspace-mapping.transfer';
import {
  getBitbucketWorkspaceUuid,
  getBitbucketClientKey,
} from '../../../atlassian-connect/request/atlassian-connect-request.helper';

@Service()
export default class WorkspaceMappingController {
  constructor(private workspaceMappingService: WorkspaceMappingService) {}

  getWorkspaceMapping = async (request: Request, response: Response): Promise<void> => {
    const bitbucketWorkspaceUuid = getBitbucketWorkspaceUuid(request);
    const workspaceMappingTransfer = await this.workspaceMappingService.getWorkspaceMapping(
      bitbucketWorkspaceUuid,
    );

    response.status(StatusCodes.OK).json(workspaceMappingTransfer);
  };

  storeWorkspaceMapping = async (request: Request, response: Response): Promise<void> => {
    const bitbucketWorkspaceUuid = getBitbucketWorkspaceUuid(request);
    const bitbucketClientKey = getBitbucketClientKey(request);
    const workspaceMappingTransfer: WorkspaceMappingTransfer = request.body;

    await this.workspaceMappingService.storeWorkspaceMapping(
      bitbucketWorkspaceUuid,
      workspaceMappingTransfer,
      bitbucketClientKey,
    );

    response.status(StatusCodes.OK).send();
  };
}
