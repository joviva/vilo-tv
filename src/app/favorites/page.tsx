"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeftIcon,
  PlayIcon,
  HeartIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import VideoPlayer from "@/components/VideoPlayer";
import { useFavorites, Channel } from "@/hooks/useFavorites";
import { useBlocklist } from "@/hooks/useBlocklist";
import { getFlagByCountryCode, getIconByCategory } from "@/lib/countryFlags";

export default function FavoritesPage() {
  const { favorites, removeFavorite, isFavorite, toggleFavorite } = useFavorites();
  const { addToBlocklist, isBlocked } = useBlocklist();
  

  const [search, setSearch] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [currentChannelIndex, setCurrentChannelIndex] = useState(0);
  const [failedChannelIds, setFailedChannelIds] = useState<Set<string>>(new Set());
  const [skipMessage, setSkipMessage] = useState<string>("");

  const filteredChannels = favorites.filter(
    (channel) =>
      !isBlocked(channel.id) && // Filter out blocked channels
      (channel.name.toLowerCase().includes(search.toLowerCase()) ||
      channel.category.toLowerCase().includes(search.toLowerCase()) ||
      channel.country.toLowerCase().includes(search.toLowerCase()))
  ).sort((a, b) => {
    // Sort channels: working channels first, failed channels at the end
    const aFailed = failedChannelIds.has(a.id);
    const bFailed = failedChannelIds.has(b.id);
    
    if (aFailed && !bFailed) return 1;
    if (!aFailed && bFailed) return -1;
    return 0;
  });

  // Channel navigation functions
  const handleNextChannel = useCallback(() => {
    if (currentChannelIndex < filteredChannels.length - 1) {
      const nextIndex = currentChannelIndex + 1;
      setCurrentChannelIndex(nextIndex);
      setSelectedChannel(filteredChannels[nextIndex]);
    }
  }, [currentChannelIndex, filteredChannels]);

  const handlePrevChannel = useCallback(() => {
    if (currentChannelIndex > 0) {
      const prevIndex = currentChannelIndex - 1;
      setCurrentChannelIndex(prevIndex);
      setSelectedChannel(filteredChannels[prevIndex]);
    }
  }, [currentChannelIndex, filteredChannels]);

  const handleChannelFailed = useCallback((channelId: string) => {
    const failedChannel = filteredChannels.find(ch => ch.id === channelId);
    
    setFailedChannelIds((prev) => {
      const newSet = new Set(prev);
      newSet.add(channelId);
      return newSet;
    });
    
    // Show skip message
    if (failedChannel) {
      setSkipMessage(`Skipping "${failedChannel.name}" - channel failed to load`);
      setTimeout(() => setSkipMessage(""), 3000);
    }
    
    // Auto-advance to next channel if available
    if (currentChannelIndex < filteredChannels.length - 1) {
      setTimeout(() => {
        handleNextChannel();
      }, 100);
    }
  }, [filteredChannels, currentChannelIndex, handleNextChannel]);

  const handleDeleteChannel = useCallback((channelId: string) => {
    addToBlocklist(channelId);
    removeFavorite(channelId);
    
    // Show notification
    const deletedChannel = filteredChannels.find(ch => ch.id === channelId);
    if (deletedChannel) {
      setSkipMessage(`Channel "${deletedChannel.name}" permanently deleted`);
      setTimeout(() => setSkipMessage(""), 3000);
    }
    
    // Move to next channel if we're watching the deleted one
    if (selectedChannel?.id === channelId) {
      if (filteredChannels.length > 1) {
        const nextIndex = currentChannelIndex < filteredChannels.length - 1 
          ? currentChannelIndex 
          : Math.max(0, currentChannelIndex - 1);
        setCurrentChannelIndex(nextIndex);
        setSelectedChannel(filteredChannels[nextIndex]);
      } else {
        setSelectedChannel(null);
      }
    }
  }, [addToBlocklist, removeFavorite, filteredChannels, selectedChannel, currentChannelIndex]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Skip Notification */}
        {skipMessage && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
            <div className="bg-yellow-500 text-black px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
              <span className="text-xl">⚠️</span>
              <span className="font-semibold">{skipMessage}</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ArrowLeftIcon className="w-6 h-6 text-white" />
            </Link>
            <div className="flex items-center space-x-3">
              <HeartIconSolid className="w-10 h-10 text-red-500" />
              <div>
                <h1 className="text-3xl font-bold text-white">
                  My Favorites
                </h1>
              </div>
            </div>
          </div>

          {/* Search and count */}
          <div className="flex items-center space-x-4">
            <div className="text-blue-300 text-sm whitespace-nowrap">
              {favorites.length} favorites
            </div>
            <div className="relative w-64">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search favorites..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/20 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Video Player Modal */}
        {selectedChannel && (
          <VideoPlayer
            url={selectedChannel.url}
            title={selectedChannel.name}
            poster={selectedChannel.logo}
            channel={selectedChannel}
            channels={filteredChannels}
            currentChannelIndex={currentChannelIndex}
            onClose={() => {
              setSelectedChannel(null);
              setCurrentChannelIndex(0);
            }}
            onNextChannel={handleNextChannel}
            onPrevChannel={handlePrevChannel}
            onChannelFailed={handleChannelFailed}
            isFavorite={isFavorite(selectedChannel.id)}
            onToggleFavorite={() => toggleFavorite(selectedChannel)}
            onDeleteChannel={handleDeleteChannel}
          />
        )}

        {/* Favorites Grid */}
        {favorites.length === 0 ? (
          <div className="text-center py-12">
            <HeartIcon className="w-24 h-24 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No favorites yet
            </h3>
            <p className="text-gray-400 mb-6">
              Start adding channels to your favorites by clicking the heart icon
            </p>
            <Link
              href="/"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Browse Channels
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredChannels.map((channel) => {
                const isFailed = failedChannelIds.has(channel.id);
                return (
                  <div
                    key={channel.id}
                    onClick={() => {
                      const channelIndex = filteredChannels.findIndex(
                        (ch) => ch.id === channel.id
                      );
                      setCurrentChannelIndex(channelIndex);
                      setSelectedChannel(channel);
                    }}
                    className={`group bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden hover:bg-white/20 transition-all duration-300 transform hover:scale-105 cursor-pointer ${
                      isFailed ? 'opacity-60 border-2 border-red-500/50' : ''
                    }`}
                  >
                    <div className="relative h-32 bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                      {channel.logo ? (
                        <Image
                          src={channel.logo}
                          alt={channel.name}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <PlayIcon className="w-12 h-12 text-white opacity-50" />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFavorite(channel.id);
                        }}
                        className="absolute top-2 right-2 p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors z-10"
                        title="Remove from favorites"
                      >
                        <HeartIconSolid className="w-5 h-5 text-white" />
                      </button>
                    </div>
                    <div className="p-4">
                      <h3 className="text-white font-semibold mb-2 line-clamp-2">
                        {channel.name}
                      </h3>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-blue-300 flex items-center gap-1">
                          <span>{getIconByCategory(channel.category)}</span>
                          <span>{channel.category}</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">{channel.country}</span>
                        {channel.countryCode && (
                          <span className="text-lg">
                            {getFlagByCountryCode(channel.countryCode)}
                          </span>
                        )}
                      </div>
                      {isFailed && (
                        <div className="mt-2 text-xs text-red-400">
                          ⚠ Failed to load
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredChannels.length === 0 && search && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  No favorites found
                </h3>
                <p className="text-gray-400">
                  Try adjusting your search terms
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
