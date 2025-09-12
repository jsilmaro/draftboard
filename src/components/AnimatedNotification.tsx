import React, { useState, useEffect } from 'react';

interface AnimatedNotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message?: string; // Legacy prop for backward compatibility
  title?: string;
  description?: string;
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
}

const AnimatedNotification: React.FC<AnimatedNotificationProps> = ({
  type,
  message, // Legacy prop
  title,
  description,
  onClose,
  autoClose = true,
  duration = 5000
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300); // Wait for animation to complete
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose?.(), 300);
  };

  // Backward compatibility: use message as title if title is not provided
  const displayTitle = title || message || 'Notification';
  const displayDescription = description || (message ? '' : 'No description available');

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return '#2b9875';
      case 'error':
        return '#e53e3e';
      case 'warning':
        return '#f6ad55';
      case 'info':
        return '#3182ce';
      default:
        return '#3182ce';
    }
  };

  const getIcon = () => {
    const color = getIconColor();
    switch (type) {
      case 'success':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6" style={{ color }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        );
      case 'error':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6" style={{ color }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
        );
      case 'warning':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6" style={{ color }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        );
      case 'info':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6" style={{ color }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
        );
      default:
        return (
          <img src="/icons/Green_icons/NotificationBell.png" alt="Info" className="w-6 h-6" style={{ color }} />
        );
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 transform ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className="flex flex-col gap-2 w-60 sm:w-72 text-[10px] sm:text-xs">
        <div className="cursor-default flex items-center justify-between w-full h-12 sm:h-14 rounded-lg bg-[#232531] px-[10px]">
          <div className="flex gap-2">
            <div className="bg-white/5 backdrop-blur-xl p-1 rounded-lg">
              {getIcon()}
            </div>
            <div>
              <p className="text-white">{displayTitle}</p>
              {displayDescription && <p className="text-gray-500">{displayDescription}</p>}
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="text-gray-600 hover:bg-white/5 p-1 rounded-md transition-colors ease-linear"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnimatedNotification; 