import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

test('renders test button', () => {
  const { getByText } = render(<App />);
  const testButtonElement = getByText(/Test button/i);
  expect(testButtonElement).toBeInTheDocument();
});
