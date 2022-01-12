/*
   eslint-disable
   @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
 */
import { Service } from 'typedi';
import { promisify } from 'util';
import AtlassianConnectService from '../atlassian-connect/addon/atlassian-connect.service';
import BitbucketApiError from './bitbucket-api.error';

@Service()
export default class BitbucketApiClient {
  constructor(private atlassianConnectService: AtlassianConnectService) {}

  async get<ResultType>(bitbucketClientKey: string, url: string): Promise<ResultType> {
    const httpClient = this.atlassianConnectService.getHttpClient(bitbucketClientKey);
    const get = promisify<any, any>(httpClient.get.bind(httpClient));
    console.log(`[${bitbucketClientKey}] GET ${url}`);
    const response = await get(url);
    return BitbucketApiClient.getResult<ResultType>(bitbucketClientKey, response, 'GET');
  }

  async put<RequestType, ResultType>(
    bitbucketClientKey: string,
    url: string,
    requestBody: RequestType,
  ): Promise<ResultType> {
    const httpClient = this.atlassianConnectService.getHttpClient(bitbucketClientKey);
    const put = promisify<any, any>(httpClient.put.bind(httpClient));
    console.log(`[${bitbucketClientKey}] PUT ${url} body:`, requestBody);
    const response = await put({ url, json: requestBody });
    return BitbucketApiClient.getResult<ResultType>(bitbucketClientKey, response, 'PUT');
  }

  async post<RequestType, ResultType>(
    bitbucketClientKey: string,
    url: string,
    requestBody: RequestType,
  ): Promise<ResultType> {
    const httpClient = this.atlassianConnectService.getHttpClient(bitbucketClientKey);
    const post = promisify<any, any>(httpClient.post.bind(httpClient));
    console.log(`[${bitbucketClientKey}] POST ${url} body:`, requestBody);
    const response = await post({ url, json: requestBody });
    return BitbucketApiClient.getResult<ResultType>(bitbucketClientKey, response, 'POST');
  }

  async delete<ResultType>(bitbucketClientKey: string, url: string): Promise<ResultType> {
    const httpClient = this.atlassianConnectService.getHttpClient(bitbucketClientKey);
    const del = promisify<any, any>(httpClient.del.bind(httpClient));
    console.log(`[${bitbucketClientKey}] DELETE ${url}`);
    const response = await del(url);
    return BitbucketApiClient.getResult<ResultType>(bitbucketClientKey, response, 'DELETE');
  }

  private static getResult<ResultType>(
    bitbucketClientKey: string,
    response: any,
    method: string,
  ): ResultType {
    const { statusCode } = response;
    const { body } = response;
    if (statusCode >= 400) {
      console.warn(`[${bitbucketClientKey}] ${method} response code: ${statusCode}, body:`, body);
      throw new BitbucketApiError(statusCode, body);
    } else {
      console.log(`[${bitbucketClientKey}] ${method} response code: ${statusCode}`);
    }
    return body;
  }
}
