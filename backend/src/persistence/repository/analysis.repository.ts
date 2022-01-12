import { Service } from 'typedi';
import { Op } from 'sequelize';
import Analysis from '../entity/analysis.entity';
import Metric from '../entity/metrics.entity';
import ResultOfRule from '../entity/result-of-rule.entity';

@Service()
export default class AnalysisRepository {
  async save(analysis: Analysis): Promise<Analysis> {
    return analysis.save();
  }

  async addMetric(analysis: Analysis, metrics: Metric | Metric[]): Promise<unknown> {
    return analysis.$add('metrics', metrics);
  }

  async addResultOfRule(
    analysis: Analysis,
    resultsOfRules: ResultOfRule | ResultOfRule[],
  ): Promise<unknown> {
    return analysis.$add('resultsOfRules', resultsOfRules);
  }

  async find(
    openQualityCheckerProjectId: string | undefined,
    sourceBranch: string | undefined,
    destinationBranch: string | undefined,
    sourceCommit: string | undefined,
    destinationCommit: string | undefined,
  ): Promise<Analysis | null> {
    return Analysis.findOne({
      where: {
        openQualityCheckerProjectId,
        sourceBranch,
        destinationBranch,
        sourceCommit,
        destinationCommit,
      },
    });
  }

  async findByProjectIdsAndBranches(
    openQualityCheckerProjectIds: string[],
    sourceBranch: string,
    destinationBranch: string,
  ): Promise<Analysis[]> {
    return Analysis.findAll({
      where: {
        openQualityCheckerProjectId: {
          [Op.in]: openQualityCheckerProjectIds,
        },
        sourceBranch,
        destinationBranch,
      },
      include: ['metrics'],
    });
  }

  async findByProjectIdsAndBranchesAndCommits(
    openQualityCheckerProjectIds: string[],
    sourceCommit: string,
    sourceBranch: string,
    destinationCommit: string,
    destinationBranch: string,
  ): Promise<Analysis[]> {
    return Analysis.findAll({
      where: {
        openQualityCheckerProjectId: {
          [Op.in]: openQualityCheckerProjectIds,
        },
        sourceBranch,
        destinationBranch,
        sourceCommit,
        destinationCommit,
      },
      include: ['resultsOfRules'],
    });
  }
}
