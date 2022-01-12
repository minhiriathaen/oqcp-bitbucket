import { StatusCodes } from 'http-status-codes';
import { Service } from 'typedi';
import OpenQualityCheckerProject from '../transfer/open-quality-checker-project.transfer';
import { OpenQualityCheckerPagedProjects } from '../transfer/open-quality-checker-result';
import ServiceError from '../../error/service-error';
import ErrorCode from '../../error/error-code';
import openQualityCheckerApi from '../open-quality-checker-api';

const PAGE_SIZE = 100;
const ANALYSIS_TYPE = 'ALL';

@Service()
export default class OpenQualityCheckerProjectApiClient {
  deleteProject = async (userToken: string, projectId: string): Promise<void> => {
    console.info(`[${userToken}] deleteProject`);

    console.log(`CALL DELETE /project/${projectId}`);

    // TODO
    /* const response = await openQualityCheckerApi.delete<OpenQualityCheckerProject[]>(
      `/project/${projectId}`,
      {
        params: {
          userToken,
        },
      },
    ); */
  };

  createNewProject = async (
    userToken: string,
    url: string,
    scm: string,
    fullName: string,
  ): Promise<string[]> => {
    console.info(`[${userToken}] createNewProject`);

    console.log(
      `CALL POST /project/create?analysisType=${ANALYSIS_TYPE}&name=${fullName}&url=${url}}&vcs=${scm}`,
    );

    // TODO
    /* const response = await openQualityCheckerApi.post<OpenQualityCheckerProject[]>(
      `/project/create?analysisType=${ANALYSIS_TYPE}&name=${full_name}&url=${url}}&vcs=${scm}`,
      {
        params: {
          userToken,
        },
      },
    );

    return response.data; */
    return ['teszt_1', 'teszt_2', 'teszt_3'];
  };

  getPrivateProjects = async (userToken: string): Promise<OpenQualityCheckerProject[]> => {
    console.info(`[${userToken}] getPrivateProjects `);

    let page = 1;
    let lastPage = false;
    let openQualityCheckerProjects: OpenQualityCheckerProject[] = [];

    while (!lastPage) {
      // eslint-disable-next-line no-await-in-loop
      const resultWrapper = await this.getPagedProjects(userToken, page);
      page += 1;

      if (!resultWrapper) {
        throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, ErrorCode.OPEN_QUALITY_CHECKER_ERROR);
      }

      const openQualityCheckerResultPage = resultWrapper.data;
      if (openQualityCheckerResultPage) {
        lastPage = openQualityCheckerResultPage.last as boolean;

        const openQualityCheckerProjectList = openQualityCheckerResultPage.content;

        if (openQualityCheckerProjectList) {
          openQualityCheckerProjects = openQualityCheckerProjects.concat(openQualityCheckerProjectList);
        }
      } else {
        lastPage = true;
      }
    }

    return openQualityCheckerProjects;
  };

  private getPagedProjects = async (
    userToken: string,
    page: number,
  ): Promise<OpenQualityCheckerPagedProjects> => {
    console.info(`[${userToken}] getPagedProjects for page ${page}`);

    const response = await openQualityCheckerApi.get<OpenQualityCheckerPagedProjects>(
      `/api/projects?privateOnly=true&size=${PAGE_SIZE}&page=${page}`,
      {
        params: {
          userToken,
        },
      },
    );

    console.info(`[${userToken}] getPagedProjects response`, response.data);

    return response.data;
  };
}
