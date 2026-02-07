import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import './index.css';
import App from './App';
import { store, initializeAuth } from './store';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';

// Import service worker registration
import { register } from './utils/serviceWorkerRegistration';

// Import console filter to suppress browser extension errors
import { initConsoleFilter } from './utils/consoleFilter';

// Import API test utilities (available in dev mode as window.testEquipmentAPIs)
import './utils/apiTest';

// Initialize console filter (suppresses browser extension errors)
initConsoleFilter();

// Initialize auth state from localStorage before rendering
initializeAuth();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);

// Register service worker for PWA functionality
// Note: The actual registration with update callbacks happens in useServiceWorker hook
// This initial call ensures SW is registered even if App hasn't mounted yet
// TEMPORARILY DISABLED FOR DEVELOPMENT - ENABLE BEFORE PRODUCTION DEPLOY
// register();
