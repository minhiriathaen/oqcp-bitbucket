import OpenQualityCheckerResultPage from './open-quality-checker-result-page.transfer';
import OpenQualityCheckerProject from './open-quality-checker-project.transfer';
import OpenQualityCheckerWarningListTransfer from './open-quality-checker-warning-list.transfer';

export class OpenQualityCheckerResult<DataType> {
  data?: DataType;
}

export type OpenQualityCheckerPagedResult<ContentType> = OpenQualityCheckerResult<
  OpenQualityCheckerResultPage<ContentType>
>;

export type OpenQualityCheckerPagedProjects = OpenQualityCheckerPagedResult<OpenQualityCheckerProject>;

export type OpenQualityCheckerPagedWarningList = OpenQualityCheckerPagedResult<OpenQualityCheckerWarningListTransfer>;
