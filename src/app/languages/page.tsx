"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  channelCount: number;
}

export default function LanguagesPage() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchLanguages = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      params.append("sortBy", "channels");

      const response = await fetch(`/api/languages?${params}`);
      const data = await response.json();
      setLanguages(data.languages);
    } catch (error) {
      console.error("Error fetching languages:", error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchLanguages();
  }, [fetchLanguages]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ArrowLeftIcon className="w-6 h-6 text-white" />
            </Link>
            <h1 className="text-3xl font-bold text-white">
              Browse by Languages
            </h1>
          </div>
          
          {/* Search */}
          <div className="relative w-64">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search languages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/20 transition-all"
            />
          </div>
        </div>

        {/* Languages Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="bg-white/10 rounded-lg p-4 animate-pulse">
                <div className="text-3xl mb-2">🗣️</div>
                <div className="h-5 bg-gray-400 rounded mb-2"></div>
                <div className="h-4 bg-gray-400 rounded w-16"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {languages.map((language) => (
              <Link
                key={language.code}
                href={`/languages/${language.code.toLowerCase()}`}
                className="group"
              >
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-all duration-300 transform hover:scale-105 border border-white/20">
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">
                    {language.flag}
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1 line-clamp-1">
                    {language.name}
                  </h3>
                  <p className="text-gray-300 text-xs mb-2 line-clamp-1 h-4">
                    {language.nativeName !== language.name ? language.nativeName : '\u00A0'}
                  </p>
                  <p className="text-blue-300 text-xs font-medium">
                    {language.channelCount} channels
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    {language.code.toUpperCase()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && languages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No languages found
            </h3>
            <p className="text-gray-400">Try adjusting your search terms</p>
          </div>
        )}
      </div>
    </div>
  );
}
