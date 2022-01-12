/* eslint-disable import/prefer-default-export */
import { AxiosResponse } from 'axios';
import { Analysis } from '../model/analysis';
import pluginApi from './plugin-api';

export async function getAnalysis(
  repositoryId: string,
  pullRequestId: string,
): Promise<Analysis[]> {
  const response: AxiosResponse<Analysis[]> = await pluginApi.get<Analysis[]>(
    `/v1/analyses/results?repositoryId=${repositoryId}&pullRequestId=${pullRequestId}`,
  );

  return response.data;
}
