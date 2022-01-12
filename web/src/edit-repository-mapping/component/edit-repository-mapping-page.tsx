import React, { useState, useEffect } from 'react';
import { FormFooter } from '@atlaskit/form';
import ErrorCodes from '../../shared/error/error-message';
import SectionMessageBox, { SectionMessageData } from '../../shared/component/section-message-box';
import Wrapper from '../../shared/component/wrapper';
import LoadingIndicator from '../../shared/component/loading-indicator';
import PrimaryButton from '../../shared/component/primary-button';
import { getErrorCode } from '../../shared/error/error.helper';
import { RepositoryMapping } from '../../shared/model/repository-mapping';
import { OpenQualityCheckerProject } from '../../shared/model/open-quality-checker-project';
import { getProjects } from '../../shared/service/open-quality-checker-project-api-service';
import {
  getRepositoryMapping,
  storeRepositoryMapping,
} from '../../shared/service/repository-mapping-api-service';
import ProjectSelector from './project-selector';

const defaultAvailableProjects: OpenQualityCheckerProject[] = [];

const defaultRepositoryMapping: RepositoryMapping = {
  openQualityCheckerProjectIds: [],
};

const bitbucketRepositoryId = new URLSearchParams(window.location.search).get('repositoryId') || '';

export default function EditRepositoryMappingPage(): JSX.Element {
  const [availableProjects, setAvailableProjects] = useState<OpenQualityCheckerProject[]>(
    defaultAvailableProjects,
  );
  const [repositoryMapping, setRepositoryMapping] = useState<RepositoryMapping>(
    defaultRepositoryMapping,
  );
  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);
  const [disableButton, setDisableButton] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [sectionMessageData, setSectionMessageData] = useState<SectionMessageData | null>();

  async function load() {
    try {
      const getProjectsResult: OpenQualityCheckerProject[] = await getProjects();
      setAvailableProjects(getProjectsResult);

      if (getProjectsResult.length === 0) {
        setSectionMessageData({
          title: 'Info',
          appereance: undefined,
          body: 'No OpenQualityChecker projects are available',
        });

        setDisableButton(true);
      } else {
        const getRepositoryMappingResult = await getRepositoryMapping(bitbucketRepositoryId);
        setRepositoryMapping(getRepositoryMappingResult);
      }

      setShowForm(true);
      setLoading(false);
    } catch (error) {
      const errorCode = getErrorCode(error, 'CONNECTION_ERROR');

      const errors: string[] = ['CONNECTION_ERROR', 'WORKSPACE_MAPPING_NOT_FOUND'];
      setShowForm(!errors.includes(errorCode));

      setLoading(false);
      setDisableButton(true);

      setSectionMessageData({
        title: 'Warning',
        appereance: 'warning',
        body: ErrorCodes[errorCode],
      });
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save(updatedRepositoryMapping: RepositoryMapping) {
    setSaving(true);
    setSectionMessageData(null);

    try {
      await storeRepositoryMapping(updatedRepositoryMapping, bitbucketRepositoryId);

      setSaving(false);

      setSectionMessageData({
        title: 'Success',
        appereance: 'confirmation',
        body: 'OpenQualityChecker projects has been saved successfully',
      });
    } catch (error) {
      setSaving(false);

      setSectionMessageData({
        title: 'An error occurred while saving the changes',
        appereance: 'error',
        body: ErrorCodes[getErrorCode(error, 'UNKNOWN_ERROR')],
      });
    }
  }

  function onSelect(id: string) {
    const newRepositoryMapping: RepositoryMapping = { ...repositoryMapping };
    newRepositoryMapping.openQualityCheckerProjectIds.push(id);
    setRepositoryMapping(newRepositoryMapping);
  }

  function onDeselect(id: string) {
    const newRepositoryMapping = { ...repositoryMapping };
    newRepositoryMapping.openQualityCheckerProjectIds.splice(
      repositoryMapping?.openQualityCheckerProjectIds.findIndex((projectId) => projectId === id),
      1,
    );
    setRepositoryMapping(newRepositoryMapping);
  }

  if (loading) {
    return <LoadingIndicator />;
  }
  return (
    <Wrapper paddingTop="48px" alignItems="center">
      <Wrapper width="450px">
        {showForm && (
          <>
            <h3>Please connect your Repository with your OpenQualityChecker project(s)</h3>

            <ProjectSelector
              projects={availableProjects}
              selectedProjectIds={[...repositoryMapping.openQualityCheckerProjectIds]}
              onDeselect={onDeselect}
              onSelect={onSelect}
            />

            <FormFooter>
              <PrimaryButton
                type="button"
                isDisabled={saving || disableButton}
                showSpinner={saving}
                onClick={() => save(repositoryMapping)}
              >
                Save
              </PrimaryButton>
            </FormFooter>
          </>
        )}

        {sectionMessageData && <SectionMessageBox {...sectionMessageData} />}
      </Wrapper>
    </Wrapper>
  );
}
