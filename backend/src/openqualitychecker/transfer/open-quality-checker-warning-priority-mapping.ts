import AnnotationSeverity from '../../bitbucket/transfer/annotation-severity';

const WarningPriorityMapping: { [key: string]: AnnotationSeverity } = {
  P0: AnnotationSeverity.CRITICAL,
  P1: AnnotationSeverity.HIGH,
  P2: AnnotationSeverity.MEDIUM,
  P3: AnnotationSeverity.MEDIUM,
  P4: AnnotationSeverity.LOW,
};

export default WarningPriorityMapping;
