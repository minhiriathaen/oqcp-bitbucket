import { serialize } from 'class-transformer';
import AddonSettings from '../atlassian-connect/addon/model/addon-setting.model';
import TestAtlassianConnectService from './test-atlassian-connect.service';
import Logger from '../util/winston.logger';

const logger = Logger('TestUtil');

export default class TestUtil {
  static async mockAddonSettings(): Promise<void> {
    // eslint-disable-next-line no-return-await

    try {
      logger.info('Mocking AddonSettings...');

      const alreadyExisting = await AddonSettings.findOne({
        where: { clientKey: TestAtlassianConnectService.TEST_CLIENT_KEY },
      });

      if (alreadyExisting) {
        logger.info('AddonSettings already exists');
      } else {
        await AddonSettings.create({
          clientKey: TestAtlassianConnectService.TEST_CLIENT_KEY,
          key: 'clientInfo',
          val: {
            principal: {
              uuid: TestAtlassianConnectService.TEST_WORKSPACE_ID,
            },
            baseUrl: process.env.BB_BASE_URL,
            sharedSecret: 'sharedSecret',
          },
        });

        logger.info('AddonSettings mocked succesfully');
      }
    } catch (error) {
      logger.error(`Error during mocking AddonSettings: ${serialize(error)}`);
    }
  }

  static async timeout(ms: number) {
    await new Promise<void>((resolve) =>
      setTimeout(() => {
        resolve();
      }, ms),
    ).then(() => console.log(`Timeout expired after ${ms} ms`));
  }
}
