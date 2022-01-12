import { configure, mount, ReactWrapper } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import React from 'react';
import LoadingIndicator from '../../shared/component/loading-indicator';
import { mocked } from 'ts-jest/utils'
import { getWorkspaceMapping, storeWorkspaceMapping } from '../../shared/service/workspace-mapping-api-service'
import { act } from 'react-dom/test-utils';
import PrimaryButton from '../../shared/component/primary-button';
import { getErrorCode } from '../../shared/error/error.helper';
import SectionMessageBox from '../../shared/component/section-message-box';
import ErrorCodes from '../../shared/error/error-message';
import EditWorkspaceMappingPage from '../component/edit-workspace-mapping-page';
import { WorkspaceMapping } from '../../shared/model/workspace-mapping';

jest.mock('../../shared/service/workspace-mapping-api-service')
const mockedGetWorkspaceMapping = mocked(getWorkspaceMapping)
const mockedStoreWorkspaceMapping = mocked(storeWorkspaceMapping)

jest.mock('../../shared/error/error.helper')
const mockedErrorHelper = mocked(getErrorCode)

configure({ adapter: new Adapter() });

describe('EditWorkspaceMappingPage', () => {
    let component: ReactWrapper;

    it('should render a LoadingIndicator when loads', async () => {
        component = mount(<EditWorkspaceMappingPage />);

        expect(component.find(LoadingIndicator).exists()).toBe(true);
    });

    describe('after a success getWorkspaceMapping rest api call with an existing openQualityCheckerAdminToken', () => {
        const mockWorkspaceMapping: WorkspaceMapping = {
            openQualityCheckerAdminToken: 'testToken'
        }

        beforeEach(async () => {
            mockedGetWorkspaceMapping.mockResolvedValue(mockWorkspaceMapping);

            component = mount(<EditWorkspaceMappingPage />);

            await act(async () => {
                await Promise.resolve(component);
                await new Promise(resolve => setImmediate(resolve));

                component.update();
            });
        })

        it('should render an input tag', async () => {
            expect(component.find('input[data-testid="openQualityCheckerAdminToken"]').exists()).toBe(true);
        });

        it('the rendered inputs value should match the mocked value', async () => {
            expect(component.find('input[data-testid="openQualityCheckerAdminToken"]').props().value).toBe(mockWorkspaceMapping.openQualityCheckerAdminToken);
        });

        it('should render a PrimaryButton', () => {
            expect(component.find(PrimaryButton).exists()).toBe(true);
        });
    });

    describe('after a success getWorkspaceMapping rest api call where openQualityCheckerAdminToken is null', () => {
        const mockWorkspaceMapping: WorkspaceMapping = {
            openQualityCheckerAdminToken: ''
        }

        beforeEach(async () => {
            mockedGetWorkspaceMapping.mockResolvedValue(mockWorkspaceMapping);

            component = mount(<EditWorkspaceMappingPage />);

            await act(async () => {
                await Promise.resolve(component);
                await new Promise(resolve => setImmediate(resolve));

                component.update();
            });
        });

        it('should set the input value to empty string', async () => {
            expect(component.find('input[data-testid="openQualityCheckerAdminToken"]').props().value).toBe(mockWorkspaceMapping.openQualityCheckerAdminToken);
        });

        describe('after fill the input and click on save button', () => {
            let primaryButton: ReactWrapper<any>;
            let axiosResponse: Promise<void>
            let expectedMessage: string;

            it('with valid input, should render a SectionMessageBox component with the expected success message', async () => {
                primaryButton = component.find(PrimaryButton);
                axiosResponse = Promise.resolve();
                expectedMessage = "OpenQualityChecker user has been saved successfully";

                mockedStoreWorkspaceMapping.mockResolvedValue(axiosResponse);

                await act(async () => {
                    primaryButton.simulate('submit');

                    await Promise.resolve(component);
                    await new Promise(resolve => setImmediate(resolve));

                    component.update();
                });

                expect(component.find(SectionMessageBox).props().body).toBe(expectedMessage);
            });

            it('with invalid input, should render a SectionMessageBox component with the expected error message', async () => {
                primaryButton = component.find(PrimaryButton);
                axiosResponse = Promise.resolve();
                expectedMessage = ErrorCodes.UNKNOWN_ERROR;

                mockedStoreWorkspaceMapping.mockRejectedValue(axiosResponse);
                mockedErrorHelper.mockReturnValue("UNKNOWN_ERROR");

                await act(async () => {
                    primaryButton.simulate('submit');

                    await Promise.resolve(component);
                    await new Promise(resolve => setImmediate(resolve));

                    component.update();
                });

                expect(component.find(SectionMessageBox).props().body).toBe(expectedMessage);
            });
        });
    });

    describe('after a failed getWorkspaceMapping rest api call throws CONNECTION_ERROR', () => {
        beforeEach(async () => {
            mockedGetWorkspaceMapping.mockRejectedValueOnce(new Error())
            mockedErrorHelper.mockReturnValue("CONNECTION_ERROR");

            component = mount(<EditWorkspaceMappingPage />);

            await act(async () => {
                await Promise.resolve(component);
                await new Promise(resolve => setImmediate(resolve));

                component.update();
            });
        });

        it('should the SectionMessageBox component body prop match the expectet error message', async () => {
            const expectedMessage = "We are unable to connect to the server at this time";

            expect(component.find(SectionMessageBox).props().body).toBe(expectedMessage);
        });

        it('should render a SectionMessageBox component', async () => {
            expect(component.find(SectionMessageBox).exists()).toBe(true);
        });
    });
});