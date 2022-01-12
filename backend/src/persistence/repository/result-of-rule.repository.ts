import { Service } from 'typedi';
import ResultOfRule from '../entity/result-of-rule.entity';

@Service()
export default class ResultOfRuleRepository {
  async save(resultOfRule: ResultOfRule): Promise<ResultOfRule> {
    return resultOfRule.save();
  }

  async removeByAnalysisId(analysisId: number): Promise<void> {
    await ResultOfRule.destroy({
      where: {
        analysisId,
      },
    });
  }
}
