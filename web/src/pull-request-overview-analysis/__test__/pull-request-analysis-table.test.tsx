import { configure, mount, ReactWrapper } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import React from 'react';
import { AnalysisTableType } from '../type/analysis-tab.type';
import PullRequestAnalysisTable from '../component/pull-request-analysis-table';
import { projectList } from './mock-analysis-data';
import Lozenge from '@atlaskit/lozenge';
import ArrowUpIcon from '@atlaskit/icon/glyph/arrow-up';
import ArrowDownIcon from '@atlaskit/icon/glyph/arrow-down';
import EditorDividerIcon from '@atlaskit/icon/glyph/editor/divider';

configure({ adapter: new Adapter() });

describe('PullRequestAnalysisTable', () => {
    let component: ReactWrapper;

    it('should render analysis table with metrics', async () => {
        const mockAnalysisTableMap: AnalysisTableType = {
            'Average Number Of Added Lines': {
                '203': {
                    'value': 24,
                    'difference': 4
                },
                '212': {
                    'value': 23,
                    'difference': 0
                }
            },
            'Other process': {
                '203': {
                    'value': 24,
                    'difference': 4
                },
                '6502': {
                    'value': 1,
                    'difference': -2
                }
            }
        };

        component = mount(<PullRequestAnalysisTable isMetric={true} analysisTableMap={mockAnalysisTableMap} projectList={projectList} />);

        expect(component.find(Lozenge)).toHaveLength(4);

        expect(component.find(Lozenge).at(0).props().appearance).toBe('default');
        expect(component.find(Lozenge).at(0).find(ArrowUpIcon).exists()).toBe(true);

        expect(component.find(Lozenge).at(1).props().appearance).toBe('default');
        expect(component.find(Lozenge).at(1).find(EditorDividerIcon).exists()).toBe(true);

        expect(component.find(Lozenge).at(2).props().appearance).toBe('default');
        expect(component.find(Lozenge).at(2).find(ArrowUpIcon).exists()).toBe(true);

        expect(component.find(Lozenge).at(3).props().appearance).toBe('default');
        expect(component.find(Lozenge).at(3).find(ArrowDownIcon).exists()).toBe(true);
    });

    it('should render analysis table with qualification', async () => {
        const mockAnalysisTableMap: AnalysisTableType = {
            'Clone Complexity': {
                '203': {
                    'value': 6.18,
                    'difference': 0
                }
            },
            'Minor Warnings': {
                '203': {
                    'value': 2.12,
                    'difference': 1.02
                }
            },
            'Other qualification': {
                '212': {
                    'value': 4.56,
                    'difference': -2.1
                }
            }
        };

        component = mount(<PullRequestAnalysisTable isMetric={false} analysisTableMap={mockAnalysisTableMap} projectList={projectList} />);

        expect(component.find(Lozenge)).toHaveLength(3);

        expect(component.find(Lozenge).at(0).props().appearance).toBe('moved');
        expect(component.find(Lozenge).at(0).find(EditorDividerIcon).exists()).toBe(true);

        expect(component.find(Lozenge).at(1).props().appearance).toBe('success');
        expect(component.find(Lozenge).at(1).find(ArrowUpIcon).exists()).toBe(true);

        expect(component.find(Lozenge).at(2).props().appearance).toBe('removed');
        expect(component.find(Lozenge).at(2).find(ArrowDownIcon).exists()).toBe(true);
    });
});