import { Exclude, Expose, Transform, Type } from 'class-transformer';

import ResultOfRuleTransfer from './result-of-rule.transfer';
import MetricTransfer from './metric.transfer';

import MetricUtil from '../../../util/metric.util';
import Logger from '../../../util/winston.logger';

const logger = Logger('AnalysisTransfer');

@Exclude()
export default class AnalysisTransfer {
  @Expose()
  projectId?: number;

  @Expose()
  sourceBranchRev?: string;

  @Expose()
  sourceBranchName?: string;

  @Expose()
  targetBranchRev?: string;

  @Expose()
  targetBranchName?: string;

  @Expose()
  @Type(() => MetricTransfer)
  sourceMetrics?: MetricTransfer[];

  @Expose()
  @Transform(({ obj }) =>
    AnalysisTransfer.convertQualification(obj.sourceQualification.qualifications),
  )
  sourceQualification?: Map<string, MetricTransfer>;

  @Expose()
  @Type(() => MetricTransfer)
  targetMetrics?: MetricTransfer[];

  @Expose()
  @Transform(({ obj }) =>
    AnalysisTransfer.convertQualification(obj.targetQualification.qualifications),
  )
  targetQualification?: Map<string, MetricTransfer>;

  @Expose()
  @Transform(({ obj }) => obj.qualityProfileResult.result, {
    toClassOnly: true,
  })
  result?: boolean;

  @Expose()
  @Transform(({ obj }) => obj.qualityProfileResult.resultsOfRules, {
    toClassOnly: true,
  })
  @Type(() => ResultOfRuleTransfer)
  resultsOfRules?: ResultOfRuleTransfer[];

  private static convertQualification = (qualifications: any): Map<string, MetricTransfer> => {
    const result = new Map<string, MetricTransfer>();
    const qualificationKeys = Object.keys(qualifications);

    qualificationKeys.forEach((objectKey) => {
      const transfer = new MetricTransfer();

      const { name } = qualifications[objectKey];

      transfer.name = name;
      transfer.value = qualifications[objectKey].value;

      if (name) {
        transfer.displayName = MetricUtil.findDisplayName(name);
      } else {
        logger.warn(`Display name not found for qualification: ${name}`);
      }

      result.set(transfer.name as string, transfer);
    });

    return result;
  };
}
