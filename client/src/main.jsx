import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/theme.css';
import './styles/components.css';
import './styles/layout.css';
import './styles/auth.css';
import './styles/portal.css';
import './styles/dashboard.css';
import './styles/practice.css';
import './styles/mock.css';
import './styles/directory.css';
import './styles/admin.css';
import './styles/settings.css';
import './styles/reports.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
