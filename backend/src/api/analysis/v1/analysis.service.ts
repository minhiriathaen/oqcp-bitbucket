import { Service } from 'typedi';
import { plainToClass, serialize } from 'class-transformer';
import { StatusCodes } from 'http-status-codes';
import { round } from 'lodash';
import AnalysisTransfer from './analysis.transfer';
import AnalysisRepository from '../../../persistence/repository/analysis.repository';
import Analysis from '../../../persistence/entity/analysis.entity';
import MetricRepository from '../../../persistence/repository/metric.repository';
import Metric from '../../../persistence/entity/metrics.entity';
import MetricTransfer from './metric.transfer';
import GetAnalysisResultTransfer from './get-analysis-result.transfer';
import ServiceError from '../../../error/service-error';
import ErrorCode from '../../../error/error-code';
import RepositoryMappingRepository from '../../../persistence/repository/repository-mapping.repository';
import WorkspaceMappingRepository from '../../../persistence/repository/workspace-mapping.repository';
import MetricDifferenceTransfer from './metric-difference.transfer';
import AnalysisStatus from './analysis-status';
import BitbucketPullRequestService from '../../../bitbucket/pullrequest/bitbucket-pullrequest.service';
import WarningService from '../../warning/v1/warning.service';
import QualificationDifferenceTransfer from './qualification-difference.transfer';
import OpenQualityCheckerProjectCache from '../../../openqualitychecker/project/open-quality-checker-project.cache';
import ResultOfRule from '../../../persistence/entity/result-of-rule.entity';
import ResultOfRuleRepository from '../../../persistence/repository/result-of-rule.repository';
import MetricUtil from '../../../util/metric.util';
import getLogger from '../../../util/winston.logger';
import AnalysisUtil from '../../../util/analysis.util';

const logger = getLogger('AnalysisService');

@Service()
export default class AnalysisService {
  constructor(
    private analysisRepository: AnalysisRepository,
    private metricRepository: MetricRepository,
    private resultOfRuleRepository: ResultOfRuleRepository,
    private repositoryMappingRepository: RepositoryMappingRepository,
    private workspaceMappingRepository: WorkspaceMappingRepository,
    private bitbucketPullRequestService: BitbucketPullRequestService,
    private warningService: WarningService,
    private openQualityCheckerProjectCache: OpenQualityCheckerProjectCache,
  ) {}

  storeResults = async (analysisTransfer: AnalysisTransfer): Promise<void> => {
    logger.info(`[${analysisTransfer.projectId}] Storing analysis results`);

    if (!analysisTransfer.sourceBranchName || !analysisTransfer.targetBranchName) {
      logger.warn(
        `[${analysisTransfer.projectId}] Source or target branch is undefined, skipping analysis processing`,
      );
      return;
    }

    const persistentAnalysis = await this.analysisRepository.find(
      (analysisTransfer.projectId as number).toString(),
      analysisTransfer.sourceBranchName,
      analysisTransfer.targetBranchName,
      analysisTransfer.sourceBranchRev,
      analysisTransfer.targetBranchRev,
    );

    if (persistentAnalysis) {
      await this.updateExistingAnalysis(persistentAnalysis, analysisTransfer);
    } else {
      await this.storeNewAnalysis(analysisTransfer);
    }

    logger.info(`[${analysisTransfer.projectId}] Storing analysis results is finished`);

    this.warningService
      .startOpenQualityCheckerWarningProcessing(analysisTransfer)
      .then(() => {
        logger.info(`[${analysisTransfer.projectId}] Analysis successfully post processed`);
      })
      .catch((e) => {
        logger.error(`[${analysisTransfer.projectId}] Error during analysis post processing`, e);
      });
  };

  getResults = async (
    bitbucketClientKey: string,
    bitbucketWorkspaceId: string,
    bitbucketRepositoryId: string | undefined,
    bitbucketPullRequestId: string | undefined,
  ): Promise<GetAnalysisResultTransfer[]> => {
    logger.info(
      `[${bitbucketWorkspaceId}] getResults: '${bitbucketRepositoryId}' and pull request: '${bitbucketPullRequestId}'`,
    );

    if (!bitbucketRepositoryId) {
      throw new ServiceError(StatusCodes.BAD_REQUEST, ErrorCode.BITBUCKET_REPOSITORY_ID_REQUIRED);
    }

    if (!bitbucketPullRequestId) {
      throw new ServiceError(StatusCodes.BAD_REQUEST, ErrorCode.BITBUCKET_PULL_REQUEST_ID_REQUIRED);
    }

    const workspaceMapping = await this.workspaceMappingRepository.findByBitbucketWorkspaceUuid(
      bitbucketWorkspaceId,
    );

    if (!workspaceMapping) {
      throw new ServiceError(StatusCodes.FORBIDDEN, ErrorCode.WORKSPACE_MAPPING_NOT_FOUND);
    }

    const repositoryMappings = await this.repositoryMappingRepository.findByWorkspaceAndRepository(
      workspaceMapping.id as number,
      bitbucketRepositoryId,
    );

    if (!repositoryMappings || repositoryMappings.length === 0) {
      logger.info(`[${bitbucketWorkspaceId}] No repository mapping found for the given workspace'`);
      throw new ServiceError(StatusCodes.NOT_FOUND, ErrorCode.REPOSITORY_MAPPING_NOT_FOUND);
    }

    const openQualityCheckerProjectIds = repositoryMappings.map(
      (repositoryMapping) => repositoryMapping.openQualityCheckerProjectId,
    ) as string[];

    const pullRequestTransfer = await this.bitbucketPullRequestService.getPullRequest(
      bitbucketClientKey,
      bitbucketWorkspaceId,
      bitbucketRepositoryId,
      bitbucketPullRequestId,
    );

    if (!pullRequestTransfer) {
      throw new ServiceError(StatusCodes.NOT_FOUND, ErrorCode.BITBUCKET_API_ERROR);
    }

    logger.info(
      `[${bitbucketWorkspaceId}] Searching Analysis results for OpenQualityChecker projects: ${openQualityCheckerProjectIds}'`,
    );

    const analyses = await this.analysisRepository.findByProjectIdsAndBranches(
      openQualityCheckerProjectIds,
      pullRequestTransfer.sourceBranch as string,
      pullRequestTransfer.destinationBranch as string,
    );

    const analysisMaps = this.collectAnalysesMap(analyses);

    await this.openQualityCheckerProjectCache.init(bitbucketWorkspaceId);

    return openQualityCheckerProjectIds.map((openQualityCheckerProjectId) =>
      this.createAnalysisResultTransfer(
        analysisMaps,
        openQualityCheckerProjectId,
        pullRequestTransfer.sourceCommit,
        pullRequestTransfer.destinationCommit,
        pullRequestTransfer.sourceCommitUrl,
      ),
    ) as GetAnalysisResultTransfer[];
  };

  private createAnalysisResultTransfer = (
    analysisMaps: Map<string, Analysis>,
    openQualityCheckerProjectId: string,
    lastSourceCommit: string | undefined,
    lastDestinationCommit: string | undefined,
    lastSourceCommitUrl: string | undefined,
  ): GetAnalysisResultTransfer => {
    const analysisResultTransfer = new GetAnalysisResultTransfer();
    analysisResultTransfer.projectName = this.openQualityCheckerProjectCache.getProjectName(
      openQualityCheckerProjectId,
    );
    analysisResultTransfer.projectId = openQualityCheckerProjectId;

    const analysis = analysisMaps.get(openQualityCheckerProjectId);
    if (analysis) {
      analysisResultTransfer.commitHash = analysis.sourceCommit;
      if (lastSourceCommitUrl && analysis.sourceCommit) {
        analysisResultTransfer.commitUrl = lastSourceCommitUrl.replace(
          /[^/]+\/?$/,
          analysis.sourceCommit,
        );
      }
      analysisResultTransfer.reportDate = analysis.reportDate;
      analysisResultTransfer.status = AnalysisUtil.createStatus(
        analysis,
        lastSourceCommit as string,
        lastDestinationCommit as string,
      );
      analysisResultTransfer.success = analysis.success;
      this.fillMetricsData(analysisResultTransfer, analysis);
    } else {
      logger.info(
        `No Analysis available for OpenQualityChecker project: ${openQualityCheckerProjectId}, marking as not started`,
      );
      analysisResultTransfer.status = AnalysisStatus[AnalysisStatus.NOT_STARTED];
    }

    return analysisResultTransfer;
  };

  private fillMetricsData = (
    analysisResultTransfer: GetAnalysisResultTransfer,
    analysis: Analysis,
  ) => {
    if (!analysis.metrics) {
      logger.info('No metrics data available in analysis: ', analysis);
      return;
    }

    analysis.metrics.forEach((metric) => {
      if (metric.qualification) {
        const qualificationDifference = new QualificationDifferenceTransfer();
        qualificationDifference.name = metric.name;
        qualificationDifference.value = metric.value;
        qualificationDifference.difference = metric.difference;

        (analysisResultTransfer.qualifications as QualificationDifferenceTransfer[]).push(
          qualificationDifference,
        );
      } else {
        const metricDifference = new MetricDifferenceTransfer();
        metricDifference.name = metric.name;
        metricDifference.value = metric.value;
        metricDifference.difference = metric.difference;
        metricDifference.group = metric.group;

        (analysisResultTransfer.metrics as MetricDifferenceTransfer[]).push(metricDifference);
      }
    });
  };

  private storeNewAnalysis = async (analysisTransfer: AnalysisTransfer): Promise<void> => {
    logger.info(`[${analysisTransfer.projectId}] Saving new analysis`);

    const analysis = plainToClass(Analysis, analysisTransfer);
    analysis.reportDate = new Date();
    analysis.success = !analysisTransfer.result ? false : analysisTransfer.result;

    if (!analysisTransfer.result) {
      logger.warn(`[${analysisTransfer.projectId}] No quality profile result available`);
    }

    await this.analysisRepository.save(analysis);

    await this.saveMetrics(analysisTransfer, analysis);

    await this.saveResultsOfRules(analysisTransfer, analysis);
  };

  private updateExistingAnalysis = async (
    persistentAnalysis: Analysis,
    analysisTransfer: AnalysisTransfer,
  ): Promise<void> => {
    logger.info(`[${analysisTransfer.projectId}] Updating existing analysis`);

    persistentAnalysis.reportDate = new Date();
    persistentAnalysis.success = !analysisTransfer.result ? false : analysisTransfer.result;

    if (!analysisTransfer.result) {
      logger.warn('No quality profile result available');
    }

    await this.analysisRepository.save(persistentAnalysis);
    if (persistentAnalysis.id) {
      logger.info(`[${analysisTransfer.projectId}] Deleting old metrics`);

      await this.metricRepository.removeByAnalysisId(persistentAnalysis.id);
      await this.resultOfRuleRepository.removeByAnalysisId(persistentAnalysis.id);
    }
    await this.saveMetrics(analysisTransfer, persistentAnalysis);

    await this.saveResultsOfRules(analysisTransfer, persistentAnalysis);
  };

  private saveMetrics = async (
    analysisTransfer: AnalysisTransfer,
    analysis: Analysis,
  ): Promise<void> => {
    logger.info(`[${analysisTransfer.projectId}] Saving metrics`);

    const openQualityCheckerProjectId = (analysisTransfer.projectId as number).toString();

    const sourceQualifications = analysisTransfer.sourceQualification;
    const targetQualifications = analysisTransfer.targetQualification;

    logger.debug(
      `[${openQualityCheckerProjectId}] Target Qualification map: ${serialize(targetQualifications)}`,
    );
    logger.debug(
      `[${openQualityCheckerProjectId}] Source Qualification map: ${serialize(sourceQualifications)}`,
    );

    const targetMetrics = this.collectMetricMap(
      openQualityCheckerProjectId,
      analysisTransfer.targetMetrics,
    );
    const sourceMetrics = this.collectMetricMap(
      openQualityCheckerProjectId,
      analysisTransfer.sourceMetrics,
    );

    logger.debug(`[${openQualityCheckerProjectId}] Target Metric map: ${serialize(targetMetrics)}`);
    logger.debug(`[${openQualityCheckerProjectId}] Source Metric map: ${serialize(sourceMetrics)}`);

    let metrics = this.createMetrics(openQualityCheckerProjectId, sourceMetrics, targetMetrics, false);
    const qualifications = this.createMetrics(
      openQualityCheckerProjectId,
      sourceQualifications as Map<string, MetricTransfer>,
      targetQualifications as Map<string, MetricTransfer>,
      true,
    );

    metrics = metrics.concat(qualifications);

    await Promise.all(
      metrics.map(async (metric) => {
        await this.metricRepository.save(metric);
        await this.analysisRepository.addMetric(analysis, metric);
      }),
    );
  };

  private saveResultsOfRules = async (
    analysisTransfer: AnalysisTransfer,
    analysis: Analysis,
  ): Promise<void> => {
    logger.info(
      `[${analysisTransfer.projectId}] Saving results of rules...`,
      analysisTransfer.resultsOfRules,
    );

    const resultsOfRules: ResultOfRule[] = [];
    if (analysisTransfer.resultsOfRules) {
      analysisTransfer.resultsOfRules.forEach((resultOfRule) => {
        resultsOfRules.push(plainToClass(ResultOfRule, resultOfRule));
      });

      await Promise.all(
        resultsOfRules.map(async (resultOfRule) => {
          await this.resultOfRuleRepository.save(resultOfRule);
          await this.analysisRepository.addResultOfRule(analysis, resultOfRule);
        }),
      );

      logger.info(
        `[${analysisTransfer.projectId}] Saved results of rules: ${serialize(resultsOfRules)}`,
      );
    } else {
      logger.info(`[${analysisTransfer.projectId}] There is no result of rule to save `);
    }
  };

  private collectAnalysesMap = (analyses: Analysis[]): Map<string, Analysis> => {
    const result = new Map<string, Analysis>();

    analyses.forEach((analysis) => {
      if (result.has(analysis.openQualityCheckerProjectId as string)) {
        const prevAnalysis = result.get(analysis.openQualityCheckerProjectId as string);

        if (prevAnalysis && (prevAnalysis.reportDate as Date) < (analysis.reportDate as Date)) {
          result.set(analysis.openQualityCheckerProjectId as string, analysis);
        }
      } else {
        result.set(analysis.openQualityCheckerProjectId as string, analysis);
      }
    });

    return result;
  };

  private collectMetricMap = (
    openQualityCheckerProjectId: string,
    metrics: MetricTransfer[] | undefined,
  ): Map<string, MetricTransfer> => {
    const result = new Map<string, MetricTransfer>();

    if (!metrics) {
      logger.warn(`[${openQualityCheckerProjectId}] Metrics list is undefined`);
      return result;
    }

    metrics.forEach((metricTransfer) => {
      if (!metricTransfer.name) {
        logger.warn(`[${openQualityCheckerProjectId}] Metric Transfer name is undefined:`, metricTransfer);
        return;
      }
      result.set(metricTransfer.name, metricTransfer);
    });

    return result;
  };

  private createMetrics = (
    openQualityCheckerProjectId: string,
    sourceMetricTransferMap: Map<string, MetricTransfer>,
    targetMetricTransferMap: Map<string, MetricTransfer>,
    qualification: boolean,
  ): Metric[] => {
    const result: Metric[] = [];

    sourceMetricTransferMap.forEach((sourceMetricTransfer) => {
      if (!sourceMetricTransfer.name) {
        logger.info(`[${openQualityCheckerProjectId}] Source Metric name is undefined`);
        return;
      }

      const targetMetricTransfer = targetMetricTransferMap.get(sourceMetricTransfer.name);

      let targetValue = 0;

      if (targetMetricTransfer) {
        targetValue = targetMetricTransfer.value as number;
      } else {
        logger.info(
          `[${openQualityCheckerProjectId}] Target Metric Transfer is undefined for key ${sourceMetricTransfer.name}, using ${targetValue} as default value`,
        );
      }

      const difference = (sourceMetricTransfer.value as number) - targetValue;

      const metric = new Metric();
      metric.name = sourceMetricTransfer.displayName;
      metric.value = round(sourceMetricTransfer.value as number, 2);
      metric.qualification = qualification;
      metric.difference = round(difference, 2);
      metric.group = qualification ? undefined : MetricUtil.findGroup(sourceMetricTransfer.name);

      logger.debug(`[${openQualityCheckerProjectId}] Metric created: ${serialize(metric)}`);

      result.push(metric);
    });

    return result;
  };
}
