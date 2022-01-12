import { Service } from 'typedi';
import OpenQualityCheckerWarningApiClient from './open-quality-checker-warning-api.client';
import OpenQualityCheckerGetWarningTransfer from '../transfer/open-quality-checker-get-warning.transfer';
import OpenQualityCheckerWarningListTransfer from '../transfer/open-quality-checker-warning-list.transfer';

@Service()
export default class OpenQualityCheckerWarningService {
  constructor(private openQualityCheckerWarningApiClient: OpenQualityCheckerWarningApiClient) {}

  getWarnings = async (
    userToken: string,
    request: OpenQualityCheckerGetWarningTransfer,
  ): Promise<OpenQualityCheckerWarningListTransfer> =>
    this.openQualityCheckerWarningApiClient.getWarnings(userToken, request);
}
