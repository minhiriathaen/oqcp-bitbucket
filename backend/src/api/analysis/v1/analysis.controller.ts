import { Service } from 'typedi';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { stringify } from 'ts-jest/dist/utils/json';
import { plainToClass } from 'class-transformer';
import AnalysisTransfer from './analysis.transfer';
import AnalysisService from './analysis.service';
import {
  getBitbucketClientKey,
  getBitbucketWorkspaceUuid,
} from '../../../atlassian-connect/request/atlassian-connect-request.helper';

@Service()
export default class AnalysisController {
  constructor(private analysisService: AnalysisService) {}

  storeResults = async (request: Request, response: Response): Promise<void> => {
    console.log('storeResults: ', stringify(request.body));

    const analysisTransfer = plainToClass(AnalysisTransfer, request.body);

    await this.analysisService.storeResults(analysisTransfer);

    response.status(StatusCodes.OK).send();
  };

  getResults = async (request: Request, response: Response): Promise<void> => {
    const bitbucketWorkspaceUuid = getBitbucketWorkspaceUuid(request);
    const bitbucketClientKey = getBitbucketClientKey(request);
    const { repositoryId, pullRequestId } = request.query;

    console.log(
      `[${bitbucketWorkspaceUuid}] GET Analysis results for repository: '${repositoryId}' and pull request: '${pullRequestId}'`,
    );

    const resultTransfer = await this.analysisService.getResults(
      bitbucketClientKey,
      bitbucketWorkspaceUuid,
      repositoryId as string,
      pullRequestId as string,
    );

    response.status(StatusCodes.OK).send(resultTransfer);
  };
}
