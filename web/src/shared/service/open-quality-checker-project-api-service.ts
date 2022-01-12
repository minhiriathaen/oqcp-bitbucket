/* eslint-disable import/prefer-default-export */
import { AxiosResponse } from 'axios';
import { OpenQualityCheckerProject } from '../model/open-quality-checker-project';
import pluginApi from './plugin-api';

export async function getProjects(): Promise<OpenQualityCheckerProject[]> {
  const response: AxiosResponse<OpenQualityCheckerProject[]> = await pluginApi.get<OpenQualityCheckerProject[]>(
    '/v1/projects/openqualitychecker',
  );

  return response.data;
}
