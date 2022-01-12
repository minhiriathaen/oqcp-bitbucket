import { Service } from 'typedi';
import { serialize } from 'class-transformer';
import OpenQualityCheckerGetWarningTransfer from '../transfer/open-quality-checker-get-warning.transfer';
import OpenQualityCheckerWarningListTransfer from '../transfer/open-quality-checker-warning-list.transfer';
import openQualityCheckerApi from '../open-quality-checker-api';

@Service()
export default class OpenQualityCheckerWarningApiClient {
  getWarnings = async (
    userToken: string,
    request: OpenQualityCheckerGetWarningTransfer,
  ): Promise<OpenQualityCheckerWarningListTransfer> => {
    console.info(`[${userToken}] Get warnings:`, serialize(request));

    const response = await openQualityCheckerApi.post(
      '/api/warnings',
      {
        sourceHash: request.sourceHash,
        targetHash: request.targetHash,
        diff: request.diff,
        projectId: request.projectId,
      },
      {
        params: {
          userToken,
        },
      },
    );

    return response.data.data;
  };
}
