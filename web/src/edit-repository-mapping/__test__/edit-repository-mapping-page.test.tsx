/* eslint-disable sonarjs/no-duplicate-string */
import { configure, mount, ReactWrapper } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import React from 'react';
import LoadingIndicator from '../../shared/component/loading-indicator';
import { mocked } from 'ts-jest/utils'
import { act } from 'react-dom/test-utils';
import PrimaryButton from '../../shared/component/primary-button';
import { getErrorCode } from '../../shared/error/error.helper';
import EditRepositoryMappingPage from '../component/edit-repository-mapping-page';
import { getRepositoryMapping, storeRepositoryMapping } from '../../shared/service/repository-mapping-api-service';
import { getProjects } from '../../shared/service/open-quality-checker-project-api-service';
import { OpenQualityCheckerProject } from '../../shared/model/open-quality-checker-project';
import { RepositoryMapping } from '../../shared/model/repository-mapping';
import ProjectSelector from '../component/project-selector';
import { FormFooter } from '@atlaskit/form';
import SectionMessageBox from '../../shared/component/section-message-box';

jest.mock('../../shared/service/repository-mapping-api-service')
const mockedGetRepositoryMapping = mocked(getRepositoryMapping)
const mockedStoreRepositoryMapping = mocked(storeRepositoryMapping)

jest.mock('../../shared/service/open-quality-checker-project-api-service')
const mockedGetProjects = mocked(getProjects)

jest.mock('../../shared/error/error.helper')
const mockedErrorHelper = mocked(getErrorCode)

configure({ adapter: new Adapter() });

xdescribe('EditRepositoryMappingPage', () => {
    let component: ReactWrapper;

    it('should render a LoadingIndicator when loads', async () => {
        component = mount(<EditRepositoryMappingPage />);

        expect(component.find(LoadingIndicator).exists()).toBe(true);
    });

    describe('after a success getProjects & getRepositoryMapping rest api call', () => {
        const mockProjects: OpenQualityCheckerProject[] = [{id: '1', name: 'testProject1'}];
        const mockRepositoryMappings: RepositoryMapping = {
            openQualityCheckerProjectIds: []
        };
        beforeEach(async () => {
            mockedGetProjects.mockResolvedValue(mockProjects);
            mockedGetRepositoryMapping.mockResolvedValue(mockRepositoryMappings);

            component = mount(<EditRepositoryMappingPage />);

            await act(async () => {
                await Promise.resolve(component);
                await new Promise(resolve => setImmediate(resolve));

                component.update();
            });
        })

        it('should render an input tag', async () => {
            expect(component.find(ProjectSelector).exists()).toBe(true);
        });

        it('should render a PrimaryButton', () => {
            expect(component.find(PrimaryButton).exists()).toBe(true);
        });
    });

    describe('after a failed getRepositoryMapping rest api call throws CONNECTION_ERROR', () => {
      beforeEach(async () => {
          const mockProjects: OpenQualityCheckerProject[] = [{id: '1', name: 'testProject1'}];
          mockedGetProjects.mockResolvedValue(mockProjects);
          mockedGetRepositoryMapping.mockRejectedValueOnce(new Error())
          mockedErrorHelper.mockReturnValue("CONNECTION_ERROR");

          component = mount(<EditRepositoryMappingPage />);

          await act(async () => {
              await Promise.resolve(component);
              await new Promise(resolve => setImmediate(resolve));

              component.update();
          });
      });

      it('should the SectionMessageBox component body prop match the expectet error message', async () => {
          const expectedMessage = "We are unable to connect to the server at this time.";

          expect(component.find(SectionMessageBox).props().body).toBe(expectedMessage);
      });

      it('should render a SectionMessageBox component', async () => {
          expect(component.find(SectionMessageBox).exists()).toBe(true);
      });
  });
});
