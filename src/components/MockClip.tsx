import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

interface MockClipProps {
  type?: 'video' | 'image' | 'animation';
  aspectRatio?: '16/9' | '4/3' | '1/1' | '9/16';
  label?: string;
  className?: string;
}

/**
 * MockClip Component
 * 
 * TEMPORARY COMPONENT - Replace with real media when available
 * This component provides visual placeholders for videos, images, and animations
 * while real media assets are being developed or loaded.
 * 
 * Usage: Replace with actual <video>, <img>, or <iframe> elements when real content is available
 */
const MockClip: React.FC<MockClipProps> = ({ 
  type = 'video', 
  aspectRatio = '16/9',
  label,
  className = '' 
}) => {
  const { isDark } = useTheme();
  
  const icons = {
    video: (
      <svg className="w-16 h-16 text-green-500/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    image: (
      <svg className="w-16 h-16 text-green-500/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    animation: (
      <svg className="w-16 h-16 text-green-500/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
      </svg>
    ),
  };

  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`} style={{ aspectRatio }}>
      {/* Animated gradient background */}
      <motion.div
        className={`absolute inset-0 ${
          isDark 
            ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-900' 
            : 'bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200'
        }`}
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Animated glow effect */}
      <motion.div
        className="absolute inset-0 opacity-30"
        animate={{
          background: [
            'radial-gradient(circle at 0% 0%, rgba(0, 255, 132, 0.3) 0%, transparent 50%)',
            'radial-gradient(circle at 100% 100%, rgba(0, 255, 132, 0.3) 0%, transparent 50%)',
            'radial-gradient(circle at 0% 0%, rgba(0, 255, 132, 0.3) 0%, transparent 50%)',
          ],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {icons[type]}
        </motion.div>
        
        {label && (
          <motion.p 
            className="text-gray-400 text-sm mt-4 px-4 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {label}
          </motion.p>
        )}
        
        {/* Temporary placeholder indicator */}
        <motion.div 
          className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Mock Preview
        </motion.div>
      </div>

      {/* Scanning line effect */}
      <motion.div
        className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-green-500 to-transparent"
        animate={{
          top: ['0%', '100%'],
          opacity: [0, 1, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
};

export default MockClip;

