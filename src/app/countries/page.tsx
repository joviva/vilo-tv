"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { Country } from "@/lib/types";
import { useDebounce } from "@/hooks/useDebounce";
import { CategoryGridSkeleton } from "@/components/Skeletons";

interface CountryWithCount extends Country {
  channelCount: number;
}

export default function CountriesPage() {
  const [countries, setCountries] = useState<CountryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Debounce search to avoid excessive API calls
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    fetchCountries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const fetchCountries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);

      const response = await fetch(`/api/countries?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch countries");
      }
      const data = await response.json();
      setCountries(data.countries);
    } catch (error) {
      console.error("Error fetching countries:", error);
      setCountries([]);
    } finally {
      setLoading(false);
    }
  };

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
              Browse by Countries
            </h1>
          </div>

          {/* Search - Top Right */}
          <div className="relative w-64">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search countries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/20 transition-all"
            />
          </div>
        </div>

        {/* Countries Grid */}
        {loading ? (
          <CategoryGridSkeleton count={20} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {countries.map((country) => (
              <Link
                key={country.code}
                href={`/countries/${country.code.toLowerCase()}`}
                className="group"
              >
                <div
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-all duration-300 transform hover:scale-105 border border-white/20"
                >
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">
                    {country.flag}
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1 line-clamp-2">
                    {country.name}
                  </h3>
                  <p className="text-blue-300 text-xs font-medium">
                    {country.channelCount} channels
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && countries.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No countries found
            </h3>
            <p className="text-gray-400">Try adjusting your search terms</p>
          </div>
        )}
      </div>
    </div>
  );
}
