import React, { useEffect, useState } from 'react';

interface AnimatedNotificationProps {
  isVisible: boolean;
  onClose: () => void;
  type: 'success' | 'error' | 'warning';
  title: string;
  message: string;
  icon?: string;
}

const AnimatedNotification: React.FC<AnimatedNotificationProps> = ({
  isVisible,
  onClose,
  type,
  title,
  message,
  icon
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-gradient-to-r from-green-400 to-green-600 border-green-500',
          icon: 'text-green-100',
          text: 'text-white',
          button: 'bg-white text-green-600 hover:bg-green-50'
        };
      case 'error':
        return {
          container: 'bg-gradient-to-r from-red-400 to-red-600 border-red-500',
          icon: 'text-red-100',
          text: 'text-white',
          button: 'bg-white text-red-600 hover:bg-red-50'
        };
      case 'warning':
        return {
          container: 'bg-gradient-to-r from-yellow-400 to-yellow-600 border-yellow-500',
          icon: 'text-yellow-100',
          text: 'text-white',
          button: 'bg-white text-yellow-600 hover:bg-yellow-50'
        };
      default:
        return {
          container: 'bg-gradient-to-r from-blue-400 to-blue-600 border-blue-500',
          icon: 'text-blue-100',
          text: 'text-white',
          button: 'bg-white text-blue-600 hover:bg-blue-50'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className={`relative bg-white rounded-2xl shadow-2xl border-2 ${styles.container} transform transition-all duration-500 ${
          isAnimating ? 'scale-110 rotate-2' : 'scale-100 rotate-0'
        }`}
        style={{
          minWidth: '400px',
          maxWidth: '500px'
        }}
      >
        {/* Success Animation */}
        {type === 'success' && isAnimating && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="animate-ping absolute w-32 h-32 bg-green-400 rounded-full opacity-20"></div>
            <div className="animate-ping absolute w-24 h-24 bg-green-300 rounded-full opacity-40" style={{ animationDelay: '0.2s' }}></div>
            <div className="animate-ping absolute w-16 h-16 bg-green-200 rounded-full opacity-60" style={{ animationDelay: '0.4s' }}></div>
          </div>
        )}

        {/* Content */}
        <div className="relative p-8 text-center">
          {/* Icon */}
          <div className={`text-6xl mb-4 ${styles.icon} ${isAnimating ? 'animate-bounce' : ''}`}>
            {icon || (type === 'success' ? '🎉' : type === 'error' ? '❌' : '⚠️')}
          </div>

          {/* Title */}
          <h3 className={`text-2xl font-bold mb-2 ${styles.text}`}>
            {title}
          </h3>

          {/* Message */}
          <p className={`text-lg mb-6 ${styles.text} opacity-90`}>
            {message}
          </p>

          {/* Action Button */}
          <button
            onClick={onClose}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 ${styles.button}`}
          >
            {type === 'success' ? 'Awesome! 🚀' : 'Got it'}
          </button>
        </div>

        {/* Floating Particles for Success */}
        {type === 'success' && isAnimating && (
          <>
            <div className="absolute top-4 left-4 animate-bounce" style={{ animationDelay: '0.1s' }}>✨</div>
            <div className="absolute top-8 right-8 animate-bounce" style={{ animationDelay: '0.3s' }}>⭐</div>
            <div className="absolute bottom-8 left-8 animate-bounce" style={{ animationDelay: '0.5s' }}>🎊</div>
            <div className="absolute bottom-4 right-4 animate-bounce" style={{ animationDelay: '0.7s' }}>🏆</div>
          </>
        )}
      </div>
    </div>
  );
};

export default AnimatedNotification; 