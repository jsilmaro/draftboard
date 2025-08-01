import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'white' | 'gray' | 'green' | 'blue';
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'blue',
  text 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const colorClasses = {
    white: 'text-white',
    gray: 'text-gray-600',
    green: 'text-green-600',
    blue: 'text-blue-600'
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-${colorClasses[color]} ${sizeClasses[size]}`}></div>
      {text && (
        <p className="mt-2 text-sm text-gray-600 animate-pulse">{text}</p>
      )}
    </div>
  );
};

export default LoadingSpinner; 