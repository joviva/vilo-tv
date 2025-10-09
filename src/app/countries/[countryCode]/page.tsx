"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
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
import { useDebounce } from "@/hooks/useDebounce";
import { useFavorites } from "@/hooks/useFavorites";
import { useBlocklist } from "@/hooks/useBlocklist";
import { getFlagByCountryCode, getIconByCategory } from "@/lib/countryFlags";
import { ChannelGridSkeleton } from "@/components/Skeletons";

interface Channel {
  id: string;
  name: string;
  url: string;
  logo?: string;
  category: string;
  language: string[];
  country?: string;
  countryCode: string;
}

interface Country {
  code: string;
  name: string;
  flag: string;
}

export default function CountryPage() {
  const params = useParams();
  const countryCode = params.countryCode as string;
  const { isFavorite, toggleFavorite } = useFavorites();

  const [country, setCountry] = useState<Country | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [totalChannels, setTotalChannels] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [currentChannelIndex, setCurrentChannelIndex] = useState(0);
  const [failedChannelIds, setFailedChannelIds] = useState<Set<string>>(new Set());
  const channelsPerPage = 100000; // No limit - show all channels
  const currentPage = 1; // Fixed page since we show all channels
  
  // Blocklist hook
  const { isBlocked, addToBlocklist } = useBlocklist();
  
  // Debounce search to avoid excessive API calls
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    fetchCountryChannels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryCode, debouncedSearch, currentPage]);

  const fetchCountryChannels = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      params.append("page", currentPage.toString());
      params.append("limit", channelsPerPage.toString());

      const response = await fetch(`/api/countries/${countryCode}?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch country channels");
      }
      const data = await response.json();

      if (data.success) {
        setCountry(data.country);
        setChannels(data.channels);
        setTotalChannels(data.total); // Store the actual total
      }
    } catch (error) {
      console.error("Error fetching country channels:", error);
      setChannels([]);
      setTotalChannels(0);
    } finally {
      setLoading(false);
    }
  };

  // Memoize filtered channels to avoid recalculation on every render
  const filteredChannels = useMemo(() => {
    const filtered = channels
      .filter((channel) => !isBlocked(channel.id)) // Filter out blocked channels
      .filter(
        (channel) =>
          channel.name.toLowerCase().includes(search.toLowerCase()) ||
          channel.category.toLowerCase().includes(search.toLowerCase())
      );

    // Sort channels: working channels first, failed channels at the end
    return filtered.sort((a, b) => {
      const aFailed = failedChannelIds.has(a.id);
      const bFailed = failedChannelIds.has(b.id);

      if (aFailed && !bFailed) return 1; // a goes to end
      if (!aFailed && bFailed) return -1; // b goes to end
      return 0; // keep original order
    });
  }, [channels, search, failedChannelIds, isBlocked]);

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
        <div className="flex items-center space-x-4 mb-8">
          <Link
            href="/countries"
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeftIcon className="w-6 h-6 text-white" />
          </Link>
          {country && (
            <div className="flex items-center space-x-3">
              <span className="text-4xl">{country.flag}</span>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {country.name}
                </h1>
                <p className="text-gray-400">
                  {totalChannels} channels available
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
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

        {/* Channels Grid */}
        {loading ? (
          <ChannelGridSkeleton count={12} />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredChannels.map((channel) => {
                const isFailed = failedChannelIds.has(channel.id);
                return (
                  <div
                    key={channel.id}
                    className={`group bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden hover:bg-white/20 transition-all duration-300 transform hover:scale-105 cursor-pointer ${
                      isFailed ? 'opacity-60 border-2 border-red-500/50' : ''
                    }`}
                    onClick={() => {
                      const channelIndex = filteredChannels.findIndex(
                        (ch) => ch.id === channel.id
                      );
                      setCurrentChannelIndex(channelIndex);
                      setSelectedChannel(channel);
                    }}
                  >
                    <div className="relative h-32 bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center overflow-hidden">
                      {channel.logo ? (
                        <Image
                          src={channel.logo}
                          alt={channel.name}
                          fill
                          className="object-cover"
                          unoptimized
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
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
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
                        className="absolute top-2 left-2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors z-10"
                        title={isFavorite(channel.id) ? "Remove from favorites" : "Add to favorites"}
                      >
                        {isFavorite(channel.id) ? (
                          <HeartIconSolid className="w-5 h-5 text-red-500" />
                        ) : (
                          <HeartIcon className="w-5 h-5 text-white" />
                        )}
                      </button>
                      
                      {isFailed && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                          ⚠ Failed
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="text-white font-semibold mb-1 line-clamp-1">
                        {channel.name}
                      </h3>
                      <p className="text-gray-400 text-sm mb-1 flex items-center gap-1">
                        <span>{getIconByCategory(channel.category)}</span>
                        <span>{channel.category}</span>
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-blue-300 text-xs">
                          {channel.language.join(", ")}
                        </p>
                        <span className="text-lg">
                          {getFlagByCountryCode(channel.countryCode)}
                        </span>
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
          channel={selectedChannel}
          title={selectedChannel.name}
          channels={filteredChannels}
          currentChannelIndex={currentChannelIndex}
          onNextChannel={handleNextChannel}
          onPrevChannel={handlePrevChannel}
          onChannelFailed={handleChannelFailed}
          isFavorite={isFavorite(selectedChannel.id)}
          onToggleFavorite={() => {
            const channelToToggle = {
              ...selectedChannel,
              country: countryCode,
            };
            toggleFavorite(channelToToggle);
          }}
          onDeleteChannel={handleDeleteChannel}
          onClose={() => {
            setSelectedChannel(null);
            setCurrentChannelIndex(0);
          }}
        />
      )}
    </div>
  );
}
