import ErrorCode from './error-code';

const errorMessages = {
  [ErrorCode.OPEN_QUALITY_CHECKER_ADMIN_TOKEN_REQUIRED]: 'openQualityCheckerAdminToken cannot be empty',
  [ErrorCode.WORKSPACE_MAPPING_NOT_FOUND]: 'Workspace mapping not found',
  [ErrorCode.OPEN_QUALITY_CHECKER_PROJECT_IDS_REQUIRED]: 'openQualityCheckerProjectIds cannot be null',
  [ErrorCode.OPEN_QUALITY_CHECKER_ERROR]: 'Error occurred during calling OpenQualityChecker',
  [ErrorCode.INTERNAL_SERVER_ERROR]: 'Internal server error',
  [ErrorCode.REPOSITORY_MAPPING_NOT_FOUND]: 'No OpenQualityChecker project is mapped',
  [ErrorCode.BITBUCKET_REPOSITORY_ID_REQUIRED]: 'Repository id is required',
  [ErrorCode.BITBUCKET_PULL_REQUEST_ID_REQUIRED]: 'Pull request id is required',
  [ErrorCode.BITBUCKET_API_ERROR]: 'Error occurred during calling Bitbucket API',
};

export default errorMessages;
