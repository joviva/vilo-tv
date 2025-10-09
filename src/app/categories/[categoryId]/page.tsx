"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  PlayIcon,
  TvIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { Stream } from "@/lib/types";
import VideoPlayer from "@/components/VideoPlayer";
import { useFavorites } from "@/hooks/useFavorites";
import { useBlocklist } from "@/hooks/useBlocklist";
import { getFlagByCountryCode, getIconByCategory } from "@/lib/countryFlags";

interface CategoryPageData {
  channels: Stream[];
  total: number;
  page: number;
  totalPages: number;
}

export default function CategoryPage() {
  const params = useParams();
  const categoryId = params?.categoryId as string;
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isBlocked, addToBlocklist } = useBlocklist();

  const [data, setData] = useState<CategoryPageData>({
    channels: [],
    total: 0,
    page: 1,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<Stream | null>(null);
  const [currentChannelIndex, setCurrentChannelIndex] = useState(0);
  const [showPlayer, setShowPlayer] = useState(false);
  const [failedChannelIds, setFailedChannelIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (categoryId) {
      fetchChannels();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, search]);

  const fetchChannels = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);

      const response = await fetch(`/api/categories/${categoryId}?${params}`);
      const result = await response.json();

      if (response.ok) {
        setData(result);
      } else {
        console.error("Error fetching channels:", result.error);
      }
    } catch (error) {
      console.error("Error fetching channels:", error);
    } finally {
      setLoading(false);
    }
  };

  // Sort channels: working channels first, failed channels at the end
  const sortedChannels = [...data.channels]
    .filter((channel) => !isBlocked(channel.url)) // Filter out blocked channels
    .sort((a, b) => {
      const aFailed = failedChannelIds.has(a.url);
      const bFailed = failedChannelIds.has(b.url);

      if (aFailed && !bFailed) return 1; // a goes to end
      if (!aFailed && bFailed) return -1; // b goes to end
      return 0; // keep original order
    });

  const handleChannelSelect = useCallback((channel: Stream, index: number) => {
    setSelectedChannel(channel);
    setCurrentChannelIndex(index);
    setShowPlayer(true);
  }, []);

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
    if (selectedChannel && selectedChannel.url === channelId) {
      // Close the player
      setSelectedChannel(null);
      setCurrentChannelIndex(0);
      setShowPlayer(false);
    }
  }, [addToBlocklist, selectedChannel]);

  // Channel navigation functions
  const handleNextChannel = useCallback(() => {
    if (currentChannelIndex < sortedChannels.length - 1) {
      const nextIndex = currentChannelIndex + 1;
      setCurrentChannelIndex(nextIndex);
      setSelectedChannel(sortedChannels[nextIndex]);
    }
  }, [currentChannelIndex, sortedChannels]);

  const handlePrevChannel = useCallback(() => {
    if (currentChannelIndex > 0) {
      const prevIndex = currentChannelIndex - 1;
      setCurrentChannelIndex(prevIndex);
      setSelectedChannel(sortedChannels[prevIndex]);
    }
  }, [currentChannelIndex, sortedChannels]);

  const getCategoryName = (id: string) => {
    const categoryNames: { [key: string]: string } = {
      movies: "Movies",
      sports: "Sports",
      news: "News",
      music: "Music",
      kids: "Kids",
      entertainment: "Entertainment",
      education: "Education",
      documentary: "Documentary",
      lifestyle: "Lifestyle",
      culture: "Culture",
      religious: "Religious",
      series: "Series",
      animation: "Animation",
      comedy: "Comedy",
      cooking: "Cooking",
      travel: "Travel",
      weather: "Weather",
      science: "Science",
      business: "Business",
      auto: "Auto",
      outdoor: "Outdoor",
      family: "Family",
      shop: "Shop",
    };
    return categoryNames[id] || id.charAt(0).toUpperCase() + id.slice(1);
  };

  const getCategoryIcon = (id: string) => {
    const icons: { [key: string]: string } = {
      movies: "🎬",
      sports: "⚽",
      news: "📰",
      music: "🎵",
      kids: "👶",
      entertainment: "🎭",
      education: "📚",
      documentary: "📖",
      lifestyle: "🍳",
      culture: "🏛️",
      religious: "🙏",
      series: "📺",
      animation: "🎨",
      comedy: "😂",
      cooking: "👨‍🍳",
      travel: "✈️",
      weather: "🌤️",
      science: "🔬",
      business: "💼",
      auto: "🚗",
      outdoor: "🏕️",
      family: "👨‍👩‍👧‍👦",
      shop: "🛍️",
    };
    return icons[id] || "📺";
  };

  if (!categoryId) {
    return <div>Category not found</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link
              href="/categories"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ArrowLeftIcon className="w-6 h-6 text-white" />
            </Link>
            <div className="flex items-center space-x-3">
              <span className="text-3xl">{getCategoryIcon(categoryId)}</span>
              <h1 className="text-3xl font-bold text-white">
                {getCategoryName(categoryId)}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-blue-300 text-sm whitespace-nowrap">{data.total} channels</div>
            {/* Search */}
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

        {/* Video Player Modal */}
        {showPlayer && selectedChannel && (
          <VideoPlayer
            url={selectedChannel.url}
            title={selectedChannel.title}
            poster={selectedChannel.tvgLogo}
            channels={sortedChannels.map(stream => ({
              id: stream.url,
              name: stream.title,
              url: stream.url,
              logo: stream.tvgLogo,
              category: stream.categories.join(", ") || "General",
            }))}
            currentChannelIndex={currentChannelIndex}
            onNextChannel={handleNextChannel}
            onPrevChannel={handlePrevChannel}
            onChannelFailed={handleChannelFailed}
            channel={{
              id: selectedChannel.url,
              name: selectedChannel.title,
              url: selectedChannel.url,
              logo: selectedChannel.tvgLogo,
              category: selectedChannel.categories.join(", ") || "General",
            }}
            onClose={() => {
              setShowPlayer(false);
              setSelectedChannel(null);
              setCurrentChannelIndex(0);
            }}
          />
        )}

        {/* Channels Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white/10 rounded-lg p-4 animate-pulse">
                <div className="aspect-video bg-gray-400 rounded mb-3"></div>
                <div className="h-5 bg-gray-400 rounded mb-2"></div>
                <div className="h-4 bg-gray-400 rounded w-20"></div>
              </div>
            ))}
          </div>
        ) : data.channels.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {sortedChannels.map((channel, index) => {
              const channelData = {
                id: channel.url,
                name: channel.title,
                url: channel.url,
                logo: channel.tvgLogo,
                category: channel.categories.join(", ") || "General",
                country: channel.country || "",
                countryCode: channel.country || undefined,
                language: channel.languages || [],
              };
              const channelIsFavorite = isFavorite(channelData.id);
              
              return (
                <div
                  key={channel.url}
                  className="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden hover:bg-white/20 transition-all duration-300 transform hover:scale-105 border border-white/20 group relative"
                >
                  {/* Channel Thumbnail */}
                  <div 
                    className="aspect-video bg-gradient-to-br from-blue-600 to-purple-600 relative overflow-hidden cursor-pointer"
                    onClick={() => handleChannelSelect(channel, index)}
                  >
                    {channel.tvgLogo ? (
                      <Image
                        src={channel.tvgLogo}
                        alt={channel.title}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <TvIcon className="w-12 h-12 text-white/70" />
                      </div>
                    )}

                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-white/20 rounded-full p-3">
                        <PlayIcon className="w-8 h-8 text-white" />
                      </div>
                    </div>

                    {/* Favorite Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(channelData);
                      }}
                      className="absolute top-2 left-2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors z-10"
                      title={channelIsFavorite ? "Remove from favorites" : "Add to favorites"}
                    >
                      {channelIsFavorite ? (
                        <HeartIconSolid className="w-5 h-5 text-red-500" />
                      ) : (
                        <HeartIcon className="w-5 h-5 text-white" />
                      )}
                    </button>

                    {/* Quality Badge */}
                    {channel.quality && (
                      <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {channel.quality}
                      </div>
                    )}
                  </div>

                  {/* Channel Info */}
                  <div 
                    className="p-4 cursor-pointer"
                    onClick={() => handleChannelSelect(channel, index)}
                  >
                    <h3 className="font-semibold text-white text-sm mb-1 line-clamp-2">
                      {channel.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <p className="text-blue-300 text-xs flex items-center gap-1">
                        <span>
                          {channel.categories.length > 0
                            ? getIconByCategory(channel.categories[0])
                            : "📺"}
                        </span>
                        <span>
                          {channel.categories.length > 0
                            ? channel.categories.join(", ")
                            : "General"}
                        </span>
                      </p>
                      {channel.country && (
                        <span className="text-sm">
                          {getFlagByCountryCode(channel.country)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📺</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No channels found
            </h3>
            <p className="text-gray-400">
              {search
                ? "Try adjusting your search terms"
                : "No channels available for this category"}
            </p>
          </div>
        )}

        {/* Pagination (if needed) */}
        {data.totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex space-x-2">
              {Array.from({ length: Math.min(data.totalPages, 5) }, (_, i) => (
                <button
                  key={i + 1}
                  className={`px-3 py-2 rounded ${
                    data.page === i + 1
                      ? "bg-blue-600 text-white"
                      : "bg-white/10 text-gray-300 hover:bg-white/20"
                  } transition-colors`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Video Player Modal */}
      {selectedChannel && (
        <VideoPlayer
          url={selectedChannel.url}
          title={selectedChannel.title}
          poster={selectedChannel.tvgLogo}
          channels={sortedChannels.map(ch => ({
            id: ch.tvgId || ch.url,
            name: ch.title,
            url: ch.url,
            logo: ch.tvgLogo,
            category: ch.groupTitle || categoryId,
          }))}
          currentChannelIndex={currentChannelIndex}
          onNextChannel={handleNextChannel}
          onPrevChannel={handlePrevChannel}
          onChannelFailed={handleChannelFailed}
          isFavorite={isFavorite(selectedChannel.tvgId || selectedChannel.url)}
          onToggleFavorite={() => {
            const channelToToggle = {
              id: selectedChannel.tvgId || selectedChannel.url,
              name: selectedChannel.title,
              url: selectedChannel.url,
              logo: selectedChannel.tvgLogo,
              category: selectedChannel.groupTitle || categoryId,
              country: selectedChannel.country || "",
              countryCode: selectedChannel.country || undefined,
              language: selectedChannel.languages || [],
            };
            toggleFavorite(channelToToggle);
          }}
          channel={{
            id: selectedChannel.tvgId || selectedChannel.url,
            name: selectedChannel.title,
            url: selectedChannel.url,
            logo: selectedChannel.tvgLogo,
            category: selectedChannel.groupTitle || categoryId,
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
