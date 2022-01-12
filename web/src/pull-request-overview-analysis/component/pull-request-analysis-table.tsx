import React from 'react';
import { DynamicTableStateless } from '@atlaskit/dynamic-table';
import { RowCellType, RowType } from '@atlaskit/dynamic-table/dist/types/types';
import Lozenge, { ThemeAppearance } from '@atlaskit/lozenge';
import ArrowUpIcon from '@atlaskit/icon/glyph/arrow-up';
import ArrowDownIcon from '@atlaskit/icon/glyph/arrow-down';
import EditorDividerIcon from '@atlaskit/icon/glyph/editor/divider';
import {
  AnalysisValueByProjectType,
  AnalysisTableType,
  AnalysisValue,
} from '../type/analysis-tab.type';
import { Project } from '../type/project';
import { createTableHead } from '../helper/analysis-converter';

function getAppearance(isMetric: boolean, analysisvalue: AnalysisValue): ThemeAppearance {
  if (isMetric) {
    return 'default';
  }
  if (analysisvalue.difference < 0) {
    return 'removed';
  }
  if (analysisvalue.difference === 0) {
    return 'moved';
  }
  return 'success';
}

function getDifferenceIcon(analysisvalue: AnalysisValue): JSX.Element {
  if (analysisvalue.difference < 0) {
    return <ArrowDownIcon label="down" size="small" />;
  }
  if (analysisvalue.difference === 0) {
    return <EditorDividerIcon label="unchanged" size="small" />;
  }
  return <ArrowUpIcon label="up" size="small" />;
}

function createRow(
  isMetric: boolean,
  analysisValues: AnalysisValueByProjectType,
  analysisName: string,
  projectList: Project[],
): RowType {
  const cells: Array<RowCellType> = [];
  cells.push({ content: <p className="ellipsis">{analysisName}</p> });

  projectList.forEach((project) => {
    if (project.projectId) {
      const analysisvalue = analysisValues[project.projectId];
      if (analysisvalue) {
        cells.push({
          content: (
            <>
              <div>{analysisvalue.value}</div>
              <Lozenge appearance={getAppearance(isMetric, analysisvalue)}>
                <span style={{ verticalAlign: 'text-bottom' }}>
                  {getDifferenceIcon(analysisvalue)}
                </span>
                {analysisvalue.difference}
              </Lozenge>
            </>
          ),
        });
      } else {
        cells.push({ content: '-' });
      }
    }
  });

  return { cells };
}

export interface PullRequestAnalysisTableProps {
  isMetric: boolean;
  analysisTableMap: AnalysisTableType;
  projectList: Project[];
}

export default function PullRequestAnalysisTable({
  isMetric,
  analysisTableMap,
  projectList,
}: PullRequestAnalysisTableProps): JSX.Element {
  const rows: Array<RowType> = [];

  Object.keys(analysisTableMap).forEach((key) => {
    rows.push(createRow(isMetric, analysisTableMap[key], key, projectList));
  });

  return <DynamicTableStateless head={createTableHead(projectList)} rows={rows} isFixedSize />;
}
