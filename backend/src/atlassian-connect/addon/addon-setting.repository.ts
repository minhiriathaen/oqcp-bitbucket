import { AddOn } from 'atlassian-connect-express';
import { ModelCtor } from 'sequelize/types';
import { Inject, Service } from 'typedi';
import { ADDON_TOKEN } from './addon';
import AddonSettings from './model/addon-setting.model';

@Service()
export default class AddonSettingRepository {
  private addonSettingModel: ModelCtor<AddonSettings>;

  constructor(@Inject(ADDON_TOKEN) private addon: AddOn) {
    this.addonSettingModel = this.addon.schema.models.AddonSetting as ModelCtor<AddonSettings>;
  }

  async findByClientKeyAndKey(clientKey: string, key: string): Promise<AddonSettings | null> {
    return this.addonSettingModel.findOne({
      where: { clientKey, key },
    });
  }

  async findByWorkspaceId(workspaceId: string): Promise<AddonSettings | null> {
    return this.addonSettingModel.findOne({
      where: { key: 'clientInfo', val: { principal: { uuid: workspaceId } } },
    });
  }
}
