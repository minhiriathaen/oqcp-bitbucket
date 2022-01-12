import { Service } from 'typedi';
import openQualityCheckerApi from '../open-quality-checker-api';

@Service()
export default class OpenQualityCheckerAnalysisApiClient {
  subscribe = async (
    userToken: string,
    openQualityCheckerProjectIds: string[],
    sourceBranchName: string,
    targetBranchName: string,
  ): Promise<void> => {
    console.log(
      `CALL POST /api/analysis/subscribe userToken=${userToken}&openQualityCheckerProjectIds=${openQualityCheckerProjectIds}&sourceBranch=${sourceBranchName}&destination=${targetBranchName}`,
    );
    openQualityCheckerApi
      .post<void>(
        '/api/analysis/subscribe',
        {
          openQualityCheckerProjectIds,
          sourceBranchName,
          targetBranchName,
        },
        {
          params: {
            userToken,
          },
        },
      )
      .then(() => {
        console.info(`[${userToken}] Subscribe successfully called`);
      })
      .catch((error) => {
        OpenQualityCheckerAnalysisApiClient.errorCheck(error);
      });
  };

  unsubscribe = async (
    userToken: string,
    openQualityCheckerProjectIds: string[],
    sourceBranchName: string,
    targetBranchName: string,
  ): Promise<void> => {
    console.log(
      `CALL POST /api/analysis/unsubscribe userToken=${userToken}&openQualityCheckerProjectIds=${openQualityCheckerProjectIds}&sourceBranch=${sourceBranchName}&destination=${targetBranchName}`,
    );
    openQualityCheckerApi
      .post<void>(
        '/api/analysis/unsubscribe',
        {
          openQualityCheckerProjectIds,
          sourceBranchName,
          targetBranchName,
        },
        {
          params: {
            userToken,
          },
        },
      )
      .then(() => {
        console.info(`[${userToken}] Unsubscribe successfully called`);
      })
      .catch((error) => {
        OpenQualityCheckerAnalysisApiClient.errorCheck(error);
      });
  };

  /* eslint-disable @typescript-eslint/no-explicit-any */
  private static errorCheck(givenError: any) {
    if (givenError.response) {
      // Request made and server responded
      console.log(givenError.response.data);
      console.log(givenError.response.status);
      console.log(givenError.response.headers);
    } else if (givenError.request) {
      // The request was made but no response was received
      console.log(givenError.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log('Error', givenError.message);
    }
  }
}
