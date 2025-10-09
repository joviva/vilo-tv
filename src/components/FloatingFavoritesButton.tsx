"use client";

import Link from "next/link";
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { useFavorites } from "@/hooks/useFavorites";

interface FloatingFavoritesButtonProps {
  className?: string;
}

export default function FloatingFavoritesButton({ className = "" }: FloatingFavoritesButtonProps) {
  const { favorites } = useFavorites();

  return (
    <Link
      href="/favorites"
      className={`fixed bottom-6 right-6 z-50 group ${className}`}
      title={`View Favorites (${favorites.length})`}
    >
      <div className="relative">
        {/* Main Button */}
        <div className={`flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-300 transform group-hover:scale-110 ${
          favorites.length > 0
            ? "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
            : "bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/20"
        }`}>
          {favorites.length > 0 ? (
            <HeartIconSolid className="w-6 h-6 text-white" />
          ) : (
            <HeartIcon className="w-6 h-6 text-white" />
          )}
        </div>

        {/* Badge */}
        {favorites.length > 0 && (
          <div className="absolute -top-2 -right-2 bg-white text-red-500 text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold border-2 border-red-500 animate-pulse">
            {favorites.length > 99 ? '99+' : favorites.length}
          </div>
        )}

        {/* Tooltip on hover */}
        <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="bg-black/80 text-white text-sm py-1 px-3 rounded-lg whitespace-nowrap">
            {favorites.length === 0 ? "No favorites yet" : `${favorites.length} favorite${favorites.length !== 1 ? 's' : ''}`}
          </div>
          {/* Arrow */}
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/80"></div>
        </div>
      </div>
    </Link>
  );
}