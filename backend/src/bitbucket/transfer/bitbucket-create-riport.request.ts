import { Transform } from 'class-transformer';
import ReportResult from './report-result';
import ReportType from './report-type';

export default class CreateReportRequest {
  title?: string;

  details?: string;

  @Transform(({ value }) => ReportType[value])
  report_type?: ReportType;

  reporter?: string;

  link?: string;

  @Transform(({ value }) => ReportResult[value])
  result?: ReportResult;
}
