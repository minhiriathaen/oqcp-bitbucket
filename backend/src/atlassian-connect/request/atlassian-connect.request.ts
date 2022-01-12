import { Request } from 'express';
import ClientInfo from '../addon/client-info';

interface Context {
  clientKey: string;
  clientInfo: ClientInfo;
}

export default interface AtlassianConnectRequest extends Request {
  context: Context;
}
