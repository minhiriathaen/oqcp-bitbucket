/* eslint-disable import/prefer-default-export */
import { AxiosError } from 'axios';
import ErrorCodes from './error-message';

export function getErrorCode(
  error: AxiosError,
  defaultErrorCode: keyof typeof ErrorCodes,
): keyof typeof ErrorCodes {
  let errorCode: keyof typeof ErrorCodes;

  if (error.response?.data.code) {
    errorCode = error.response.data.code;
  } else {
    errorCode = defaultErrorCode;
  }

  return errorCode;
}
