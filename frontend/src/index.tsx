import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { StagewiseToolbar } from '@stagewise/toolbar-react';

// Remove StrictMode for production as it causes double effect calls
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <App />
);

// Initialize Stagewise toolbar in development mode only
if (process.env.NODE_ENV === 'development') {
  // Create a separate DOM element for the toolbar
  const toolbarContainer = document.createElement('div');
  toolbarContainer.id = 'stagewise-toolbar-root';
  document.body.appendChild(toolbarContainer);
  
  // Create a separate React root for the toolbar
  const toolbarRoot = ReactDOM.createRoot(toolbarContainer);
  
  // Basic toolbar configuration
  const stagewiseConfig = {
    plugins: []
  };
  
  // Render the toolbar in its own React tree
  toolbarRoot.render(
    <StagewiseToolbar config={stagewiseConfig} />
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
