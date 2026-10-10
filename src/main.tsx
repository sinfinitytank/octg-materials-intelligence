import React from 'react';
import ReactDOM from 'react-dom/client';
import App, { ErrorBoundary } from './app/App';
import './styles/index.css';
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
