import React from 'react';
import SectionMessage from '@atlaskit/section-message';

export interface SectionMessageData {
  title: string;
  appereance: 'error' | 'warning' | 'confirmation' | undefined;
  body: string;
}

function SectionMessageBox({ title, appereance, body }: SectionMessageData): JSX.Element {
  return (
    <div style={{ paddingTop: '24px' }}>
      <SectionMessage testId="sectionMessage" title={title} appearance={appereance}>
        <p>{body}</p>
      </SectionMessage>
    </div>
  );
}

export default SectionMessageBox;
