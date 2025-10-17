import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  hoverable?: boolean;
  glowOnHover?: boolean;
  onClick?: () => void;
}

const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = '', 
  delay = 0, 
  hoverable = true,
  glowOnHover = true,
  onClick 
}) => {
  const { isDark } = useTheme();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={hoverable ? { y: -4, scale: 1.02 } : {}}
      className={`
        relative overflow-hidden rounded-2xl
        ${isDark ? 'backdrop-blur-md' : ''}
        shadow-lg
        ${isDark 
          ? 'bg-gray-900/40 border border-gray-800/50' 
          : 'bg-white border border-gray-200'
        }
        ${glowOnHover 
          ? isDark 
            ? 'hover:shadow-lg hover:border-green-500/50' 
            : 'hover:shadow-xl hover:border-green-400/50' 
          : ''
        }
        transition-all duration-300
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Subtle gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br pointer-events-none ${
        isDark ? 'from-green-500/5 to-transparent' : 'from-green-400/3 to-transparent'
      }`} />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

export default GlassCard;

