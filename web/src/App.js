import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { io } from 'socket.io-client';

// PWA Components
import { useServiceWorker } from './hooks/useServiceWorker';
// import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'; // TODO: Move inside Router
import { useStandaloneMode } from './hooks/useStandaloneMode';
import ErrorBoundary from './components/common/ErrorBoundary';
import PrivateRoute from './components/common/PrivateRoute';
import PWAInstallPrompt from './components/common/PWAInstallPrompt';
import PWAUpdateModal from './components/common/UpdateModal';
import FloatingNoteButton from './components/common/FloatingNoteButton';
// Upload Context
import { UploadProvider, useUploadContext } from './contexts/UploadContext';
import { UploadProgressModal } from './components/ui';
import { BUILD_SIZE } from './config/version';

// Auth
import { isSuperAdmin } from './services/authService';

// Analytics
import { analytics } from './services/analyticsService';

// Components
import Login from './components/Login';
import RecoverCredentials from './components/RecoverCredentials';
import ResetPassword from './components/ResetPassword';
import Logout from './components/Logout';

// Pages
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Account from './pages/Account';
import Companies from './pages/Companies';
import CreateTicket from './pages/CreateTicket';
import ExistingProjects from './pages/ExistingProjects';
import Inventory from './pages/Inventory';
import PhotoGallery from './pages/PhotoGallery';
import PreferredEquipment from './pages/PreferredEquipment';
import Project from './pages/Project';
import ServiceTerritory from './pages/ServiceTerritory';
import Support from './pages/Support';

// Auth Pages
import Register from './pages/Auth/Register';
import RegistrationSuccess from './pages/Auth/RegistrationSuccess';
import RedeemInvite from './pages/Auth/RedeemInvite';
import ForceChangePassword from './pages/Auth/ForceChangePassword';

// Portal Pages
import SalesPortal from './pages/SalesPortal';
import DesignPortal from './pages/DesignPortal';
import PermittingPortal from './pages/PermittingPortal';
import InstallPortal from './pages/InstallPortal';
import SchedulingPortal from './pages/SchedulingPortal';
import DrafterPortalPage from './pages/DrafterPortalPage';
import DevPortalPage from './pages/DevPortal';

// Drafter Portal
import DrafterPortalLayout from './layouts/DrafterPortalLayout';
import DrafterDashboard from './pages/DrafterPortal/DrafterDashboard';
import DrafterWorkspace from './pages/DrafterPortal/DrafterWorkspace';
import AdminDrafterQueue from './pages/DrafterPortal/AdminDrafterQueue';
import EarningsPage from './pages/DrafterPortal/EarningsPage';
import InvoicePage from './pages/DrafterPortal/InvoicePage';
import AchievementsPage from './pages/DrafterPortal/AchievementsPage';
import DrafterProfilePage from './pages/DrafterPortal/DrafterProfilePage';
import DrafterHelpPage from './pages/DrafterPortal/DrafterHelpPage';

// Admin Pages
import PendingRegistrations from './pages/Admin/PendingRegistrations';
import BillingPortal from './pages/Admin/BillingPortal';

// Dev Tools
import DevPanel from './components/dev/DevPanel';

// Dev Notes Context
import { DevNotesProvider } from './contexts/DevNotesContext';

// FloatingNoteButton wrapper (must be inside Router for useLocation)
const FloatingNoteWrapper = () => {
  const location = useLocation();
  const shouldShow = isSuperAdmin() && location.pathname !== '/dev-portal';

  return shouldShow ? <FloatingNoteButton /> : null;
};

/**
 * UploadStateHandler - Isolated component for upload UI
 * Only this component re-renders during uploads, NOT the entire app
 */
const UploadStateHandler = () => {
  const { isModalOpen, closeModal } = useUploadContext();

  return (
    <>
      <UploadProgressModal isOpen={isModalOpen} onClose={closeModal} onMinimize={closeModal} />
    </>
  );
};

function App() {
  const { updateAvailable, applyUpdate, dismissUpdate } = useServiceWorker();
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // Premium Desktop PWA Features
  const { isStandalone, displayMode } = useStandaloneMode();

  // Upload Manager State - now handled inline per component
  // const { status: uploadStatus } = useUploadManager();
  // const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  // const hasActiveUploads = uploadStatus.inProgress > 0 || uploadStatus.queued > 0;

  // TODO: Move keyboard shortcuts inside Router context
  // Keyboard shortcuts require Router context (useNavigate hook)
  // const shortcuts = useKeyboardShortcuts({
  //   onSearch: () => {
  //     console.log('[App] Search shortcut triggered (Cmd/Ctrl+K)');
  //   },
  //   onEscape: () => {
  //     setShowUpdateModal(false);
  //   }
  // });

  // Upload modal logic removed - now using inline progress indicators
  // useEffect(() => {
  //   if (hasActiveUploads && !isUploadModalOpen && uploadStatus.total > 0) {
  //     setIsUploadModalOpen(true);
  //   }
  // }, [hasActiveUploads, isUploadModalOpen, uploadStatus.total]);

  // useEffect(() => {
  //   const isLargeBatch = uploadStatus.total >= 10;
  //   const isComplete = !hasActiveUploads && uploadStatus.total > 0 && uploadStatus.completed + uploadStatus.failed === uploadStatus.total;
  //   const hasFailures = uploadStatus.failed > 0;

  //   if (isComplete && !isUploadModalOpen) {
  //     if (isLargeBatch || hasFailures) {
  //       setIsUploadModalOpen(true);
  //     }
  //   }
  // }, [hasActiveUploads, uploadStatus, isUploadModalOpen]);

  // Set PWA mode class
  useEffect(() => {
    if (isStandalone) {
      document.body.classList.add('pwa-standalone');
    } else {
      document.body.classList.remove('pwa-standalone');
    }
  }, [displayMode, isStandalone]);

  // Initialize analytics
  useEffect(() => {
    analytics.init().catch((error) => {
      console.error('[App] Analytics initialization failed:', error);
    });

    // End session on app unload
    const handleBeforeUnload = () => {
      analytics.endSession();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Listen for backend-triggered app updates
  useEffect(() => {
    let socketErrorLogged = false;

    const socket = io(process.env.REACT_APP_API_URL || 'https://api.skyfireapp.io', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,        // Max 5 attempts
      reconnectionDelay: 1000,        // Start with 1 second
      reconnectionDelayMax: 30000,    // Max 30 seconds between attempts
      timeout: 20000,
      autoConnect: false,             // Don't auto-connect immediately
    });

    // Only connect if user is authenticated
    const userData = sessionStorage.getItem('userData');
    if (userData) {
      socket.connect();
    }

    socket.on('app:update', ({ version }) => {
      setShowUpdateModal(true);
    });

    socket.on('connect', () => {
      socketErrorLogged = false; // Reset on successful connect
      if (process.env.NODE_ENV === 'development') {
        console.log('[Socket] Connected');
      }
    });

    // Suppress error spam in console
    socket.on('connect_error', (error) => {
      if (!socketErrorLogged) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[Socket] Connection failed, will retry silently');
        }
        socketErrorLogged = true;
      }
    });

    return () => socket.disconnect();
  }, []);

  return (
    <ErrorBoundary>
      <UploadProvider>
        <DevNotesProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <div className="App">
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
            limit={5}
          />
          {/* <DevPanel /> */}
          <Routes>
          {/* Auth Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/recover-credentials" element={<RecoverCredentials />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/force-change-password" element={<ForceChangePassword />} />
          <Route path="/logout" element={<Logout />} />

          {/* Registration Routes - PUBLIC (no auth required) */}
          <Route path="/registration-success" element={<RegistrationSuccess />} />
          <Route path="/redeem-invite" element={<RedeemInvite />} />

          {/* Dashboard Routes - Protected */}
          <Route path="/dashboard" element={<PrivateRoute><ErrorBoundary><Dashboard /></ErrorBoundary></PrivateRoute>} />
          <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/account" element={<PrivateRoute><Account /></PrivateRoute>} />
          <Route path="/companies" element={<PrivateRoute><Companies /></PrivateRoute>} />
          <Route path="/create-ticket" element={<PrivateRoute><CreateTicket /></PrivateRoute>} />
          <Route path="/existing-projects" element={<PrivateRoute><ExistingProjects /></PrivateRoute>} />
          <Route path="/inventory" element={<PrivateRoute><Inventory /></PrivateRoute>} />
          <Route path="/photo-gallery" element={<PrivateRoute><PhotoGallery /></PrivateRoute>} />
          <Route path="/preferred-equipment" element={<PrivateRoute><PreferredEquipment /></PrivateRoute>} />
          <Route path="/project/:projectUuid" element={<PrivateRoute><ErrorBoundary><DesignPortal /></ErrorBoundary></PrivateRoute>} />
          <Route path="/service-territory" element={<PrivateRoute><ServiceTerritory /></PrivateRoute>} />
          <Route path="/support" element={<PrivateRoute><Support /></PrivateRoute>} />
          <Route path="/scheduling" element={<PrivateRoute><SchedulingPortal /></PrivateRoute>} />

          {/* Portal Routes - Protected */}
          {/* Global portal routes (all projects) */}
          <Route path="/sales" element={<PrivateRoute><ErrorBoundary><SalesPortal /></ErrorBoundary></PrivateRoute>} />
          <Route path="/design" element={<PrivateRoute><ErrorBoundary><DesignPortal /></ErrorBoundary></PrivateRoute>} />
          <Route path="/permitting" element={<PrivateRoute><ErrorBoundary><PermittingPortal /></ErrorBoundary></PrivateRoute>} />
          <Route path="/install" element={<PrivateRoute><ErrorBoundary><InstallPortal /></ErrorBoundary></PrivateRoute>} />
          {/* Project-specific portal routes */}
          <Route path="/project/:projectUuid/sales" element={<PrivateRoute><ErrorBoundary><SalesPortal /></ErrorBoundary></PrivateRoute>} />
          <Route path="/project/:projectUuid/design" element={<PrivateRoute><ErrorBoundary><DesignPortal /></ErrorBoundary></PrivateRoute>} />
          <Route path="/project/:projectUuid/permitting" element={<PrivateRoute><ErrorBoundary><PermittingPortal /></ErrorBoundary></PrivateRoute>} />
          <Route path="/project/:projectUuid/install" element={<PrivateRoute><ErrorBoundary><InstallPortal /></ErrorBoundary></PrivateRoute>} />

          {/* Drafter Portal - Protected with Nested Routes */}
          <Route path="/drafter-portal" element={<PrivateRoute><DrafterPortalLayout /></PrivateRoute>}>
            <Route index element={<DrafterDashboard />} />
            <Route path="earnings" element={<EarningsPage />} />
            <Route path="invoice/:uuid" element={<InvoicePage />} />
            <Route path="achievements" element={<AchievementsPage />} />
            <Route path="profile" element={<DrafterProfilePage />} />
            <Route path="help" element={<DrafterHelpPage />} />
          </Route>
          {/* Workspace is fullscreen - no sidebar */}
          <Route path="/drafter-portal/workspace/:uuid" element={<PrivateRoute><DrafterWorkspace /></PrivateRoute>} />
          <Route path="/admin/drafter-queue" element={<PrivateRoute requireAdmin><AdminDrafterQueue /></PrivateRoute>} />
          <Route path="/drafterportal" element={<Navigate to="/drafter-portal" replace />} />

          {/* Admin Routes - Protected (Admin Only) */}
          <Route path="/admin/pending-registrations" element={<PrivateRoute requireAdmin><PendingRegistrations /></PrivateRoute>} />
          <Route path="/admin/billing" element={<PrivateRoute requireAdmin><BillingPortal /></PrivateRoute>} />

          {/* Dev Portal Route - Protected */}
          <Route path="/dev-portal" element={<PrivateRoute><DevPortalPage /></PrivateRoute>} />
        </Routes>

        {/* PWA Components - render at root level */}
        <PWAInstallPrompt />
        <PWAUpdateModal
          visible={updateAvailable}
          onUpdate={applyUpdate}
          onDismiss={dismissUpdate}
          updateSize={BUILD_SIZE}
        />

        {/* Backend-triggered update modal */}
        <PWAUpdateModal
          isOpen={showUpdateModal}
          onClose={() => setShowUpdateModal(false)}
        />

        {/* Floating Note Button - Super Admin Only, All Pages Except Dev Portal */}
        <FloatingNoteWrapper />

        {/* Upload State Handler - Isolated upload UI to prevent cascade re-renders */}
        <UploadStateHandler />
          </div>
        </Router>
      </DevNotesProvider>
      </UploadProvider>
    </ErrorBoundary>
  );
}

export default App;
