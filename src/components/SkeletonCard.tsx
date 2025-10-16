import React from 'react';
import { motion } from 'framer-motion';

const SkeletonCard: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="group relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border-2 border-gray-200 dark:border-gray-700"
    >
      <div className="relative p-6">
        {/* Header Skeleton */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-green/20 to-accent-green/10 animate-pulse" />
            <div className="flex-1 min-w-0">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24 mb-2 animate-pulse" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Title Skeleton */}
        <div className="mb-3">
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2 animate-pulse" />
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/2 animate-pulse" />
        </div>

        {/* Description Skeleton */}
        <div className="mb-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2 animate-pulse" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-2 animate-pulse" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6 animate-pulse" />
        </div>

        {/* Reward Display Skeleton */}
        <div className="p-5 rounded-xl mb-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-20 mb-2 animate-pulse" />
              <div className="h-8 bg-gradient-to-r from-accent-green/30 to-accent-green/20 rounded w-24 animate-pulse" />
            </div>
            <div className="text-right">
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16 mb-2 animate-pulse" />
              <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-8 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Stats Row Skeleton */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/30 text-center">
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-8 mx-auto mb-2 animate-pulse" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto animate-pulse" />
          </div>
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/30 text-center">
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-8 mx-auto mb-2 animate-pulse" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto animate-pulse" />
          </div>
        </div>

        {/* Progress Bar Skeleton */}
        <div className="mb-4">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-accent-green/30 to-accent-green/20 rounded-full w-3/4 animate-pulse" />
          </div>
        </div>

        {/* Action Buttons Skeleton */}
        <div className="flex space-x-3">
          <div className="flex-1 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          <div className="flex-1 h-12 bg-gradient-to-r from-accent-green/20 to-accent-green/10 rounded-xl animate-pulse" />
        </div>

        {/* Tags Skeleton */}
        <div className="flex flex-wrap gap-2 mt-4">
          <div className="h-6 bg-accent-green/20 rounded-full w-16 animate-pulse" />
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-12 animate-pulse" />
        </div>
      </div>
    </motion.div>
  );
};

export default SkeletonCard;
