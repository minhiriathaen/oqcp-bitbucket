import OpenQualityCheckerWarningLineInfoTransfer from './open-quality-checker-warning-line-info.transfer';

export default class OpenQualityCheckerWarningTransfer {
  tuId?: string;

  priority?: string;

  displayName?: string;

  description?: string;

  helpText?: string;

  warningText?: string;

  lineInfo?: OpenQualityCheckerWarningLineInfoTransfer;
}
