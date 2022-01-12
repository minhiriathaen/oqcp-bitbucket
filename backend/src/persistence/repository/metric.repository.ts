import { Service } from 'typedi';
import Metric from '../entity/metrics.entity';

@Service()
export default class MetricRepository {
  async save(metric: Metric): Promise<Metric> {
    return metric.save();
  }

  async removeByAnalysisId(analysisId: number): Promise<void> {
    await Metric.destroy({
      where: {
        analysisId,
      },
    });
  }
}
