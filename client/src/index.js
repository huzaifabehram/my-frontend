import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { fetchSiteSettings } from './utils/siteSettings';

// Start loading the site settings (logos) — and, on a sleeping server, wake it
// up — right now, before React has even rendered. By the time the header asks
// for them the request is already under way (or finished), and every component
// that asks after that shares the same one request.
fetchSiteSettings().catch(() => {});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);