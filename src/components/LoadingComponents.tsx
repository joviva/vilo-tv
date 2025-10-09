"use client";

import React from "react";

interface LoadingSkeletonProps {
  type?: "card" | "list" | "grid" | "text";
  count?: number;
  className?: string;
}

export function LoadingSkeleton({ type = "card", count = 1, className = "" }: LoadingSkeletonProps) {
  const skeletons = Array.from({ length: count }, (_, i) => {
    switch (type) {
      case "card":
        return (
          <div key={i} className={`bg-white/10 rounded-lg p-4 animate-pulse ${className}`}>
            <div className="aspect-video bg-gray-400 rounded mb-3"></div>
            <div className="h-5 bg-gray-400 rounded mb-2"></div>
            <div className="h-4 bg-gray-400 rounded w-20"></div>
          </div>
        );
      
      case "list":
        return (
          <div key={i} className={`bg-white/10 rounded-lg p-4 animate-pulse ${className}`}>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-400 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-400 rounded mb-2"></div>
                <div className="h-3 bg-gray-400 rounded w-24"></div>
              </div>
            </div>
          </div>
        );
      
      case "grid":
        return (
          <div key={i} className={`bg-white/10 rounded-lg p-4 animate-pulse ${className}`}>
            <div className="text-4xl mb-4 bg-gray-400 rounded-full w-16 h-16 mx-auto"></div>
            <div className="h-5 bg-gray-400 rounded mb-2"></div>
            <div className="h-4 bg-gray-400 rounded w-20"></div>
          </div>
        );
      
      case "text":
        return (
          <div key={i} className={`animate-pulse ${className}`}>
            <div className="h-4 bg-gray-400 rounded mb-2"></div>
            <div className="h-4 bg-gray-400 rounded mb-2 w-3/4"></div>
            <div className="h-4 bg-gray-400 rounded w-1/2"></div>
          </div>
        );
      
      default:
        return null;
    }
  });

  return <>{skeletons}</>;
}

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className = "" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8", 
    lg: "w-12 h-12"
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]} ${className}`}></div>
  );
}

interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  message?: string;
}

export function LoadingOverlay({ isLoading, children, message = "Loading..." }: LoadingOverlayProps) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="bg-white/10 rounded-lg p-6 text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <p className="text-white">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
