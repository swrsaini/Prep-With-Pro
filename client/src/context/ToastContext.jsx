import React, { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);

function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    window.clearTimeout(showToast.timeout);
    showToast.timeout = window.setTimeout(() => setToast(null), 3000);
  }, []);

  return <ToastContext.Provider value={{ showToast }}>{children}{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</ToastContext.Provider>;
}

function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside a ToastProvider.');
  return context;
}

function Toast({ message, type, onClose }) {
  return <div className={`toast-notification active toast-${type}`} role="status" onClick={onClose}><span>{message}</span></div>;
}

export { ToastProvider, useToast };
