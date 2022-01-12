import { Service } from 'typedi';
import { deserialize } from 'class-transformer';
import CreateReportRequest from '../transfer/bitbucket-create-riport.request';
import BitbucketCommitApiClient from './bitbucket-commit-api.client';
import CreateReportResponse from '../transfer/bitbucket-create-riport.response';
import RepositoryMapping from '../../persistence/entity/repository-mapping.entity';
import AnnotationTransfer from '../transfer/bitbucket-annoation.transfer';
import OpenQualityCheckerWarningTransfer from '../../openqualitychecker/transfer/open-quality-checker-warning.transfer';
import ReportType from '../transfer/report-type';
import ReportResult from '../transfer/report-result';
import AnnotationType from '../transfer/annotation-type';
import WarningPriorityMapping from '../../openqualitychecker/transfer/open-quality-checker-warning-priority-mapping';
import BitbucketCommitTransfer from '../transfer/bitbucket-commit-transfer';
import RepositoryMappingRepository from '../../persistence/repository/repository-mapping.repository';
import Analysis from '../../persistence/entity/analysis.entity';
import AnalysisRepository from '../../persistence/repository/analysis.repository';

const REPORT_EXTERNAL_ID = 'open-quality-checker-warning-report-';
const MAX_ANNOTATION_NUMBER_PER_REQUEST = 100;
const MAX_ANNOTATION_NUMBER_PER_REPORT = 1000;

enum OperatorEnum {
  GE = 'greater than or equal to',
  LE = 'less than or equal to',
  EQ = 'equal to',
  GT = 'greater than',
  LT = 'less than',
}

@Service()
export default class BitbucketCommitService {
  constructor(
    private bitbucketCommitApiClient: BitbucketCommitApiClient,
    private repositoryMappingRepository: RepositoryMappingRepository,
    private analysisRepository: AnalysisRepository,
  ) {}

  async getCommitHash(
    clientKey: string,
    workspaceId: string,
    repositoryId: string,
    commitId: string,
  ): Promise<BitbucketCommitTransfer> {
    console.log(`[${repositoryId}] Getting commit hash for commit: ${commitId}`);

    const response: string = await this.bitbucketCommitApiClient.getCommitHash(
      clientKey,
      workspaceId,
      repositoryId,
      commitId,
    );

    return deserialize(BitbucketCommitTransfer, response);
  }

  async createReport(
    clientKey: string,
    repositoryMapping: RepositoryMapping,
    sourceCommit: string,
    sourceBranchName: string,
    destinationCommit: string,
    destinationBranchName: string,
    reportIndex: number,
  ): Promise<string> {
    console.log(
      `[${repositoryMapping.bitbucketRepositoryId}] Creating report for commit: ${sourceCommit}`,
    );

    const request = new CreateReportRequest();
    request.title = `OpenQualityChecker Assessment ${reportIndex}`;
    request.reporter = 'OpenQualityChecker Plugin';
    request.report_type = ReportType.BUG;

    const openQualityCheckerProjectIds = await this.getOpenQualityCheckerProjectIds(repositoryMapping);

    const analysisResult = await this.analysisRepository.findByProjectIdsAndBranchesAndCommits(
      openQualityCheckerProjectIds,
      sourceCommit,
      sourceBranchName,
      destinationCommit,
      destinationBranchName,
    );

    request.result = await this.getReportResultFromAnalyses(
      analysisResult,
      repositoryMapping.bitbucketRepositoryId as string,
    );
    request.details = await this.getResultOfRulesFromAnalyses(analysisResult);

    const response: CreateReportResponse = await this.bitbucketCommitApiClient.createReport(
      clientKey,
      repositoryMapping.workspaceMapping?.bitbucketWorkspaceUuid as string,
      repositoryMapping.bitbucketRepositoryId as string,
      sourceCommit,
      REPORT_EXTERNAL_ID.concat(reportIndex.toString()),
      request,
    );

    return response.uuid as string;
  }

  private getOpenQualityCheckerProjectIds = async (
    repositoryMapping: RepositoryMapping,
  ): Promise<string[]> => {
    let openQualityCheckerProjectIds: string[] = [];

    const repositoryMappings = await this.repositoryMappingRepository.findByWorkspaceAndRepository(
      repositoryMapping.workspaceMappingId as number,
      repositoryMapping.bitbucketRepositoryId as string,
    );

    if (repositoryMappings) {
      openQualityCheckerProjectIds = repositoryMappings.map(
        (mapping) => mapping.openQualityCheckerProjectId,
      ) as string[];
    }
    return openQualityCheckerProjectIds;
  };

  private getReportResultFromAnalyses = async (
    analyses: Analysis[],
    bitbucketRepositoryId: string,
  ): Promise<ReportResult> => {
    const allAnalysesSucceeded = analyses.every((analysis) => analysis.success);

    if (analyses.length === 0) {
      console.log(
        `[${bitbucketRepositoryId}] No analysis found, default report status will be PASSED`,
      );
    }

    return allAnalysesSucceeded ? ReportResult.PASSED : ReportResult.FAILED;
  };

  private getResultOfRulesFromAnalyses = async (analyses: Analysis[]): Promise<string> => {
    let details = '';
    let wasFailed = false;

    analyses.forEach((analysis) => {
      if (!analysis.success && analysis.resultsOfRules && analysis.resultsOfRules?.length !== 0) {
        analysis.resultsOfRules?.forEach((resultsOfRule) => {
          const operator = OperatorEnum[resultsOfRule.operator as keyof typeof OperatorEnum];

          details += `* The ${resultsOfRule.entity} (${resultsOfRule.actualValue}) should be ${operator}
        ${resultsOfRule.value}.`;
        });

        wasFailed = true;
      }
    });

    if (!wasFailed) {
      details = 'No issues were found';
    }

    return details;
  };

  async createAnnotations(
    clientKey: string,
    repositoryMapping: RepositoryMapping,
    commit: string,
    warnings: OpenQualityCheckerWarningTransfer[],
  ): Promise<AnnotationTransfer[]> {
    console.log(
      `[${repositoryMapping.bitbucketRepositoryId}] Creating annotations for commit: ${commit}`,
    );

    let annotationsToCreate: AnnotationTransfer[] = [];
    const createdAnnotations: AnnotationTransfer[] = [];
    const warningIds: string[] = [];
    let skippedWarningCount = 0;

    // eslint-disable-next-line no-restricted-syntax
    for (const warning of warnings) {
      if (warning.tuId && !warningIds.includes(warning.tuId)) {
        const annotation = new AnnotationTransfer();
        annotation.annotation_type = AnnotationType.BUG;
        annotation.external_id = warning.tuId;
        annotation.title = warning.displayName;
        annotation.summary = warning.warningText;
        if (warning.priority) {
          annotation.severity = WarningPriorityMapping[warning.priority];
        }
        annotation.path = warning.lineInfo?.path;
        annotation.line = warning.lineInfo?.line;

        annotationsToCreate.push(annotation);
        warningIds.push(warning.tuId as string);
      } else {
        console.warn(
          `[${repositoryMapping.bitbucketRepositoryId}] Annotation already created for tuid: ${warning.tuId}`,
        );
        // eslint-disable-next-line no-plusplus
        skippedWarningCount++;
      }

      const totalAmountOfAnnotations = createdAnnotations.length + annotationsToCreate.length;

      if (
        annotationsToCreate.length === MAX_ANNOTATION_NUMBER_PER_REQUEST ||
        warnings.length - skippedWarningCount - totalAmountOfAnnotations === 0
      ) {
        const reportId = REPORT_EXTERNAL_ID.concat(
          Math.ceil(totalAmountOfAnnotations / MAX_ANNOTATION_NUMBER_PER_REPORT).toString(),
        );

        console.log(
          `[${repositoryMapping.bitbucketRepositoryId}] Sending create annotation command with report id ${reportId}:`,
        );

        createdAnnotations.push(
          // eslint-disable-next-line no-await-in-loop
          ...(await this.bitbucketCommitApiClient.createAnnotations(
            clientKey,
            repositoryMapping.workspaceMapping?.bitbucketWorkspaceUuid as string,
            repositoryMapping.bitbucketRepositoryId as string,
            commit,
            reportId,
            annotationsToCreate,
          )),
        );

        annotationsToCreate = [];
      }
    }

    console.log(
      `[${repositoryMapping.bitbucketRepositoryId}] ${createdAnnotations.length} annotations created`,
    );

    return createdAnnotations;
  }
}
