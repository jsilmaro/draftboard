import React from 'react';

interface DefaultAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const DefaultAvatar: React.FC<DefaultAvatarProps> = ({ name, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-10 h-10 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-18 h-18 text-lg'
  };

  return (
    <img 
      src="/icons/profile.png" 
      alt={name} 
      className={`${sizeClasses[size]} ${className}`}
      title={name}
    />
  );
};

export default DefaultAvatar; 