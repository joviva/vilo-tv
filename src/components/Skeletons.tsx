/**
 * Loading skeleton components for better perceived performance
 */

import React from 'react';
import { UI_CONSTANTS } from '@/lib/constants';

interface SkeletonProps {
  className?: string;
}

/**
 * Base skeleton component with pulse animation
 */
function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div 
      className={`animate-pulse bg-white/10 rounded ${className}`}
      aria-hidden="true"
    />
  );
}

/**
 * Channel card skeleton for grid layouts
 */
export function ChannelCardSkeleton() {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden">
      {/* Image skeleton */}
      <Skeleton className="h-32 rounded-t-lg" />
      
      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <Skeleton className="h-4 w-3/4" />
        
        {/* Category */}
        <Skeleton className="h-3 w-1/2" />
        
        {/* Language and country */}
        <div className="flex justify-between items-center">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-4 w-6" />
        </div>
      </div>
    </div>
  );
}

/**
 * Channel grid skeleton showing multiple cards
 */
interface ChannelGridSkeletonProps {
  count?: number;
}

export function ChannelGridSkeleton({ count = UI_CONSTANTS.LOADING_SKELETON_COUNT }: ChannelGridSkeletonProps) {
  return (
    <div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      aria-label="Loading channels..."
    >
      {Array.from({ length: count }, (_, index) => (
        <ChannelCardSkeleton key={index} />
      ))}
    </div>
  );
}

/**
 * List item skeleton for category/language lists
 */
export function ListItemSkeleton() {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center space-x-4">
      {/* Icon/flag skeleton */}
      <Skeleton className="h-8 w-8 rounded-full" />
      
      {/* Content */}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      
      {/* Count skeleton */}
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
}

/**
 * Category/Language grid skeleton
 */
interface ListGridSkeletonProps {
  count?: number;
}

export function ListGridSkeleton({ count = 8 }: ListGridSkeletonProps) {
  return (
    <div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      aria-label="Loading list..."
    >
      {Array.from({ length: count }, (_, index) => (
        <ListItemSkeleton key={index} />
      ))}
    </div>
  );
}

/**
 * Navigation card skeleton for home page
 */
export function NavigationCardSkeleton() {
  return (
    <div className="h-80 bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
      {/* Icon skeleton */}
      <div className="flex justify-center mb-6">
        <Skeleton className="w-16 h-16 rounded-full" />
      </div>
      
      {/* Title */}
      <Skeleton className="h-6 w-32 mx-auto mb-3" />
      
      {/* Description */}
      <div className="space-y-2 mb-4">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4 mx-auto" />
      </div>
      
      {/* Footer */}
      <Skeleton className="h-4 w-24 mx-auto" />
    </div>
  );
}

/**
 * Home page grid skeleton
 */
export function HomePageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header skeleton */}
        <div className="text-center mb-12">
          <Skeleton className="h-12 w-64 mx-auto mb-4" />
          <Skeleton className="h-4 w-96 mx-auto" />
        </div>
        
        {/* Navigation grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }, (_, index) => (
            <NavigationCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Search bar skeleton
 */
export function SearchBarSkeleton() {
  return (
    <div className="relative mb-8">
      <Skeleton className="h-12 w-full rounded-lg" />
    </div>
  );
}

/**
 * Page header skeleton
 */
interface PageHeaderSkeletonProps {
  showBackButton?: boolean;
  showStats?: boolean;
}

export function PageHeaderSkeleton({ showBackButton = true, showStats = true }: PageHeaderSkeletonProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          {showBackButton && <Skeleton className="w-10 h-10 rounded-lg" />}
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        
        {showStats && (
          <div className="flex items-center space-x-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-32" />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Video player skeleton
 */
export function VideoPlayerSkeleton() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-6xl mx-4 bg-black rounded-lg overflow-hidden">
        {/* Header skeleton */}
        <div className="flex items-center justify-between p-4 bg-gray-900">
          <Skeleton className="h-6 w-64" />
          <div className="flex space-x-2">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-8 h-8 rounded-full" />
          </div>
        </div>
        
        {/* Video area skeleton */}
        <Skeleton className="aspect-video" />
        
        {/* Footer skeleton */}
        <div className="p-4 bg-gray-800 border-t border-gray-700">
          <Skeleton className="h-5 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </div>
  );
}

/**
 * Generic loading spinner
 */
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-white/20 border-t-white ${sizeClasses[size]} ${className}`} />
  );
}

/**
 * Category Grid Skeleton for categories page
 */
interface CategoryGridSkeletonProps {
  count?: number;
}

export function CategoryGridSkeleton({ count = 12 }: CategoryGridSkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 animate-pulse">
          <div className="w-12 h-12 bg-gray-300/20 rounded-lg mb-4"></div>
          <div className="h-5 bg-gray-300/20 rounded mb-2"></div>
          <div className="h-4 bg-gray-300/20 rounded w-24"></div>
        </div>
      ))}
    </div>
  );
}

/**
 * Centered loading state component
 */
interface LoadingStateProps {
  message?: string;
  showSpinner?: boolean;
}

export function LoadingState({ message = 'Loading...', showSpinner = true }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {showSpinner && <LoadingSpinner className="mb-4" />}
      <p className="text-gray-300 text-lg">{message}</p>
    </div>
  );
}