import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const container = document.getElementById('root');
if (!container) {
 
  throw new Error('Root element (#root) not found. Please ensure public/index.html contains <div id="root"></div>');
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
