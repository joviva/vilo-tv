"use client";

import Link from "next/link";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { useFavorites } from "@/hooks/useFavorites";
import { useState, useEffect } from "react";

interface FavoritesCardProps {
  className?: string;
}

export default function FavoritesCard({ 
  className = ""
}: FavoritesCardProps) {
  const { favorites, isLoaded } = useFavorites();
  const [isMounted, setIsMounted] = useState(false);

  // Prevent hydration mismatch by only showing dynamic content after client mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const favoriteCount = favorites.length;

  return (
    <Link href="/favorites" className="group">
      <div className={`h-80 bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center hover:bg-white/20 transition-all duration-300 transform hover:scale-105 border border-white/20 flex flex-col ${className}`}>
        <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-red-500 to-pink-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <HeartIconSolid className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">My Favorites</h2>
        <p className="text-gray-300 mb-4 flex-1">
          {!isMounted || !isLoaded 
            ? "Save your favorite channels for quick access"
            : favoriteCount === 0 
              ? "Save your favorite channels for quick access" 
              : `Access your ${favoriteCount} saved channel${favoriteCount !== 1 ? 's' : ''}`
          }
        </p>
        <div className="text-sm text-red-300 font-semibold">
          {!isMounted || !isLoaded
            ? "❤️ Loading favorites..." 
            : favoriteCount === 0 
              ? "❤️ No favorites yet" 
              : `❤️ ${favoriteCount} Saved`
          }
        </div>
      </div>
    </Link>
  );
}