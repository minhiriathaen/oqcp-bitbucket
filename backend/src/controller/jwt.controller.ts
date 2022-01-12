import { Request, Response } from 'express';
import { Service } from 'typedi';
import { StatusCodes } from 'http-status-codes';
import { getBitbucketWorkspaceUuid } from '../atlassian-connect/request/atlassian-connect-request.helper';

@Service()
export default class JwtController {
  renewJwt = async (request: Request, response: Response): Promise<void> => {
    const bitbucketWorkspaceUuid = getBitbucketWorkspaceUuid(request);
    console.log(`[${bitbucketWorkspaceUuid}] Renew jwt`);
    response.status(StatusCodes.OK).send();
  };
}
