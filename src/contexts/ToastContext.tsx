import React, { createContext, useContext, useState, useCallback } from 'react';
import AnimatedNotification from '../components/AnimatedNotification';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface ToastContextType {
  showSuccessToast: (message: string) => void;
  showErrorToast: (message: string) => void;
  showWarningToast: (message: string) => void;
  showInfoToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = { id, message, type };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, [removeToast]);

  const showSuccessToast = useCallback((message: string) => {
    addToast(message, 'success');
  }, [addToast]);

  const showErrorToast = useCallback((message: string) => {
    addToast(message, 'error');
  }, [addToast]);

  const showWarningToast = useCallback((message: string) => {
    addToast(message, 'warning');
  }, [addToast]);

  const showInfoToast = useCallback((message: string) => {
    addToast(message, 'info');
  }, [addToast]);

  const value = {
    showSuccessToast,
    showErrorToast,
    showWarningToast,
    showInfoToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <AnimatedNotification
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
            autoClose={true}
            duration={5000}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

