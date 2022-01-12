import { AddOn, HostClient } from 'atlassian-connect-express';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import { Inject, Service } from 'typedi';
import { ADDON_TOKEN } from './addon';
import ClientInfo from './client-info';
import AddonSettingRepository from './addon-setting.repository';
import AtlassianConnectRequest from '../request/atlassian-connect.request';
import AtlassianConnectServiceInterface from './atlassian-connect-service.interface';

const skipQshVerification = true;

@Service()
export default class AtlassianConnectService implements AtlassianConnectServiceInterface {
  constructor(
    @Inject(ADDON_TOKEN) private addon: AddOn,
    private addonSettingRepository: AddonSettingRepository,
  ) {}

  getHttpClient(clientKey: string): HostClient {
    return this.addon.httpClient({ clientKey });
  }

  authenticate(): RequestHandler {
    return this.addon.authenticate(skipQshVerification);
  }

  provideClientInfo(): RequestHandler {
    return async (request: Request, response: Response, next: NextFunction): Promise<void> => {
      const { context } = request as AtlassianConnectRequest;
      const { clientKey } = { ...context };

      if (!clientKey) {
        throw new Error('clientKey not found in request context');
      }

      const clientInfo = await this.findClientInfoForClientKey(clientKey);

      if (!clientInfo) {
        throw new Error(`ClientInfo not found for client key: ${clientKey}`);
      }

      context.clientInfo = clientInfo;

      next();
    };
  }

  async findClientInfoForClientKey(clientKey: string): Promise<ClientInfo> {
    const addonSetting = await this.addonSettingRepository.findByClientKeyAndKey(
      clientKey,
      'clientInfo',
    );

    if (!addonSetting) {
      throw new Error(`AddonSetting with 'clientInfo' key not found for client key: ${clientKey}`);
    }

    return addonSetting.val as ClientInfo;
  }

  async findClientKeyForWorkspaceId(workspaceId: string): Promise<string> {
    const addonSetting = await this.addonSettingRepository.findByWorkspaceId(workspaceId);

    if (!addonSetting) {
      throw new Error(`AddonSetting not found for workspace id: ${workspaceId}`);
    }

    return addonSetting.clientKey as string;
  }
}
