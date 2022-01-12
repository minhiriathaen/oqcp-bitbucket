import React from 'react';
import Spinner from '@atlaskit/spinner';
import Button from '@atlaskit/button/custom-theme-button';
import { BaseProps } from '@atlaskit/button/dist/types/types';

export interface PrimaryButtonProps extends BaseProps {
  type: 'button' | 'submit' | 'reset';
  appearance?: 'primary' | 'danger' | 'warning';
  isDisabled: boolean;
  showSpinner: boolean;
  children: React.ReactNode;
}

function PrimaryButton({
  type = 'button',
  appearance = 'primary',
  isDisabled = false,
  children,
  showSpinner,
  ...baseProps
}: PrimaryButtonProps): JSX.Element {
  return (
    <Button type={type} appearance={appearance} isDisabled={isDisabled} {...baseProps}>
      {children} {showSpinner && <Spinner size="small" />}
    </Button>
  );
}

export default PrimaryButton;
