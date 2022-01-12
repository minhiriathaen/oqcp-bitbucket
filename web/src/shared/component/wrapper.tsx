import React from 'react';

interface WrapperProps {
  width?: string;
  height?: string;
  paddingTop?: string;
  paddingBottom?: string;
  alignItems?: 'stretch' | 'start' | 'center' | 'end';
  justifyContent?: 'start' | 'center' | 'space-between';
  testId?: string;
  children: React.ReactNode;
}

function Wrapper({
  width = 'auto',
  height = 'auto',
  paddingTop = undefined,
  paddingBottom = undefined,
  alignItems,
  justifyContent,
  testId = undefined,
  children,
}: WrapperProps): JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: `${alignItems}`,
        justifyContent: `${justifyContent}`,
        paddingTop: `${paddingTop}`,
        paddingBottom: `${paddingBottom}`,
        width: `${width}`,
        height: `${height}`,
      }}
      data-testid={testId}
    >
      {children}
    </div>
  );
}

export default React.memo(Wrapper);
