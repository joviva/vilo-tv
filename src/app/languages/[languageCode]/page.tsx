"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeftIcon,
  PlayIcon,
  MagnifyingGlassIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import VideoPlayer from "@/components/VideoPlayer";
import { useFavorites, Channel } from "@/hooks/useFavorites";
import { useBlocklist } from "@/hooks/useBlocklist";
import { getFlagByCountryCode, getIconByCategory } from "@/lib/countryFlags";

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export default function LanguagePage() {
  const params = useParams();
  const languageCode = params.languageCode as string;
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isBlocked, addToBlocklist } = useBlocklist();

  const [language, setLanguage] = useState<Language | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [currentChannelIndex, setCurrentChannelIndex] = useState(0);
  const [failedChannelIds, setFailedChannelIds] = useState<Set<string>>(new Set());
  const channelsPerPage = 100000; // No limit - show all channels

  const fetchLanguageChannels = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      params.append("limit", channelsPerPage.toString());

      const response = await fetch(`/api/languages/${languageCode}?${params}`);
      const data = await response.json();

      if (data.success) {
        setLanguage(data.language);
        setChannels(data.channels);
      }
    } catch (error) {
      console.error("Error fetching language channels:", error);
    } finally {
      setLoading(false);
    }
  }, [languageCode, search, channelsPerPage]);

  useEffect(() => {
    fetchLanguageChannels();
  }, [fetchLanguageChannels]);

  const filteredChannels = channels
    .filter((channel) => !isBlocked(channel.id)) // Filter out blocked channels
    .filter(
      (channel) =>
        channel.name.toLowerCase().includes(search.toLowerCase()) ||
        channel.category.toLowerCase().includes(search.toLowerCase()) ||
        channel.country.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      // Sort channels: working channels first, failed channels at the end
      const aFailed = failedChannelIds.has(a.id);
      const bFailed = failedChannelIds.has(b.id);

      if (aFailed && !bFailed) return 1; // a goes to end
      if (!aFailed && bFailed) return -1; // b goes to end
      return 0; // keep original order
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

  // Handle failed channel - mark it as failed so it moves to the end
  const handleChannelFailed = useCallback((channelId: string) => {
    setFailedChannelIds((prev) => {
      const newSet = new Set(prev);
      newSet.add(channelId);
      return newSet;
    });
  }, []);

  // Handle channel deletion
  const handleDeleteChannel = useCallback((channelId: string) => {
    // Add to blocklist
    addToBlocklist(channelId);

    // If we're deleting the currently playing channel, navigate to the next one
    if (selectedChannel && selectedChannel.id === channelId) {
      // Close the player
      setSelectedChannel(null);
      setCurrentChannelIndex(0);
    }
  }, [addToBlocklist, selectedChannel]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link
              href="/languages"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ArrowLeftIcon className="w-6 h-6 text-white" />
            </Link>
            {language && (
              <div className="flex items-center space-x-3">
                <span className="text-4xl">{language.flag}</span>
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    {language.name}
                  </h1>
                </div>
              </div>
            )}
          </div>

          {/* Search and channel count - moved to top right */}
          <div className="flex items-center space-x-4">
            <div className="text-blue-300 text-sm whitespace-nowrap">{channels.length} channels</div>
            <div className="relative w-64">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search channels..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/20 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Channels Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-white/10 rounded-lg p-4 animate-pulse">
                <div className="h-32 bg-gray-400 rounded mb-4"></div>
                <div className="h-5 bg-gray-400 rounded mb-2"></div>
                <div className="h-4 bg-gray-400 rounded w-20"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredChannels.map((channel) => {
                const isFailed = failedChannelIds.has(channel.id);
                const channelIsFavorite = isFavorite(channel.id);
                return (
                  <div
                    key={channel.id}
                    className={`group bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden hover:bg-white/20 transition-all duration-300 transform hover:scale-105 ${
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
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="text-white text-4xl font-bold">
                          {channel.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div 
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center cursor-pointer"
                        onClick={() => {
                          const channelIndex = filteredChannels.findIndex(
                            (ch) => ch.id === channel.id
                          );
                          setCurrentChannelIndex(channelIndex);
                          setSelectedChannel(channel);
                        }}
                      >
                        <PlayIcon className="w-12 h-12 text-white" />
                      </div>
                      {/* Favorite Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const channelData = {
                            id: channel.id,
                            name: channel.name,
                            url: channel.url,
                            logo: channel.logo,
                            category: channel.category,
                            country: channel.country || "",
                            countryCode: channel.countryCode,
                            language: channel.language || [],
                          };
                          toggleFavorite(channelData);
                        }}
                        className="absolute top-2 right-2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors z-10"
                        title={channelIsFavorite ? "Remove from favorites" : "Add to favorites"}
                      >
                        {channelIsFavorite ? (
                          <HeartIconSolid className="w-5 h-5 text-red-500" />
                        ) : (
                          <HeartIcon className="w-5 h-5 text-white" />
                        )}
                      </button>
                      {isFailed && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                          ⚠ Failed
                        </div>
                      )}
                    </div>

                    <div className="p-4 cursor-pointer"
                      onClick={() => {
                        const channelIndex = filteredChannels.findIndex(
                          (ch) => ch.id === channel.id
                        );
                        setCurrentChannelIndex(channelIndex);
                        setSelectedChannel(channel);
                      }}
                    >
                      <h3 className="text-white font-semibold mb-1 line-clamp-1">
                        {channel.name}
                      </h3>
                      <p className="text-gray-400 text-sm mb-1 flex items-center gap-1">
                        <span>{getIconByCategory(channel.category)}</span>
                        <span>{channel.category}</span>
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-blue-300 text-xs">{channel.country}</p>
                        {channel.countryCode && (
                          <span className="text-lg">
                            {getFlagByCountryCode(channel.countryCode)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredChannels.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📺</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  No channels found
                </h3>
                <p className="text-gray-400">Try adjusting your search terms</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Video Player Modal */}
      {selectedChannel && (
        <VideoPlayer
          url={selectedChannel.url}
          title={selectedChannel.name}
          channels={filteredChannels}
          currentChannelIndex={currentChannelIndex}
          onNextChannel={handleNextChannel}
          onPrevChannel={handlePrevChannel}
          onChannelFailed={handleChannelFailed}
          isFavorite={isFavorite(selectedChannel.id)}
          onToggleFavorite={() => toggleFavorite(selectedChannel)}
          onDeleteChannel={handleDeleteChannel}
          channel={{
            id: selectedChannel.id,
            name: selectedChannel.name,
            url: selectedChannel.url,
            logo: selectedChannel.logo,
            category: selectedChannel.category,
            country: selectedChannel.country,
          }}
          onClose={() => {
            setSelectedChannel(null);
            setCurrentChannelIndex(0);
          }}
        />
      )}
    </div>
  );
}
