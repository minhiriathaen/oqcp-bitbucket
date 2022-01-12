import { Service } from 'typedi';

import { plainToClass } from 'class-transformer';
import BitbucketCommitService from '../../../bitbucket/commit/bitbucket-commit.service';
import RepositoryMapping from '../../../persistence/entity/repository-mapping.entity';
import OpenQualityCheckerWarningTransfer from '../../../openqualitychecker/transfer/open-quality-checker-warning.transfer';
import OpenQualityCheckerWarningService from '../../../openqualitychecker/warning/open-quality-checker-warning.service';
import OpenQualityCheckerGetWarningTransfer from '../../../openqualitychecker/transfer/open-quality-checker-get-warning.transfer';
import PullRequestDifferenceCalculatorService from './pull-request-difference-calculator.service';
import WorkspaceMapping from '../../../persistence/entity/workspace-mapping.entity';
import AnalysisTransfer from '../../analysis/v1/analysis.transfer';
import AnalysisStatus from '../../analysis/v1/analysis-status';
import getLogger from '../../../util/winston.logger';
import AnalysisUtil from '../../../util/analysis.util';
import Analysis from '../../../persistence/entity/analysis.entity';
import AtlassianConnectService from '../../../atlassian-connect/addon/atlassian-connect.service';
import BitbucketPullRequestService from '../../../bitbucket/pullrequest/bitbucket-pullrequest.service';
import RepositoryMappingRepository from '../../../persistence/repository/repository-mapping.repository';

const logger = getLogger('WarningService');

const MAX_ANNOTATION_NUMBER_PER_REPORT = 1000;

@Service()
export default class WarningService {
  constructor(
    private commitService: BitbucketCommitService,
    private openQualityCheckerWarningService: OpenQualityCheckerWarningService,
    private pullRequestDiffCalculatorService: PullRequestDifferenceCalculatorService,
    private atlassianConnectService: AtlassianConnectService,
    private bitbucketPullRequestService: BitbucketPullRequestService,
    private repositoryMappingRepository: RepositoryMappingRepository,
  ) {}

  startOpenQualityCheckerWarningProcessing = async (analysisTransfer: AnalysisTransfer): Promise<void> => {
    logger.info(`[${analysisTransfer.projectId}] Starting warning processing...`);

    const repositoryMappings = await this.repositoryMappingRepository.findByOpenQualityCheckerProjectId(
      (analysisTransfer.projectId as number).toString(),
    );

    if (!repositoryMappings || repositoryMappings.length === 0) {
      logger.info(
        `[${analysisTransfer.projectId}] No repository mappings found for OpenQualityChecker project: ${analysisTransfer.projectId}`,
      );
      return;
    }

    logger.info(
      `[${analysisTransfer.projectId}] Found RepositoryMappings for OpenQualityChecker project`,
      repositoryMappings,
    );

    const analysis = plainToClass(Analysis, analysisTransfer);

    const bitbucketWorkspaceId = (repositoryMappings[0].workspaceMapping as WorkspaceMapping)
      .bitbucketWorkspaceUuid as string;
    const bitbucketRepositoryId = repositoryMappings[0].bitbucketRepositoryId as string;

    const bbClientKey: string = await this.atlassianConnectService.findClientKeyForWorkspaceId(
      bitbucketWorkspaceId,
    );

    const sourceBranchName = analysisTransfer.sourceBranchName as string;
    const destinationBranchName = analysisTransfer.targetBranchName as string;

    const pullRequestTransfer = await this.bitbucketPullRequestService.getBySourceAndDestination(
      bbClientKey,
      bitbucketWorkspaceId,
      bitbucketRepositoryId,
      sourceBranchName,
      destinationBranchName,
    );

    if (!pullRequestTransfer) {
      logger.info(
        `[${analysisTransfer.projectId}] Open pull request not found in workspace: ${bitbucketWorkspaceId}, and repository: ${bitbucketRepositoryId}. ` +
          `Source branch: ${sourceBranchName}, destination branch: ${destinationBranchName}`,
      );
      return;
    }

    const sourceCommit = pullRequestTransfer.sourceCommit as string;
    const destinationCommit = pullRequestTransfer.destinationCommit as string;

    const finished =
      AnalysisUtil.createStatus(analysis, sourceCommit, destinationCommit) ===
      AnalysisStatus[AnalysisStatus.DONE];

    if (finished) {
      await this.handleFinishedAnalysis(
        bbClientKey,
        repositoryMappings[0],
        pullRequestTransfer.id as string,
        sourceCommit,
        sourceBranchName,
        destinationCommit,
        destinationBranchName,
      );
    }
  };

  private handleFinishedAnalysis = async (
    bitbucketClientKey: string,
    repositoryMapping: RepositoryMapping,
    bitbucketPullRequestId: string,
    sourceCommit: string,
    sourceBranchName: string,
    destinationCommit: string,
    destinationBranchName: string,
  ): Promise<void> => {
    const workspaceId = (repositoryMapping.workspaceMapping as WorkspaceMapping)
      .bitbucketWorkspaceUuid as string;
    const repositoryId = repositoryMapping.bitbucketRepositoryId as string;

    const prDiff = await this.pullRequestDiffCalculatorService.calculatePullRequestDifference(
      bitbucketClientKey,
      workspaceId,
      repositoryId,
      bitbucketPullRequestId,
    );

    const fullSourceHash = await this.commitService.getCommitHash(
      bitbucketClientKey,
      workspaceId,
      repositoryId,
      sourceCommit,
    );
    const fullTargetHash = await this.commitService.getCommitHash(
      bitbucketClientKey,
      workspaceId,
      repositoryId,
      destinationCommit,
    );
    const request = new OpenQualityCheckerGetWarningTransfer();
    request.sourceHash = fullSourceHash.hash;
    request.targetHash = fullTargetHash.hash;
    request.diff = prDiff;
    request.projectId = repositoryMapping.openQualityCheckerProjectId;

    const warningListTransfer = await this.openQualityCheckerWarningService.getWarnings(
      repositoryMapping.workspaceMapping?.openQualityCheckerAdminToken as string,
      request,
    );

    await this.processWarnings(
      bitbucketClientKey,
      repositoryMapping,
      fullSourceHash.hash as string,
      sourceBranchName,
      fullTargetHash.hash as string,
      destinationBranchName,
      warningListTransfer.sourceWarnings,
    );
  };

  private processWarnings = async (
    bitbucketClientKey: string,
    repositoryMapping: RepositoryMapping,
    sourceCommit: string,
    sourceBranchName: string,
    destinationCommit: string,
    destinationBranchName: string,
    warnings: OpenQualityCheckerWarningTransfer[],
  ): Promise<void> => {
    console.log(
      `[${repositoryMapping.bitbucketRepositoryId}] Processing ${warnings.length} warnings`,
    );

    const numberOfReports = Math.ceil(warnings.length / MAX_ANNOTATION_NUMBER_PER_REPORT);

    // eslint-disable-next-line no-plusplus
    for (let i = 1; i <= numberOfReports; i++) {
      // eslint-disable-next-line no-await-in-loop
      const bitbucketReportId = await this.commitService.createReport(
        bitbucketClientKey,
        repositoryMapping,
        sourceCommit,
        sourceBranchName,
        destinationCommit,
        destinationBranchName,
        i,
      );

      console.log(
        `[${repositoryMapping.bitbucketRepositoryId}] Report created: `,
        bitbucketReportId,
      );
    }

    await this.commitService.createAnnotations(
      bitbucketClientKey,
      repositoryMapping,
      sourceCommit,
      warnings,
    );
  };
}
