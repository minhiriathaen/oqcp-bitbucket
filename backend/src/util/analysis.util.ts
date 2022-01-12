import AnalysisStatus from '../api/analysis/v1/analysis-status';
import Analysis from '../persistence/entity/analysis.entity';
import Logger from './winston.logger';

const logger = Logger('MetricUtil');

export default class AnalysisUtil {
  public static createStatus = (
    analysis: Analysis,
    lastSourceCommit: string,
    lastDestinationCommit: string,
  ): string => {
    logger.info('Calculating status...');

    const sourceUpToDate = analysis.sourceCommit?.startsWith(lastSourceCommit);
    const destinationUpToDate = analysis.destinationCommit?.startsWith(lastDestinationCommit);

    logger.info(
      `Source: ${analysis.sourceCommit} [analysed] ~~~ ${lastSourceCommit} [last in PR] = ${sourceUpToDate}`,
    );
    logger.info(
      `Destination: ${analysis.destinationCommit} [analysed] ~~~ ${lastDestinationCommit} [last in PR] = ${destinationUpToDate}`,
    );

    return sourceUpToDate && destinationUpToDate
      ? AnalysisStatus[AnalysisStatus.DONE]
      : AnalysisStatus[AnalysisStatus.IN_PROGRESS];
  };
}
