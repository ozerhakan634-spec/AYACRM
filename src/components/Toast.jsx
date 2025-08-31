import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

// Toast tipine göre ikon ve renk belirleme
const getToastConfig = (type) => {
  switch (type) {
    case 'success':
      return {
        icon: CheckCircle,
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        iconColor: 'text-green-600',
        textColor: 'text-green-800'
      };
    case 'error':
      return {
        icon: AlertCircle,
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        iconColor: 'text-red-600',
        textColor: 'text-red-800'
      };
    case 'warning':
      return {
        icon: AlertCircle,
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        iconColor: 'text-yellow-600',
        textColor: 'text-yellow-800'
      };
    case 'info':
    default:
      return {
        icon: Info,
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        iconColor: 'text-blue-600',
        textColor: 'text-blue-800'
      };
  }
};

// Toast container - Bu component'i App.jsx'te kullanacağız
export const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => {
        const config = getToastConfig(toast.type);
        const IconComponent = config.icon;

        return (
          <div
            key={toast.id}
            className={`
              ${config.bgColor} ${config.borderColor} ${config.textColor}
              border rounded-lg shadow-lg p-4 pr-8 min-w-[300px] max-w-[400px]
              transform transition-all duration-300 ease-out
              animate-in slide-in-from-right-full
            `}
          >
            <div className="flex items-start space-x-3">
              <IconComponent size={20} className={`${config.iconColor} flex-shrink-0 mt-0.5`} />
              <div className="flex-1">
                {toast.title && (
                  <div className="font-medium text-sm mb-1">{toast.title}</div>
                )}
                <div className="text-sm leading-relaxed">{toast.message}</div>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className={`${config.iconColor} hover:opacity-70 transition-opacity`}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Hook - Toast'ları yönetmek için
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = (toast) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      type: 'info',
      duration: 4000,
      ...toast
    };

    setToasts(prev => [...prev, newToast]);

    // Otomatik kaldırma
    if (newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const removeAllToasts = () => {
    setToasts([]);
  };

  // Kısa yol fonksiyonları
  const success = (message, title, options = {}) => {
    return addToast({
      type: 'success',
      message,
      title,
      ...options
    });
  };

  const error = (message, title, options = {}) => {
    return addToast({
      type: 'error',
      message,
      title,
      ...options
    });
  };

  const warning = (message, title, options = {}) => {
    return addToast({
      type: 'warning',
      message,
      title,
      ...options
    });
  };

  const info = (message, title, options = {}) => {
    return addToast({
      type: 'info',
      message,
      title,
      ...options
    });
  };

  return {
    toasts,
    addToast,
    removeToast,
    removeAllToasts,
    success,
    error,
    warning,
    info
  };
};

// Context - Global toast sistemi için
import { createContext, useContext } from 'react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const toast = useToast();

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
    </ToastContext.Provider>
  );
};

export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
};
