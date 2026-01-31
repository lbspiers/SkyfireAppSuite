import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import styles from './Toast.module.css';

const ToastContext = createContext(null);

const ICONS = {
  success: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-5l5-5-1.4-1.4L9 10.2 7.4 8.6 6 10l3 3z" fill="currentColor"/>
    </svg>
  ),
  error: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 9V5h2v4H9zm0 4v-2h2v2H9z" fill="currentColor"/>
    </svg>
  ),
  warning: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 2L1 18h18L10 2zm0 4l6.5 11h-13L10 6zm-1 4v3h2v-3H9zm0 5v2h2v-2H9z" fill="currentColor"/>
    </svg>
  ),
  info: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-5V9h2v4H9zm0-6V5h2v2H9z" fill="currentColor"/>
    </svg>
  ),
};

const Toast = ({ id, variant = 'info', title, message, duration = 5000, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      if (onClose) onClose(id);
    }, 200);
  };

  return (
    <div
      className={`${styles.toast} ${styles[variant]} ${isExiting ? styles.exiting : ''}`}
      role="alert"
    >
      <div className={styles.icon}>{ICONS[variant]}</div>
      <div className={styles.content}>
        {title && <div className={styles.title}>{title}</div>}
        {message && <div className={styles.message}>{message}</div>}
      </div>
      <button className={styles.close} onClick={handleClose} aria-label="Dismiss">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
};

const ToastContainer = ({ position = 'top-right' }) => {
  const { toasts, removeToast } = useContext(ToastContext);

  return (
    <div className={`${styles.container} ${styles[position]}`}>
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={removeToast} />
      ))}
    </div>
  );
};

export const ToastProvider = ({ children, position = 'top-right' }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, ...toast }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((options) => {
    if (typeof options === 'string') {
      return addToast({ message: options, variant: 'info' });
    }
    return addToast(options);
  }, [addToast]);

  toast.success = (message, options = {}) => addToast({ message, variant: 'success', ...options });
  toast.error = (message, options = {}) => addToast({ message, variant: 'error', ...options });
  toast.warning = (message, options = {}) => addToast({ message, variant: 'warning', ...options });
  toast.info = (message, options = {}) => addToast({ message, variant: 'info', ...options });

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, toast }}>
      {children}
      <ToastContainer position={position} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.toast;
};

export default Toast;
