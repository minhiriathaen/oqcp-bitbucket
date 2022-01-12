import { Service } from 'typedi';
import { StatusCodes } from 'http-status-codes';
import { classToPlain } from 'class-transformer';
import BitbucketApiClient from '../bitbucket-api.client';
import ServiceError from '../../error/service-error';
import ErrorCode from '../../error/error-code';
import CreateReportRequest from '../transfer/bitbucket-create-riport.request';
import CreateReportResponse from '../transfer/bitbucket-create-riport.response';
import AnnotationTransfer from '../transfer/bitbucket-annoation.transfer';
import PagedResponse from '../transfer/bitbucket-paged-response';

const API_ERROR_MESSAGE = 'Bitbucket API error:';

@Service()
export default class BitbucketCommitApiClient {
  constructor(private bitbucketApiClient: BitbucketApiClient) {}

  async getCommitHash(
    clientKey: string,
    workspaceId: string,
    repositoryId: string,
    commitId: string,
  ): Promise<string> {
    const endpointUrl = `2.0/repositories/${workspaceId}/${repositoryId}/commit/${commitId}`;

    try {
      return await this.bitbucketApiClient.get<string>(clientKey, endpointUrl);
    } catch (error) {
      console.error(API_ERROR_MESSAGE, error);
      throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, ErrorCode.BITBUCKET_API_ERROR);
    }
  }

  async createReport(
    clientKey: string,
    workspaceId: string,
    repositoryId: string,
    commitId: string,
    reportId: string,
    createReportRequest: CreateReportRequest,
  ): Promise<CreateReportResponse> {
    const endpointUrl = `2.0/repositories/${workspaceId}/${repositoryId}/commit/${commitId}/reports/${reportId}`;

    try {
      return await this.bitbucketApiClient.put<CreateReportRequest, CreateReportResponse>(
        clientKey,
        endpointUrl,
        classToPlain(createReportRequest),
      );
    } catch (error) {
      console.error(API_ERROR_MESSAGE, error);
      throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, ErrorCode.BITBUCKET_API_ERROR);
    }
  }

  async createAnnotations(
    clientKey: string,
    workspaceId: string,
    repositoryId: string,
    commitId: string,
    reportId: string,
    annotations: AnnotationTransfer[],
  ): Promise<AnnotationTransfer[]> {
    const endpointUrl = `2.0/repositories/${workspaceId}/${repositoryId}/commit/${commitId}/reports/${reportId}/annotations`;

    try {
      const plainAnnotations = annotations.map((annotationClass) => classToPlain(annotationClass));

      return this.bitbucketApiClient.post<AnnotationTransfer[], AnnotationTransfer[]>(
        clientKey,
        endpointUrl,
        plainAnnotations,
      );
    } catch (error) {
      console.error(API_ERROR_MESSAGE, error);
      throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, ErrorCode.BITBUCKET_API_ERROR);
    }
  }

  async getAnnotations(
    clientKey: string,
    workspaceId: string,
    repositoryId: string,
    commitId: string,
    reportId: string,
    pageSize: number,
    page: number,
  ): Promise<PagedResponse<AnnotationTransfer>> {
    const endpointUrl =
      `2.0/repositories/${workspaceId}/${repositoryId}/commit/${commitId}/reports/${reportId}` +
      `/annotations?pagelen=${pageSize}&page=${page}`;

    try {
      return JSON.parse(await this.bitbucketApiClient.get<string>(clientKey, endpointUrl));
    } catch (error) {
      console.error(API_ERROR_MESSAGE, error);
      throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, ErrorCode.BITBUCKET_API_ERROR);
    }
  }

  async deleteAnnotation(
    clientKey: string,
    workspaceId: string,
    repositoryId: string,
    commitId: string,
    reportId: string,
    annotationId: string,
  ): Promise<void> {
    const endpointUrl =
      `2.0/repositories/${workspaceId}/${repositoryId}/commit/${commitId}/reports/${reportId}` +
      `/annotations/${annotationId}`;

    try {
      await this.bitbucketApiClient.delete(clientKey, endpointUrl);
    } catch (error) {
      console.error(API_ERROR_MESSAGE, error);
      throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, ErrorCode.BITBUCKET_API_ERROR);
    }
  }
}
