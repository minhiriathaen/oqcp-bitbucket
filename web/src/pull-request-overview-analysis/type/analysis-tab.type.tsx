/* eslint-disable */

export class AnalysisTab<T> {
  [tabName: string]: T;
}

export class AnalysisTable<T> {
  [rowName: string]: T;
}

export class AnalysisValueByProject<T> {
  [projectId: string]: T;
}

export class AnalysisValue {
  value: number;

  difference: number;

  constructor(value: number, difference: number) {
    this.value = value;
    this.difference = difference;
  }
}

export type AnalysisValueByProjectType = AnalysisValueByProject<AnalysisValue>;

export type AnalysisTableType = AnalysisTable<AnalysisValueByProjectType>;

export type AnalysisTabType = AnalysisTab<AnalysisTableType>;
