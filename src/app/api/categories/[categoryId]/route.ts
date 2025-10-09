import { NextRequest, NextResponse } from "next/server";
import { Stream } from "@/lib/types";
import { 
  validateSearchParam, 
  validateCategoryId,
  rateLimit,
  addSecurityHeaders 
} from "@/lib/validation";

interface Channel {
  id: string;
  name: string;
  url: string;
  logo?: string;
  category?: string;
  language?: string;
}

function parseM3U(content: string): Channel[] {
  const channels: Channel[] = [];
  const lines = content.split("\n");
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith("#EXTINF:")) {
      const logoMatch = line.match(/tvg-logo="([^"]*)"/);
      const groupMatch = line.match(/group-title="([^"]*)"/);
      const nameMatch = line.match(/,(.+)$/);
      const name = nameMatch ? nameMatch[1].trim() : "Unknown Channel";
      
      let url = "";
      for (let j = i + 1; j < lines.length; j++) {
        const nextLine = lines[j].trim();
        if (nextLine && !nextLine.startsWith("#")) {
          url = nextLine;
          i = j;
          break;
        }
      }
      
      if (url) {
        channels.push({
          id: `channel-${channels.length + 1}`,
          name,
          url,
          logo: logoMatch ? logoMatch[1] : undefined,
          category: groupMatch ? groupMatch[1] : undefined,
        });
      }
    }
  }
  
  return channels;
}

async function fetchChannelsFromIPTV(categoryId: string): Promise<Channel[]> {
  try {
    const m3uUrl = `https://iptv-org.github.io/iptv/categories/${categoryId}.m3u`;
    
    const response = await fetch(m3uUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
      next: {
        revalidate: 3600 // Cache for 1 hour
      }
    });

    if (!response.ok) {
      return [];
    }

    const content = await response.text();
    const channels = parseM3U(content);
    
    return channels;
  } catch (error) {
    console.error(`Error fetching channels for ${categoryId}:`, error);
    return [];
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    // Rate limiting - increased for development
    if (!rateLimit(request, 1000, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    const { categoryId } = await params;
    
    // Validate category ID
    if (!validateCategoryId(categoryId)) {
      return NextResponse.json(
        { error: "Invalid category ID" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = validateSearchParam(searchParams.get("search"));
    const limit = parseInt(searchParams.get("limit") || "100000"); // Show all by default

    // Fetch channels from IPTV
    const channels = await fetchChannelsFromIPTV(categoryId);

    if (channels.length === 0) {
      return NextResponse.json(
        { error: "No channels found for this category" },
        { status: 404 }
      );
    }

    // Apply search filter
    let filteredChannels = channels;
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredChannels = channels.filter((channel) =>
        channel.name.toLowerCase().includes(searchTerm) ||
        channel.category?.toLowerCase().includes(searchTerm)
      );
    }

    // Convert to Stream format for frontend
    const streams: Stream[] = filteredChannels.slice(0, limit).map((channel) => ({
      url: channel.url,
      title: channel.name,
      tvgId: channel.id,
      tvgLogo: channel.logo,
      groupTitle: channel.category || categoryId,
      quality: undefined,
      country: undefined,
      categories: [categoryId],
      languages: [],
    }));

    const response = NextResponse.json({
      channels: streams,
      total: filteredChannels.length,
      page: 1,
      totalPages: 1,
      limit,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200'
      }
    });

    return addSecurityHeaders(response);
  } catch (error) {
    console.error("Error fetching category channels:", error);
    return NextResponse.json(
      { error: "Failed to fetch category channels" },
      { status: 500 }
    );
  }
}