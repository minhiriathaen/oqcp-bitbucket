import { HeadType } from '@atlaskit/dynamic-table/dist/types/types';
import { createTableHead, getAnalysisProjects, transformAnalysisResults } from '../helper/analysis-converter';
import { mockAnalysisResult, projectList } from './mock-analysis-data';

describe('AnalysisConverter', () => {
    it('transformAnalysisResults() should transform analysis results to tabs', async () => {
        const expectedResult = {
            'Qualification': {
                'Clone Complexity': {
                    '203': {
                        'value': 6.18,
                        'difference': 0
                    },
                    '212': {
                        'value': 5.18,
                        'difference': -0.04
                    }
                },
                'Minor Warnings': {
                    '203': {
                        'value': 2.12,
                        'difference': 1.02
                    },
                    '212': {
                        'value': 1.12,
                        'difference': 1.02
                    }
                },
                'Valami qualification': {
                    '6502': {
                        'value': 1,
                        'difference': -2
                    }
                }
            },
            'Process': {
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
                'Valami Process': {
                    '6502': {
                        'value': 2,
                        'difference': -1
                    }
                }
            },
            'Documentation': {
                'API Documentation': {
                    '212': {
                        'value': 0,
                        'difference': -5
                    }
                }
            }
        };

        const result = transformAnalysisResults(mockAnalysisResult);

        expect(result).toEqual(expectedResult);
    });

    it('getAnalysisProjects() should get project list from analysis results', async () => {
        const result = getAnalysisProjects(mockAnalysisResult);

        expect(result).toEqual(projectList);
    });

    it('createTableHead() should create table head from project list', async () => {
        const expectedResult: HeadType = {
            cells: [
                { content: '' },
                { content: 'backend' },
                { content: 'analyzer-client' },
                { content: '2691 last analyzed filter' },
                { content: 'test-project' }
            ]
        };

        const result = createTableHead(projectList);

        expect(result).toEqual(expectedResult);
    });

});