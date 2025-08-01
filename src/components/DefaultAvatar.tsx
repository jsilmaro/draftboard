import React from 'react';

interface DefaultAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const DefaultAvatar: React.FC<DefaultAvatarProps> = ({ name, size = 'md', className = '' }) => {
  // Generate consistent colors based on name
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-red-500',
    'bg-yellow-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-cyan-500'
  ];
  
  const colorIndex = name.charCodeAt(0) % colors.length;
  const bgColor = colors[colorIndex];
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg'
  };

  const initials = name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div 
      className={`${bgColor} ${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-semibold ${className}`}
      title={name}
    >
      {initials}
    </div>
  );
};

export default DefaultAvatar; 