import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

interface VideoClipProps {
  src?: string;
  poster?: string;
  title?: string;
  aspectRatio?: '16/9' | '4/3' | '1/1' | '9/16';
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  fallbackType?: 'video' | 'image' | 'animation';
}

/**
 * VideoClip Component
 * 
 * Displays real video content with fallback to mock content
 * Uses sample videos from Pexels/Unsplash for demonstration
 * In production, this would use actual brief submission videos
 */
const VideoClip: React.FC<VideoClipProps> = ({ 
  src,
  poster,
  title,
  aspectRatio = '16/9',
  className = '',
  autoPlay = false,
  muted = true,
  loop = true,
}) => {
  const { isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Sample video URLs for demonstration
  const sampleVideos = [
    'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c0fd273d2c6d9a064f3ae35579b2bbdf&profile_id=165&oauth2_token_id=57447761',
    'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c0fd273d2c6d9a064f3ae35579b2bbdf&profile_id=165&oauth2_token_id=57447761',
    'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c0fd273d2c6d9a064f3ae35579b2bbdf&profile_id=165&oauth2_token_id=57447761'
  ];

  // Use provided src or fallback to sample videos
  const videoSrc = src || sampleVideos[Math.floor(Math.random() * sampleVideos.length)];

  const handleVideoLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleVideoError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  if (hasError) {
    // Fallback to mock content
    return (
      <div className={`relative overflow-hidden rounded-xl ${className}`} style={{ aspectRatio }}>
        <div className={`absolute inset-0 ${
          isDark 
            ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-900' 
            : 'bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200'
        }`}>
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
              <svg className="w-16 h-16 text-green-500/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </motion.div>
            {title && (
              <motion.p 
                className="text-gray-400 text-sm mt-4 px-4 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {title}
              </motion.p>
            )}
            <motion.div 
              className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              Sample Preview
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl group ${className}`} style={{ aspectRatio }}>
      {/* Loading state */}
      {isLoading && (
        <div className={`absolute inset-0 flex items-center justify-center ${
          isDark 
            ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-900' 
            : 'bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200'
        }`}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full"
          />
        </div>
      )}

      {/* Video element */}
      <video
        ref={videoRef}
        src={videoSrc}
        poster={poster}
        className="w-full h-full object-cover"
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        playsInline
        onLoadedData={handleVideoLoad}
        onError={handleVideoError}
        onMouseEnter={handlePlay}
        onMouseLeave={handlePause}
      />

      {/* Play overlay */}
      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
          onClick={handlePlay}
        >
          <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </motion.button>
      </div>

      {/* Video info overlay */}
      {title && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <h3 className="text-white font-medium text-sm line-clamp-1">{title}</h3>
        </div>
      )}

      {/* Sample indicator */}
      <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
        Sample Video
      </div>
    </div>
  );
};

export default VideoClip;
