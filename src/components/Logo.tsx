import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const { isDark } = useTheme();

  const sizeClasses = {
    sm: 'w-24 h-12',
    md: 'w-32 h-16',
    lg: 'w-48 h-24',
    xl: 'w-64 h-32'
  };

  // Choose logo based on theme with cache busting
  const logoSrc = isDark ? `/logo-light2.svg?t=${Date.now()}` : `/logo.svg?t=${Date.now()}`;

  return (
    <div className={`${className} flex items-center justify-start p-1`}>
      <img 
        src={logoSrc} 
        alt="DraftBoard Logo" 
        className={`${sizeClasses[size]} object-contain`}
        style={{
          maxWidth: '100%',
          height: 'auto',
          display: 'block'
        }}
        onError={(e) => {
          // Fallback to alternative logo if main logo fails to load
          e.currentTarget.src = isDark ? `/logo.svg?t=${Date.now()}` : `/logo-light2.svg?t=${Date.now()}`;
        }}
      />
    </div>
  );
};

export default Logo;
