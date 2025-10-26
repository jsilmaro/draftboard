import React from 'react';
import { useTheme } from './ThemeContext';
import AnimatedNotification from '../components/AnimatedNotification';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface ToastContextType {
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  showSuccessToast: (message: string) => void;
  showErrorToast: (message: string) => void;
  showWarningToast: (message: string) => void;
  showInfoToast: (message: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const { isDark } = useTheme();

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const addToast = React.useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = { id, message, type };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, [removeToast]);

  const showSuccessToast = React.useCallback((message: string) => {
    addToast(message, 'success');
  }, [addToast]);

  const showErrorToast = React.useCallback((message: string) => {
    addToast(message, 'error');
  }, [addToast]);

  const showWarningToast = React.useCallback((message: string) => {
    addToast(message, 'warning');
  }, [addToast]);

  const showInfoToast = React.useCallback((message: string) => {
    addToast(message, 'info');
  }, [addToast]);

  const showToast = React.useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    addToast(message, type);
  }, [addToast]);

  const value = {
    showToast,
    showSuccessToast,
    showErrorToast,
    showWarningToast,
    showInfoToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-2 sm:right-4 z-50 space-y-3 w-auto max-w-[calc(100vw-1rem)] sm:max-w-none">
        {toasts.map((toast) => (
          <AnimatedNotification
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
            autoClose={true}
            duration={5000}
            isDark={isDark}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

