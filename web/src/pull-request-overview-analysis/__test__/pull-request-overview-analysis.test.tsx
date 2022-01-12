import { configure, mount, ReactWrapper } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import React from 'react';
import { mocked } from 'ts-jest/utils';
import LoadingIndicator from '../../shared/component/loading-indicator';
import PullRequestOverviewAnalysis from '../component/pull-request-overview-analysis';
import { getAnalysis } from '../../shared/service/open-quality-checker-analysis-api-service';
import { mockAnalysisResult } from './mock-analysis-data';
import { act } from 'react-dom/test-utils';
import { getErrorCode } from '../../shared/error/error.helper';
import SectionMessageBox from '../../shared/component/section-message-box';
import Tabs from '@atlaskit/tabs';

jest.mock('../../shared/service/open-quality-checker-analysis-api-service');
const mockedGetAnalysis = mocked(getAnalysis);

jest.mock('../../shared/error/error.helper');
const mockedErrorHelper = mocked(getErrorCode);

configure({ adapter: new Adapter() });

describe('PullRequestOverviewAnalysis', () => {
    let component: ReactWrapper;

    it('should render a LoadingIndicator when loads', async () => {
        component = mount(<PullRequestOverviewAnalysis />);

        expect(component.find(LoadingIndicator).exists()).toBe(true);
    });


    it('should render tabs when got analysis ', async () => {
        mockedGetAnalysis.mockResolvedValue(mockAnalysisResult);

        component = mount(<PullRequestOverviewAnalysis />);

        await act(async () => {
            await Promise.resolve(component);
            await new Promise(resolve => setImmediate(resolve));

            component.update();
        });
        expect(component.find(Tabs));
    });

    it('should show connection error message box if getAnalysis rest api throws connection error', async () => {
        mockedGetAnalysis.mockRejectedValueOnce(new Error());
        mockedErrorHelper.mockReturnValue('CONNECTION_ERROR');

        component = mount(<PullRequestOverviewAnalysis />);

        await act(async () => {
            await Promise.resolve(component);
            await new Promise(resolve => setImmediate(resolve));

            component.update();
        });

        const expectedMessage = 'We are unable to connect to the server at this time.';

        expect(component.find(SectionMessageBox).props().body).toBe(expectedMessage);
    });

    it('should show warning message box that no project is attached if getAnalysis rest api throws repository mapping not found error', async () => {
        mockedGetAnalysis.mockRejectedValueOnce(new Error());
        mockedErrorHelper.mockReturnValue('REPOSITORY_MAPPING_NOT_FOUND');

        component = mount(<PullRequestOverviewAnalysis />);

        await act(async () => {
            await Promise.resolve(component);
            await new Promise(resolve => setImmediate(resolve));

            component.update();
        });

        const expectedMessage = 'There is no attached OpenQualityChecker project.';

        expect(component.find(SectionMessageBox).props().body).toBe(expectedMessage);
    });
});