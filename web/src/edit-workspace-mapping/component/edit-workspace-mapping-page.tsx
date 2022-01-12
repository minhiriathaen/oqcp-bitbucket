import React, { useState, useEffect } from 'react';
import Form, { Field, FormFooter } from '@atlaskit/form';
import Textfield from '@atlaskit/textfield';
import ErrorCodes from '../../shared/error/error-message';
import SectionMessageBox, { SectionMessageData } from '../../shared/component/section-message-box';
import Wrapper from '../../shared/component/wrapper';
import LoadingIndicator from '../../shared/component/loading-indicator';
import {
  FieldChildrenArguments,
  FormChildrenArguments,
} from '../../shared/type/atlaskit/atlaskit.form.types';
import PrimaryButton from '../../shared/component/primary-button';
import { getErrorCode } from '../../shared/error/error.helper';
import { WorkspaceMapping } from '../../shared/model/workspace-mapping';
import {
  getWorkspaceMapping,
  storeWorkspaceMapping,
} from '../../shared/service/workspace-mapping-api-service';

const defaultWorkspaceMapping: WorkspaceMapping = {
  openQualityCheckerAdminToken: '',
};

function EditWorkspaceMappingPage(): JSX.Element {
  const [workspaceMapping, setWorkspaceMapping] = useState<WorkspaceMapping>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [sectionMessageData, setSectionMessageData] = useState<SectionMessageData | null>();

  async function load() {
    try {
      const value: WorkspaceMapping = await getWorkspaceMapping();

      if (value.openQualityCheckerAdminToken) {
        setWorkspaceMapping(value);
      } else {
        setWorkspaceMapping(defaultWorkspaceMapping);
      }

      setLoading(false);

      setShowForm(true);
    } catch (error) {
      const errorCode = getErrorCode(error, 'CONNECTION_ERROR');

      if (errorCode === ErrorCodes.CONNECTION_ERROR) {
        setShowForm(false);
      }

      setLoading(false);

      setSectionMessageData({
        title: 'Warning',
        appereance: 'warning',
        body: 'We are unable to connect to the server at this time',
      });
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save(formState: WorkspaceMapping) {
    setSaving(true);
    setSectionMessageData(null);

    try {
      await storeWorkspaceMapping(formState);

      setSaving(false);

      setWorkspaceMapping(formState);

      setSectionMessageData({
        title: 'Success',
        appereance: 'confirmation',
        body: 'OpenQualityChecker user has been saved successfully',
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

  if (loading) {
    return <LoadingIndicator />;
  }
  return (
    <Wrapper paddingTop="48px" alignItems="center">
      <Wrapper width="450px">
        {showForm && (
          <Form onSubmit={save}>
            {({ formProps }: FormChildrenArguments<WorkspaceMapping>) => (
              <form {...formProps}>
                <Field
                  label="Please use your token to connect your Bitbucket workspace to your OpenQualityChecker user"
                  isRequired
                  name="openQualityCheckerAdminToken"
                  defaultValue={workspaceMapping?.openQualityCheckerAdminToken}
                >
                  {({ fieldProps }: FieldChildrenArguments<string>) => (
                    <>
                      <Textfield testId="openQualityCheckerAdminToken" {...fieldProps} />
                    </>
                  )}
                </Field>
                <FormFooter>
                  <PrimaryButton type="submit" isDisabled={saving} showSpinner={saving}>
                    Save
                  </PrimaryButton>
                </FormFooter>
              </form>
            )}
          </Form>
        )}

        {sectionMessageData && <SectionMessageBox {...sectionMessageData} />}
      </Wrapper>
    </Wrapper>
  );
}

export default EditWorkspaceMappingPage;
