import React, { useState, useEffect } from 'react';
import Tabs from '@atlaskit/tabs';
import { TabData } from '@atlaskit/tabs/dist/types/types';
import ErrorCodes from '../../shared/error/error-message';
import SectionMessageBox, { SectionMessageData } from '../../shared/component/section-message-box';
import LoadingIndicator from '../../shared/component/loading-indicator';
import { getErrorCode } from '../../shared/error/error.helper';
import { getAnalysis } from '../../shared/service/open-quality-checker-analysis-api-service';
import { Analysis } from '../../shared/model/analysis';
import PullRequestAnalysisTable from './pull-request-analysis-table';
import {
  getAnalysisProjects,
  transformAnalysisResults,
  QUALIFICATION_TAB_NAME,
} from '../helper/analysis-converter';
import PullRequestAnalysisDetailsTable from './pull-request-analysis-details-table';

const bitbucketRepositoryId = new URLSearchParams(window.location.search).get('repositoryId') || '';
const pullRequestId = new URLSearchParams(window.location.search).get('pullRequestId') || '';

export default function PullRequestOverviewAnalysis(): JSX.Element {
  const [analysisTabs, setAnalysisTabs] = useState<TabData[]>();
  const [loading, setLoading] = useState(true);
  const [sectionMessageData, setSectionMessageData] = useState<SectionMessageData | null>();

  async function load() {
    try {
      const analysisResults: Analysis[] = await getAnalysis(bitbucketRepositoryId, pullRequestId);
      const analysisMap = transformAnalysisResults(analysisResults);
      const projects = getAnalysisProjects(analysisResults);
      const tabs: TabData[] = [];

      tabs.push({
        label: 'Details',
        content: <PullRequestAnalysisDetailsTable projectList={projects} />,
      });

      Object.keys(analysisMap).forEach((key) => {
        tabs.push({
          label: key,
          content: (
            <PullRequestAnalysisTable
              isMetric={QUALIFICATION_TAB_NAME !== key}
              analysisTableMap={analysisMap[key]}
              projectList={projects}
            />
          ),
        });
      });

      setAnalysisTabs(tabs);
      setLoading(false);
    } catch (error) {
      setLoading(false);

      setSectionMessageData({
        title: 'Warning',
        appereance: 'warning',
        body: ErrorCodes[getErrorCode(error, 'CONNECTION_ERROR')],
      });
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <>
      {analysisTabs && <Tabs tabs={analysisTabs} />}
      {sectionMessageData && <SectionMessageBox {...sectionMessageData} />}
    </>
  );
}
