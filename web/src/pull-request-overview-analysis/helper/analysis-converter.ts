import { HeadCellType, HeadType } from '@atlaskit/dynamic-table/dist/types/types';
import { Analysis } from '../../shared/model/analysis';
import { MetricDifference } from '../../shared/model/metric-difference';
import {
  AnalysisTab,
  AnalysisTable,
  AnalysisTabType,
  AnalysisValue,
  AnalysisValueByProject,
} from '../type/analysis-tab.type';
import { Project } from '../type/project';

export const QUALIFICATION_TAB_NAME = 'Qualification';

let analysisMap: AnalysisTabType;

function createAnalysisGroupTab(
  tabName: string | undefined,
  metricDifference: MetricDifference,
  projectId: string | undefined,
) {
  if (tabName && !analysisMap[tabName]) {
    analysisMap[tabName] = new AnalysisTable();
  }

  if (tabName && metricDifference.name && !analysisMap[tabName][metricDifference.name]) {
    analysisMap[tabName][metricDifference.name] = new AnalysisValueByProject();
  }

  if (
    tabName &&
    metricDifference.name &&
    projectId &&
    metricDifference.value != null &&
    metricDifference.difference != null
  ) {
    analysisMap[tabName][metricDifference.name][projectId] = new AnalysisValue(
      metricDifference.value,
      Number(metricDifference.difference.toFixed(2)),
    );
  }
}

export function transformAnalysisResults(analysisResults: Analysis[]): AnalysisTabType {
  analysisMap = new AnalysisTab();

  analysisResults.forEach((analysis) => {
    analysis.qualifications?.forEach((qualification) => {
      createAnalysisGroupTab(QUALIFICATION_TAB_NAME, qualification, analysis.projectId);
    });

    analysis.metrics?.forEach((metric) => {
      createAnalysisGroupTab(metric.group, metric, analysis.projectId);
    });
  });

  return analysisMap;
}

export function getAnalysisProjects(analysisResults: Analysis[]): Project[] {
  return analysisResults.map(({ qualifications, metrics, ...keepAttrs }) => keepAttrs);
}

export function createTableHead(projectList: Project[]): HeadType {
  const cells: Array<HeadCellType> = [];
  cells.push({ content: '' });

  projectList.forEach((project) => {
    if (project.projectId) {
      cells.push({ content: project.projectName ? project.projectName : project.projectId });
    }
  });

  return { cells };
}
