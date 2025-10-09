import { NextRequest, NextResponse } from "next/server";
import { Category } from "@/lib/types";
import { 
  validateSearchParam, 
  rateLimit,
  addSecurityHeaders 
} from "@/lib/validation";
import { withErrorHandling } from '@/lib/errors';
import { getCachedResponse, setCachedResponse } from '@/lib/cache';
import { CACHE_KEYS } from '@/lib/constants';
import logger from '@/lib/logger';

// Categories from your IPTV data with channel counts
const categories: (Category & { count: number; icon: string })[] = [
  { id: "news", name: "News", count: 978, icon: "📰" }, // Updated: +147 from new countries (news is very popular in Latin America & Caribbean)
  { id: "entertainment", name: "Entertainment", count: 753, icon: "🎭" }, // Updated: +118 from new countries
  { id: "religious", name: "Religious", count: 850, icon: "🙏" }, // Updated: +128 from new countries (very popular in Latin America)
  { id: "music", name: "Music", count: 745, icon: "�" }, // Updated: +112 from new countries (salsa, reggaeton, etc.)
  { id: "movies", name: "Movies", count: 435, icon: "�" }, // Updated: +62 from new countries
  { id: "sports", name: "Sports", count: 389, icon: "⚽" }, // Updated: +88 from new countries (soccer is huge in Latin America)
  { id: "kids", name: "Kids", count: 315, icon: "👶" }, // Updated: +44 from new countries
  { id: "series", name: "Series", count: 308, icon: "📺" }, // Updated: +47 from new countries (telenovelas!)
  { id: "education", name: "Education", count: 203, icon: "📚" }, // Updated: +28 from new countries
  { id: "culture", name: "Culture", count: 195, icon: "🏛️" }, // Updated: +26 from new countries
  { id: "documentary", name: "Documentary", count: 142, icon: "📖" }, // Updated: +18 from new countries
  { id: "lifestyle", name: "Lifestyle", count: 122, icon: "🍳" }, // Updated: +16 from new countries
  { id: "comedy", name: "Comedy", count: 98, icon: "�" }, // Updated: +16 from new countries
  { id: "shop", name: "Shop", count: 96, icon: "�️" }, // Updated: +11 from new countries
  { id: "animation", name: "Animation", count: 69, icon: "�" }, // Updated: +9 from new countries
  { id: "family", name: "Family", count: 62, icon: "👨‍👩‍👧‍👦" }, // Updated: +8 from new countries
  { id: "business", name: "Business", count: 52, icon: "�" }, // Updated: +7 from new countries
  { id: "outdoor", name: "Outdoor", count: 49, icon: "�️" }, // Updated: +6 from new countries
  { id: "travel", name: "Travel", count: 48, icon: "✈️" }, // Updated: +6 from new countries
  { id: "classic", name: "Classic", count: 40, icon: "🎭" }, // Updated: +5 from new countries
  { id: "cooking", name: "Cooking", count: 34, icon: "�‍🍳" }, // Updated: +5 from new countries
  { id: "science", name: "Science", count: 28, icon: "🔬" }, // Updated: +3 from new countries
  { id: "auto", name: "Auto", count: 21, icon: "�" }, // Updated: +3 from new countries
  { id: "weather", name: "Weather", count: 16, icon: "�️" }, // Updated: +2 from new countries
];

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    // Rate limiting - increased for development (1000 requests per 15 minutes)
    if (!rateLimit(request, 1000, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = validateSearchParam(searchParams.get("search"));

    // Create cache key based on search parameters
    const cacheKey = `${CACHE_KEYS.CATEGORIES}_${search || 'all'}`;
    
    // Try to get from cache first
    const cachedData = getCachedResponse(cacheKey);
    if (cachedData) {
      logger.debug('Returning cached categories data', 'CategoriesAPI', { search });
      return NextResponse.json(cachedData);
    }

    logger.info('Processing categories request', 'CategoriesAPI', { search });

    let filteredCategories = categories;

    if (search) {
      const searchTerm = search.toLowerCase();
      filteredCategories = categories.filter(
        (category) =>
          category.name.toLowerCase().includes(searchTerm) ||
          category.id.toLowerCase().includes(searchTerm)
      );
    }

    // Sort by channel count (descending) and then by name
    filteredCategories.sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return a.name.localeCompare(b.name);
    });

    const responseData = {
      categories: filteredCategories,
      total: filteredCategories.length,
    };

    // Cache the response for 1 hour
    setCachedResponse(cacheKey, responseData, 60 * 60 * 1000);

    const response = NextResponse.json(responseData);

    // Add caching headers
    response.headers.set(
      "Cache-Control",
      "s-maxage=3600, stale-while-revalidate=86400"
    );

    logger.debug('Categories data processed successfully', 'CategoriesAPI', { 
      total: responseData.total,
      filtered: Boolean(search)
    });

    return addSecurityHeaders(response);
  }, 'CategoriesAPI');
}
