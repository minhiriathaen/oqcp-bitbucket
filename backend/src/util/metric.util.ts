import MetricsGroups from './metrics_groups.json';
import Logger from './winston.logger';

const logger = Logger('MetricUtil');

export default class MetricUtil {
  static findGroup(metricName: string): string | undefined {
    let group;
    MetricsGroups.forEach((element) => {
      if (element.metrics.indexOf(metricName) > -1) {
        group = element.tabname;
      }
    });

    if (!group) {
      logger.warn(`Group NOT found for '${metricName}'`);
    }

    return group;
  }

  static findDisplayName(metricName: string): string | undefined {
    let displayName = this.findGroup(metricName);

    if (!displayName) {
      logger.warn(`Display name NOT found for '${metricName}', falling back to name value`);
      displayName = metricName;
    }

    return displayName;
  }
}
