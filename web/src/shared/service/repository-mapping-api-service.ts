import { AxiosResponse } from 'axios';
import pluginApi from './plugin-api';
import { RepositoryMapping } from '../model/repository-mapping';

export async function getRepositoryMapping(
  bitbucketRepositoryId: string,
): Promise<RepositoryMapping> {
  const response: AxiosResponse<RepositoryMapping> = await pluginApi.get<RepositoryMapping>(
    `/v1/repositorymappings/${bitbucketRepositoryId}`,
  );

  return response.data;
}

export async function storeRepositoryMapping(
  repositoryMapping: RepositoryMapping,
  bitbucketRepositoryId: string,
): Promise<void> {
  const response: AxiosResponse<void> = await pluginApi.put<void>(
    `/v1/repositorymappings/${bitbucketRepositoryId}`,
    repositoryMapping,
  );

  return response.data;
}
