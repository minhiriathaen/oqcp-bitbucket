/* eslint-disable import/prefer-default-export */

import { Request } from 'express';
import AtlassianConnectRequest from './atlassian-connect.request';

export function getBitbucketWorkspaceUuid(request: Request): string {
  const { context } = request as AtlassianConnectRequest;
  return context?.clientInfo?.principal?.uuid;
}

export function getBitbucketClientKey(request: Request): string {
  const { context } = request as AtlassianConnectRequest;
  return context?.clientKey;
}
