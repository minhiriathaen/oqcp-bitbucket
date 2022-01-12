import ErrorCode from './error-code';
import errorMessages from './error-messages';

export default class ServiceError extends Error {
  constructor(
    public readonly httpStatusCode: number,
    public readonly errorCode: ErrorCode,
    message?: string,
  ) {
    super(message || errorMessages[errorCode]);
  }
}
