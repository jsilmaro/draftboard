import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface DashboardLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const DashboardLogo: React.FC<DashboardLogoProps> = ({ size = 'md', className = '' }) => {
  const { theme } = useTheme();

  const sizeClasses = {
    sm: 'w-20 h-10',
    md: 'w-28 h-14',
    lg: 'w-36 h-18',
    xl: 'w-44 h-22'
  };

  // Dashboard logos - you can add different logo files for dashboards
  const logoSrc = theme === 'dark' 
    ? `/logo.svg?t=${Date.now()}` 
    : `/logo-light2.svg?t=${Date.now()}`;

  return (
    <div className={`${className} flex items-center justify-center`}>
      <img 
        src={logoSrc} 
        alt="DraftBoard Dashboard Logo" 
        className={`${sizeClasses[size]} object-contain object-center`}
        style={{
          maxWidth: '100%',
          height: 'auto',
          display: 'block'
        }}
        onError={(e) => {
          // Fallback to dark logo if light logo fails to load
          if (theme === 'light') {
            e.currentTarget.src = `/logo.svg?t=${Date.now()}`;
          }
        }}
      />
    </div>
  );
};

export default DashboardLogo;
