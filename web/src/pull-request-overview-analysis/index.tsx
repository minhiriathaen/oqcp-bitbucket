import React from 'react';
import ReactDOM from 'react-dom';
import '../index.css';
import '@atlaskit/css-reset';
import PullRequestOverviewAnalysis from './component/pull-request-overview-analysis';

ReactDOM.render(
  <React.StrictMode>
    <PullRequestOverviewAnalysis />
  </React.StrictMode>,
  document.getElementById('root'),
);
