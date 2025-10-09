"use client";

import { useEffect, useRef, useState } from "react";
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HeartIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import type Hls from "hls.js";

interface Channel {
  id: string;
  name: string;
  url: string;
  logo?: string;
  category: string;
  country?: string;
}

interface VideoPlayerProps {
  url: string;
  title: string;
  poster?: string;
  className?: string;
  onClose?: () => void;
  channel?: Channel;
  // New props for channel navigation
  channels?: Channel[];
  currentChannelIndex?: number;
  onNextChannel?: () => void;
  onPrevChannel?: () => void;
  onChannelFailed?: (channelId: string) => void;
  // Favorite functionality
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  // Delete functionality
  onDeleteChannel?: (channelId: string) => void;
}

export default function VideoPlayer({
  url,
  title,
  poster,
  className = "",
  onClose,
  channel,
  channels = [],
  currentChannelIndex = 0,
  onNextChannel,
  onPrevChannel,
  onChannelFailed,
  isFavorite = false,
  onToggleFavorite,
  onDeleteChannel,
}: VideoPlayerProps) {
  // Use either url or channel.url
  const streamUrl = url || channel?.url || "";
  const displayTitle = channel?.name || title;
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasTriedCurrentChannel = useRef<boolean>(false);
  const isNavigatingBackward = useRef<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-play effect - triggers whenever streamUrl changes (new channel selected)
  useEffect(() => {
    const video = videoRef.current;
    if (video && streamUrl) {
      hasTriedCurrentChannel.current = false; // Reset the flag for new channel
      
      // Clear any pending error timeout
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
        errorTimeoutRef.current = null;
      }
      
      // Reduced delay for faster channel start
      setTimeout(() => {
        video.play().catch(() => {
          // Auto-play prevented
        });
      }, 100); // Reduced from 200ms to 100ms
    }
  }, [streamUrl]);

  // Hide controls after 10 seconds of playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const startHideTimer = () => {
      // Clear any existing timeout
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
      
      // Show controls
      setShowControls(true);
      
      // Hide after 10 seconds
      hideControlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 10000);
    };

    const handlePlay = () => {
      startHideTimer();
    };

    const handlePause = () => {
      setShowControls(true);
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    // Cleanup
    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, []);

  // Handle mouse movement to show controls
  const handleMouseMove = () => {
    setShowControls(true);
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    hideControlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 10000);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!onClose || channels.length <= 1) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "ArrowLeft" &&
        onPrevChannel &&
        currentChannelIndex > 0
      ) {
        event.preventDefault();
        isNavigatingBackward.current = true;
        onPrevChannel();
      } else if (
        event.key === "ArrowRight" &&
        onNextChannel &&
        currentChannelIndex < channels.length - 1
      ) {
        event.preventDefault();
        isNavigatingBackward.current = false;
        onNextChannel();
      } else if (event.key === "Escape" && onClose) {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    onClose,
    onPrevChannel,
    onNextChannel,
    currentChannelIndex,
    channels.length,
  ]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Function to skip to next channel if available
    const skipToNextChannel = () => {
      if (!hasTriedCurrentChannel.current && onNextChannel && currentChannelIndex < channels.length - 1) {
        hasTriedCurrentChannel.current = true;
        
        // Notify parent that this channel failed so it can be moved to the end
        if (onChannelFailed && channel?.id) {
          onChannelFailed(channel.id);
        }
        
        setTimeout(() => {
          onNextChannel();
        }, 300); // Reduced from 1000ms to 300ms for faster skipping
      }
    };

    // Function to skip to previous channel if available
    const skipToPrevChannel = () => {
      if (!hasTriedCurrentChannel.current && onPrevChannel && currentChannelIndex > 0) {
        hasTriedCurrentChannel.current = true;
        
        // Notify parent that this channel failed so it can be moved to the end
        if (onChannelFailed && channel?.id) {
          onChannelFailed(channel.id);
        }
        
        setTimeout(() => {
          onPrevChannel();
        }, 300); // Reduced from 1000ms to 300ms for faster skipping
      }
    };

    // Add video error event listener
    const handleVideoError = () => {
      // Skip in the direction we're navigating
      if (isNavigatingBackward.current) {
        skipToPrevChannel();
      } else {
        skipToNextChannel();
      }
    };

    video.addEventListener("error", handleVideoError);

    // Clean up previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (streamUrl && streamUrl.trim() !== "") {
      // Set a timeout to auto-skip if stream doesn't load within 5 seconds
      errorTimeoutRef.current = setTimeout(() => {
        if (!hasTriedCurrentChannel.current && video.readyState < 2) {
          // Skip in the direction we're navigating
          if (isNavigatingBackward.current) {
            skipToPrevChannel();
          } else {
            skipToNextChannel();
          }
        }
      }, 3000); // 3 seconds timeout (reduced from 5 for faster skipping)

      // Dynamic import of HLS.js to avoid SSR issues
      if (typeof window !== "undefined") {
        import("hls.js")
          .then(({ default: Hls }) => {
            if (Hls.isSupported()) {
              // Use HLS.js for browsers that support it
              // Optimized for faster playback and lower latency
              const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
                // Buffer settings optimized for fast start
                maxBufferLength: 20, // Reduced from 30 for faster start
                maxMaxBufferLength: 300, // Reduced from 600
                maxBufferSize: 60 * 1000 * 1000, // 60 MB
                maxBufferHole: 0.5, // Jump small gaps
                // Loading optimizations
                maxLoadingDelay: 2, // Reduced from 4 for faster loading
                manifestLoadingRetryDelay: 500,
                levelLoadingRetryDelay: 500,
                fragLoadingRetryDelay: 500,
                // Start position
                startPosition: -1, // Live edge for live streams
                // Fragment loading
                highBufferWatchdogPeriod: 1, // Monitor buffer more frequently
                nudgeMaxRetry: 2,
                // Bandwidth
                abrEwmaDefaultEstimate: 500000, // Start with 500kbps estimate
                abrBandWidthFactor: 0.95,
                abrBandWidthUpFactor: 0.7,
                // Playback
                liveSyncDurationCount: 2, // Closer to live edge
                liveMaxLatencyDurationCount: 5,
                // Performance
                enableSoftwareAES: false, // Use hardware decryption if available
                manifestLoadingTimeOut: 10000,
                manifestLoadingMaxRetry: 1,
                levelLoadingTimeOut: 10000,
                levelLoadingMaxRetry: 1,
                fragLoadingTimeOut: 20000,
                fragLoadingMaxRetry: 1,
              });

              hlsRef.current = hls;

              try {
                hls.loadSource(streamUrl);
                hls.attachMedia(video);
              } catch {
                skipToNextChannel();
                // Fallback to direct video
                video.src = streamUrl;
              }

              hls.on(Hls.Events.MANIFEST_PARSED, () => {
                // Clear error timeout on success
                if (errorTimeoutRef.current) {
                  clearTimeout(errorTimeoutRef.current);
                  errorTimeoutRef.current = null;
                }
                // Auto-play the video once manifest is loaded - reduced delay
                setTimeout(() => {
                  video.play().catch(() => {
                    // Auto-play prevented
                  });
                }, 50); // Reduced from 100ms for faster playback start
              });

              hls.on(Hls.Events.ERROR, (event, data) => {
                if (!data) return;

                if (data.fatal) {
                  switch (data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                      try {
                        hls.startLoad();
                      } catch {
                        skipToNextChannel();
                      }
                      break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                      try {
                        hls.recoverMediaError();
                      } catch {
                        skipToNextChannel();
                      }
                      break;
                    default:
                      hls.destroy();
                      hlsRef.current = null;
                      skipToNextChannel();
                      break;
                  }
                }
              });
            } else {
              // HLS.js not supported, try native HLS or fallback
              const handleLoadedMetadata = () => {
                // Clear error timeout on success
                if (errorTimeoutRef.current) {
                  clearTimeout(errorTimeoutRef.current);
                  errorTimeoutRef.current = null;
                }
                video.play().catch(() => {
                  // Auto-play prevented
                });
              };

              if (video.canPlayType("application/vnd.apple.mpegurl")) {
                // Native HLS support (Safari)
                video.src = streamUrl;
                video.addEventListener("loadedmetadata", handleLoadedMetadata);
              } else {
                // Direct video fallback
                video.src = streamUrl;
                video.addEventListener("loadedmetadata", handleLoadedMetadata);
              }

              // Cleanup for native HLS
              return () => {
                video.removeEventListener("loadedmetadata", handleLoadedMetadata);
                video.removeEventListener("error", handleVideoError);
                if (errorTimeoutRef.current) {
                  clearTimeout(errorTimeoutRef.current);
                  errorTimeoutRef.current = null;
                }
              };
            }
          })
          .catch(() => {
            skipToNextChannel();
            // Fallback to direct video with cleanup
            const handleLoadedMetadata = () => {
              // Clear error timeout on success
              if (errorTimeoutRef.current) {
                clearTimeout(errorTimeoutRef.current);
                errorTimeoutRef.current = null;
              }
              video.play().catch(() => {
                // Auto-play prevented
              });
            };
            
            video.src = streamUrl;
            video.addEventListener("loadedmetadata", handleLoadedMetadata);
            
            // Cleanup
            return () => {
              video.removeEventListener("loadedmetadata", handleLoadedMetadata);
              video.removeEventListener("error", handleVideoError);
              if (errorTimeoutRef.current) {
                clearTimeout(errorTimeoutRef.current);
                errorTimeoutRef.current = null;
              }
            };
          });
      } else {
        // Server-side rendering or window not available, set basic video source
        video.src = streamUrl;
      }
    }

    return () => {
      video.removeEventListener("error", handleVideoError);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
        errorTimeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamUrl, onNextChannel, currentChannelIndex, channels.length]);

  // Wrapper functions for button clicks to set navigation direction
  const handlePrevClick = () => {
    if (onPrevChannel) {
      isNavigatingBackward.current = true;
      onPrevChannel();
    }
  };

  const handleNextClick = () => {
    if (onNextChannel) {
      isNavigatingBackward.current = false;
      onNextChannel();
    }
  };

  // If onClose is provided, render as a modal
  if (onClose) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="relative w-full max-w-6xl mx-4 bg-black rounded-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gray-900">
            <div className="flex items-center space-x-4">
              <h2 className="text-white font-semibold">{displayTitle}</h2>
              {channels.length > 0 && (
                <div className="text-gray-400 text-sm">
                  Channel {currentChannelIndex + 1} of {channels.length}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {/* Channel Navigation */}
              {channels.length > 1 && (
                <>
                  <button
                    onClick={handlePrevClick}
                    disabled={currentChannelIndex === 0}
                    className="p-2 rounded-full hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Previous channel"
                    aria-label="Previous channel"
                  >
                    <ChevronLeftIcon className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={handleNextClick}
                    disabled={currentChannelIndex === channels.length - 1}
                    className="p-2 rounded-full hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Next channel"
                    aria-label="Next channel"
                  >
                    <ChevronRightIcon className="w-5 h-5 text-white" />
                  </button>
                </>
              )}
              {/* Favorite Button */}
              {onToggleFavorite && (
                <button
                  onClick={onToggleFavorite}
                  className="p-2 rounded-full hover:bg-gray-700 transition-colors"
                  title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                  aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                >
                  {isFavorite ? (
                    <HeartIconSolid className="w-5 h-5 text-red-500" />
                  ) : (
                    <HeartIcon className="w-5 h-5 text-white" />
                  )}
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-gray-700 transition-colors"
                title="Close video player"
                aria-label="Close video player"
              >
                <XMarkIcon className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>

          {/* Delete Confirmation Dialog */}
          {showDeleteConfirm && channel && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
              <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-4 border border-red-500/50">
                <h3 className="text-xl font-bold text-white mb-3 flex items-center">
                  <TrashIcon className="w-6 h-6 text-red-500 mr-2" />
                  Delete Channel?
                </h3>
                <p className="text-gray-300 mb-4">
                  Are you sure you want to permanently delete <strong className="text-white">{channel.name}</strong>?
                </p>
                <p className="text-sm text-gray-400 mb-6">
                  This channel will be hidden from all sections of the app.
                </p>
                <div className="flex flex-col space-y-3">
                  {/* Primary Actions - Side by Side */}
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        if (onDeleteChannel && channel) {
                          onDeleteChannel(channel.id);
                          setShowDeleteConfirm(false);
                          if (onClose) onClose();
                        }
                      }}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors font-semibold"
                    >
                      Delete Permanently
                    </button>
                    {onChannelFailed && (
                      <button
                        onClick={() => {
                          if (channel) {
                            onChannelFailed(channel.id);
                            setShowDeleteConfirm(false);
                            // Move to next channel
                            if (onNextChannel && currentChannelIndex < channels.length - 1) {
                              onNextChannel();
                            } else if (onPrevChannel && currentChannelIndex > 0) {
                              onPrevChannel();
                            }
                          }
                        }}
                        className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors font-medium border border-yellow-500/50"
                      >
                        📋 Send to Back
                      </button>
                    )}
                  </div>
                  {/* Cancel at Bottom */}
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Video */}
          <div 
            className="relative aspect-video"
            onMouseMove={handleMouseMove}
          >
            <video
              ref={videoRef}
              className="w-full h-full"
              controls
              autoPlay
              preload="auto"
              playsInline
              poster={poster || channel?.logo}
              aria-label={`Video player for ${displayTitle}`}
            >
              <source src={streamUrl} type="application/vnd.apple.mpegurl" />
              Your browser does not support the video tag.
            </video>

            {/* Channel Navigation Indicator */}
            {channels.length > 1 && showControls && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 rounded-full px-4 py-2 flex items-center space-x-3 backdrop-blur-sm transition-opacity duration-300">
                <button
                  onClick={handlePrevClick}
                  disabled={currentChannelIndex === 0}
                  className="p-1 rounded-full hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Previous channel"
                >
                  <ChevronLeftIcon className="w-4 h-4 text-white" />
                </button>
                <span className="text-white text-sm font-medium">
                  {currentChannelIndex + 1} / {channels.length}
                </span>
                <button
                  onClick={handleNextClick}
                  disabled={currentChannelIndex === channels.length - 1}
                  className="p-1 rounded-full hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Next channel"
                >
                  <ChevronRightIcon className="w-4 h-4 text-white" />
                </button>
                {/* Favorite Button in Counter */}
                {onToggleFavorite && (
                  <>
                    <div className="w-px h-4 bg-white/30"></div>
                    <button
                      onClick={onToggleFavorite}
                      className="p-1 rounded-full hover:bg-white/20 transition-colors"
                      title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                    >
                      {isFavorite ? (
                        <HeartIconSolid className="w-4 h-4 text-red-500" />
                      ) : (
                        <HeartIcon className="w-4 h-4 text-white" />
                      )}
                    </button>
                  </>
                )}
                {/* Delete Button in Counter */}
                {onDeleteChannel && channel && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-1 rounded-full hover:bg-red-600/30 transition-colors"
                    title="Delete channel permanently"
                    aria-label="Delete channel permanently"
                  >
                    <TrashIcon className="w-4 h-4 text-red-400" />
                  </button>
                )}
              </div>
            )}

            {/* Single Channel Favorite Button */}
            {channels.length <= 1 && onToggleFavorite && showControls && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 rounded-full px-4 py-2 flex items-center space-x-2 backdrop-blur-sm transition-opacity duration-300">
                <button
                  onClick={onToggleFavorite}
                  className="p-1 rounded-full hover:bg-white/20 transition-colors"
                  title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                  aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                >
                  {isFavorite ? (
                    <HeartIconSolid className="w-4 h-4 text-red-500" />
                  ) : (
                    <HeartIcon className="w-4 h-4 text-white" />
                  )}
                </button>
                <span className="text-white text-xs">
                  {isFavorite ? "Favorited" : "Add to favorites"}
                </span>
              </div>
            )}

            {/* Channel Navigation Overlay */}
            {channels.length > 1 && (
              <>
                <button
                  onClick={handlePrevClick}
                  disabled={currentChannelIndex === 0}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white p-3 rounded-full transition-all duration-200 opacity-80 hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg border border-white/20"
                  title="Previous channel"
                  aria-label="Previous channel"
                >
                  <ChevronLeftIcon className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNextClick}
                  disabled={currentChannelIndex === channels.length - 1}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white p-3 rounded-full transition-all duration-200 opacity-80 hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg border border-white/20"
                  title="Next channel"
                  aria-label="Next channel"
                >
                  <ChevronRightIcon className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Channel Info */}
          {channel && (
            <div className="p-4 bg-gray-800 border-t border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">{channel.name}</h3>
                  <p className="text-gray-400 text-sm">{channel.category}</p>
                </div>
                {channels.length > 1 && (
                  <div className="text-gray-400 text-sm">
                    Use arrow keys or click buttons to change channels
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Regular inline player
  return (
    <div
      className={`relative bg-black rounded-lg overflow-hidden ${className}`}
    >
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        preload="metadata"
        poster={poster}
        aria-label={`Video player for ${displayTitle}`}
      >
        <source src={streamUrl} type="application/vnd.apple.mpegurl" />
        Your browser does not support the video tag.
      </video>

      {/* Loading overlay */}
      <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none opacity-0 transition-opacity">
        <div className="text-white text-lg">Loading...</div>
      </div>
    </div>
  );
}
