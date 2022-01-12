import { NextFunction, Request, Response } from 'express';
import ErrorCode from './error-code';
import ServiceError from './service-error';

interface ErrorTransfer {
  code: string;
  message: string;
}

export default function handleServiceError(
  error: Error,
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  if (!(error instanceof ServiceError)) {
    console.error('Unhandled error:', error);

    next(error);

    return;
  }

  console.log(`Handling service error: ${error}`);

  const { httpStatusCode, errorCode, message } = error as ServiceError;
  const errorTransfer: ErrorTransfer = {
    code: ErrorCode[errorCode],
    message,
  };

  response.status(httpStatusCode).json(errorTransfer);
}
