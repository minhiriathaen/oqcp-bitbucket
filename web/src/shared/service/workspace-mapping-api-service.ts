import { AxiosResponse } from 'axios';
import pluginApi from './plugin-api';
import { WorkspaceMapping } from '../model/workspace-mapping';

export async function getWorkspaceMapping(): Promise<WorkspaceMapping> {
  const response: AxiosResponse<WorkspaceMapping> = await pluginApi.get<WorkspaceMapping>(
    '/v1/workspacemappings/current',
  );
  return response.data;
}

export async function storeWorkspaceMapping(workspaceMapping: WorkspaceMapping): Promise<void> {
  const response: AxiosResponse<void> = await pluginApi.put<void>(
    '/v1/workspacemappings/current',
    workspaceMapping,
  );
  return response.data;
}
