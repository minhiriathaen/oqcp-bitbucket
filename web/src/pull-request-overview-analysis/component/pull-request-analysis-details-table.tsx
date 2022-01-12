import React from 'react';
import { DynamicTableStateless } from '@atlaskit/dynamic-table';
import { RowCellType, RowType } from '@atlaskit/dynamic-table/dist/types/types';
import CheckCircleIcon from '@atlaskit/icon/glyph/check-circle';
import JiraFailedBuildStatusIcon from '@atlaskit/icon/glyph/jira/failed-build-status';
import { G400, R400 } from '@atlaskit/theme/colors';
import { Project } from '../type/project';
import analysisStatusLabels from '../../shared/model/analysis';
import { createTableHead } from '../helper/analysis-converter';

function createRows(projectList: Project[]) {
  const rows: RowType[] = [];

  const commitRowCells: RowCellType[] = [];
  commitRowCells.push({ content: <p className="ellipsis">Last analyzed commit</p> });
  projectList.forEach((project) => {
    commitRowCells.push({
      content: project.commitUrl ? (
        <p className="ellipsis">
          <a href={project.commitUrl} target="_blank" rel="noopener noreferrer">
            {project.commitHash}
          </a>
        </p>
      ) : (
        '-'
      ),
    });
  });

  const statusRowCells: RowCellType[] = [];
  statusRowCells.push({ content: <p className="ellipsis">Analysis status</p> });
  projectList.forEach((project) => {
    statusRowCells.push({ content: project.status ? analysisStatusLabels[project.status] : '-' });
  });

  const dateRowCells: RowCellType[] = [];
  dateRowCells.push({ content: 'Date' });
  projectList.forEach((project) => {
    dateRowCells.push({
      content: project.reportDate ? new Date(project.reportDate).toLocaleString() : '-',
    });
  });

  const analysisResultCells: RowCellType[] = [];
  analysisResultCells.push({ content: 'OpenQualityChecker analysis result' });
  projectList.forEach((project) => {
    if (project.success !== undefined) {
      analysisResultCells.push({
        content: project.success ? (
          <CheckCircleIcon primaryColor={G400} label="Success" />
        ) : (
          <JiraFailedBuildStatusIcon primaryColor={R400} label="Failed" />
        ),
      });
    } else {
      analysisResultCells.push({ content: '-' });
    }
  });

  rows.push({ cells: commitRowCells });
  rows.push({ cells: statusRowCells });
  rows.push({ cells: dateRowCells });
  rows.push({ cells: analysisResultCells });

  return rows;
}

export interface PullRequestAnalysisTableProps {
  projectList: Project[];
}

export default function PullRequestAnalysisDetailsTable({
  projectList,
}: PullRequestAnalysisTableProps): JSX.Element {
  return (
    <DynamicTableStateless
      head={createTableHead(projectList)}
      rows={createRows(projectList)}
      isFixedSize
    />
  );
}
