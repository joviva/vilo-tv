import { NextResponse } from 'next/server';

interface Category {
  id: string;
  name: string;
  channels: number;
  description?: string;
}

const IPTV_BASE_URL = 'https://iptv-org.github.io/iptv';

// Enhanced categories based on IPTV-org with descriptions
const CATEGORY_INFO = {
  'animation': { name: 'Animation', description: 'Animated content and cartoons' },
  'auto': { name: 'Automotive', description: 'Cars, motorsports, and automotive content' },
  'business': { name: 'Business', description: 'Business news, finance, and markets' },
  'classic': { name: 'Classic', description: 'Classic movies and vintage programming' },
  'comedy': { name: 'Comedy', description: 'Comedy shows and humorous content' },
  'cooking': { name: 'Cooking', description: 'Culinary shows and food programming' },
  'culture': { name: 'Culture', description: 'Cultural programming and arts' },
  'documentary': { name: 'Documentary', description: 'Educational documentaries and factual content' },
  'education': { name: 'Education', description: 'Educational and learning content' },
  'entertainment': { name: 'Entertainment', description: 'General entertainment programming' },
  'family': { name: 'Family', description: 'Family-friendly content for all ages' },
  'general': { name: 'General', description: 'Mixed general programming' },
  'interactive': { name: 'Interactive', description: 'Interactive and participatory content' },
  'kids': { name: 'Kids', description: 'Children\'s programming and cartoons' },
  'legislative': { name: 'Legislative', description: 'Government and legislative proceedings' },
  'lifestyle': { name: 'Lifestyle', description: 'Lifestyle and wellness programming' },
  'movies': { name: 'Movies', description: 'Feature films and cinema' },
  'music': { name: 'Music', description: 'Music videos, concerts, and musical content' },
  'news': { name: 'News', description: 'Current events and news programming' },
  'outdoor': { name: 'Outdoor', description: 'Nature, adventure, and outdoor activities' },
  'public': { name: 'Public', description: 'Public access and community television' },
  'relax': { name: 'Relax', description: 'Relaxing and ambient content' },
  'religious': { name: 'Religious', description: 'Religious and spiritual programming' },
  'science': { name: 'Science', description: 'Scientific and educational content' },
  'series': { name: 'Series', description: 'TV series and serialized content' },
  'shop': { name: 'Shopping', description: 'Shopping and retail programming' },
  'sports': { name: 'Sports', description: 'Sports events, news, and analysis' },
  'travel': { name: 'Travel', description: 'Travel shows and destination programming' },
  'weather': { name: 'Weather', description: 'Weather forecasts and meteorology' },
  'xxx': { name: 'Adult', description: 'Adult content (18+ only)' },
  'undefined': { name: 'Uncategorized', description: 'Channels without specific category' }
};

async function fetchCategoriesFromIPTV(): Promise<Category[]> {
  try {
    // Fetch the main categories index to get accurate channel counts
    const response = await fetch(`${IPTV_BASE_URL}/index.category.m3u`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const content = await response.text();
    const lines = content.split('\n').map(line => line.trim());
    
    const categoryChannelCounts = new Map<string, number>();
    
    // Count channels per category
    for (const line of lines) {
      if (line.startsWith('#EXTINF:')) {
        const categoryMatch = line.match(/group-title="([^"]*)"/);
        if (categoryMatch) {
          const category = categoryMatch[1].toLowerCase().trim();
          if (category && category !== '') {
            categoryChannelCounts.set(category, (categoryChannelCounts.get(category) || 0) + 1);
          }
        }
      }
    }
    
    // Convert to Category objects with enhanced information
    const categories: Category[] = Array.from(categoryChannelCounts.entries())
      .map(([categoryKey, channels]) => {
        const categoryInfo = CATEGORY_INFO[categoryKey as keyof typeof CATEGORY_INFO];
        return {
          id: categoryKey.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase(),
          name: categoryInfo?.name || categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1),
          channels,
          description: categoryInfo?.description || `${categoryKey} programming and content`
        };
      })
      .sort((a, b) => b.channels - a.channels);
    
    return categories;
  } catch (error) {
    console.error('Error fetching categories from IPTV-org:', error);
    
    // Fallback to predefined categories
    return Object.entries(CATEGORY_INFO).map(([key, info]) => ({
      id: key,
      name: info.name,
      channels: 0,
      description: info.description
    }));
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const minChannels = searchParams.get('minChannels');
    const search = searchParams.get('search');

    let categories = await fetchCategoriesFromIPTV();
    
    // Apply filters
    if (minChannels) {
      const minCount = parseInt(minChannels);
      categories = categories.filter(cat => cat.channels >= minCount);
    }
    
    if (search) {
      const searchTerm = search.toLowerCase();
      categories = categories.filter(cat => 
        cat.name.toLowerCase().includes(searchTerm) ||
        cat.description?.toLowerCase().includes(searchTerm)
      );
    }
    
    // Sort by channel count descending, then by name
    categories.sort((a, b) => {
      if (b.channels !== a.channels) {
        return b.channels - a.channels;
      }
      return a.name.localeCompare(b.name);
    });
    
    const totalChannels = categories.reduce((sum, cat) => sum + cat.channels, 0);

    return NextResponse.json({
      categories,
      total: categories.length,
      totalChannels,
      filters: {
        minChannels: minChannels ? parseInt(minChannels) : null,
        search
      },
      metadata: {
        mostPopular: categories.slice(0, 5),
        totalCategories: categories.length,
        averageChannelsPerCategory: Math.round(totalChannels / categories.length)
      }
    });
    
  } catch (error) {
    console.error('Error in /api/categories:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch categories', 
        details: error instanceof Error ? error.message : 'Unknown error',
        categories: [],
        total: 0,
        totalChannels: 0
      }, 
      { status: 500 }
    );
  }
}