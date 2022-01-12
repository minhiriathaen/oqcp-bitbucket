import React from 'react';
import Spinner from '@atlaskit/spinner';
import Wrapper from './wrapper';

function LoadingIndicator(): JSX.Element {
  return (
    <Wrapper height="100vh" justifyContent="center" alignItems="center" testId="spinner">
      <Spinner size="large" />
    </Wrapper>
  );
}

export default LoadingIndicator;
