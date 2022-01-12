import { Transform } from 'class-transformer';
import AnnotationSeverity from './annotation-severity';
import AnnotationType from './annotation-type';

export default class AnnotationTransfer {
  uuid?: string;

  external_id?: string;

  title?: string;

  @Transform(({ value }) => AnnotationType[value])
  annotation_type?: AnnotationType;

  summary?: string;

  @Transform(({ value }) => AnnotationSeverity[value])
  severity?: AnnotationSeverity;

  path?: string;

  line?: number;
}
