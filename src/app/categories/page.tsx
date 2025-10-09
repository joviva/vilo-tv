"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { Category } from "@/lib/types";
import { CategoryGridSkeleton } from "@/components/Skeletons";
import { useDebounce } from "@/hooks/useDebounce";

interface CategoryWithCount extends Category {
  count: number;
  icon: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Debounce search to avoid excessive re-renders
  const debouncedSearch = useDebounce(search, 300);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);

      const response = await fetch(`/api/categories?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.statusText}`);
      }
      const data = await response.json();
      setCategories(data.categories);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to fetch categories";
      console.error("Error fetching categories:", err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ArrowLeftIcon className="w-6 h-6 text-white" />
            </Link>
            <h1 className="text-3xl font-bold text-white">
              Browse by Categories
            </h1>
          </div>

          {/* Search - moved to top right */}
          <div className="relative w-64">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/20 transition-all"
            />
          </div>
        </div>

        {/* Categories Grid */}
        {loading ? (
          <CategoryGridSkeleton count={12} />
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Failed to load categories
            </h3>
            <p className="text-gray-400 mb-4">{error}</p>
            <button
              onClick={fetchCategories}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categories.map((category: CategoryWithCount) => (
              <Link
                key={category.id}
                href={`/categories/${category.id}`}
                className="group"
              >
                <div
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-6 hover:bg-white/20 transition-all duration-300 transform hover:scale-105 border border-white/20"
                >
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {category.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {category.name}
                  </h3>
                  <p className="text-blue-300 text-sm font-medium">
                    {category.count} channels
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && !error && categories.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No categories found
            </h3>
            <p className="text-gray-400">Try adjusting your search terms</p>
          </div>
        )}
      </div>
    </div>
  );
}
