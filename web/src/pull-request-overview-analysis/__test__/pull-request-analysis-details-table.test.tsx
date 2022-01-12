import { configure, mount, ReactWrapper, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import React from 'react';
import { projectList } from './mock-analysis-data';
import PullRequestAnalysisDetailsTable from '../component/pull-request-analysis-details-table';
import { DynamicTableStateless } from '@atlaskit/dynamic-table';
import CheckCircleIcon from '@atlaskit/icon/glyph/check-circle';
import JiraFailedBuildStatusIcon from '@atlaskit/icon/glyph/jira/failed-build-status';

configure({ adapter: new Adapter() });

describe('PullRequestAnalysisDetailsTable', () => {
    let component: ReactWrapper;

    it('should render analysis details', async () => {
        component = mount(<PullRequestAnalysisDetailsTable projectList={projectList} />);

        const detailsTableRows = component.find(DynamicTableStateless).props().rows!;

        const commitRowCells = detailsTableRows[0].cells;
        const statusRowCells = detailsTableRows[1].cells;
        const dateRowCells = detailsTableRows[2].cells;
        const analysisResultCells = detailsTableRows[3].cells;

        expect(commitRowCells[4].content).toBe('-');

        expect(statusRowCells[1].content).toBe('In progress');
        expect(statusRowCells[2].content).toBe('Done');
        expect(statusRowCells[3].content).toBe('Done');
        expect(statusRowCells[4].content).toBe('No information');

        expect(dateRowCells[0].content).toBe('Date');
        // TODO fixing locale for tests at least
        // expect(dateRowCells[1].content).toBe('2021-5-3 20:00:04'); // Expected: "2021-05-03 20:00:04"
        // expect(dateRowCells[2].content).toBe('2021-5-3 12:05:50'); // Expected: "2021-05-03 12:05:50"
        // expect(dateRowCells[3].content).toBe('2021-5-3 12:05:02'); // Expected: "2021-05-03 12:05:02"
        expect(dateRowCells[4].content).toBe('-');

        expect(analysisResultCells[0].content).toBe('OpenQualityChecker analysis result');
        expect(shallow(<div>{analysisResultCells[1].content}</div>).find(CheckCircleIcon).exists()).toBe(true);
        expect(shallow(<div>{analysisResultCells[2].content}</div>).find(JiraFailedBuildStatusIcon).exists()).toBe(true);
        expect(shallow(<div>{analysisResultCells[3].content}</div>).find(CheckCircleIcon).exists()).toBe(true);
        expect(analysisResultCells[4].content).toBe('-');
    });
});