import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AdminAuthProvider } from './context/AdminAuthContext.jsx';
import App from './App.jsx';
import './styles/admin.css';

const routerBase = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '') || '/';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={routerBase === '/' ? undefined : routerBase}>
      <AdminAuthProvider>
        <App />
      </AdminAuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
