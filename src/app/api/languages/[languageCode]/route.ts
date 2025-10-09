import { NextRequest, NextResponse } from "next/server";
import { 
  validateSearchParam, 
  validatePageParam, 
  validateLimitParam, 
  validateLanguageCode,
  rateLimit,
  addSecurityHeaders 
} from "@/lib/validation";

interface Channel {
  id: string;
  name: string;
  url: string;
  logo?: string;
  category: string;
  language: string[];
  country?: string;
  countryCode?: string;
}

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

// Language information - All 51 supported languages
const languageInfo: { [key: string]: Language } = {
  eng: { code: "eng", name: "English", nativeName: "English", flag: "🇺🇸" },
  spa: { code: "spa", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  fra: { code: "fra", name: "French", nativeName: "Français", flag: "🇫🇷" },
  deu: { code: "deu", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  ita: { code: "ita", name: "Italian", nativeName: "Italiano", flag: "🇮🇹" },
  por: { code: "por", name: "Portuguese", nativeName: "Português", flag: "🇵🇹" },
  rus: { code: "rus", name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
  ara: { code: "ara", name: "Arabic", nativeName: "العربية", flag: "🇸🇦" },
  zho: { code: "zho", name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
  hin: { code: "hin", name: "Hindi", nativeName: "हिंदी", flag: "🇮🇳" },
  jpn: { code: "jpn", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  kor: { code: "kor", name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
  tur: { code: "tur", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷" },
  nld: { code: "nld", name: "Dutch", nativeName: "Nederlands", flag: "🇳🇱" },
  pol: { code: "pol", name: "Polish", nativeName: "Polski", flag: "🇵🇱" },
  swe: { code: "swe", name: "Swedish", nativeName: "Svenska", flag: "🇸🇪" },
  nor: { code: "nor", name: "Norwegian", nativeName: "Norsk", flag: "🇳🇴" },
  dan: { code: "dan", name: "Danish", nativeName: "Dansk", flag: "🇩🇰" },
  fin: { code: "fin", name: "Finnish", nativeName: "Suomi", flag: "🇫🇮" },
  ell: { code: "ell", name: "Greek", nativeName: "Ελληνικά", flag: "🇬🇷" },
  ces: { code: "ces", name: "Czech", nativeName: "Čeština", flag: "🇨🇿" },
  hun: { code: "hun", name: "Hungarian", nativeName: "Magyar", flag: "🇭🇺" },
  ron: { code: "ron", name: "Romanian", nativeName: "Română", flag: "🇷🇴" },
  bul: { code: "bul", name: "Bulgarian", nativeName: "Български", flag: "🇧🇬" },
  hrv: { code: "hrv", name: "Croatian", nativeName: "Hrvatski", flag: "🇭🇷" },
  srp: { code: "srp", name: "Serbian", nativeName: "Српски", flag: "🇷🇸" },
  slk: { code: "slk", name: "Slovak", nativeName: "Slovenčina", flag: "🇸🇰" },
  slv: { code: "slv", name: "Slovenian", nativeName: "Slovenščina", flag: "🇸🇮" },
  ukr: { code: "ukr", name: "Ukrainian", nativeName: "Українська", flag: "🇺🇦" },
  ben: { code: "ben", name: "Bengali", nativeName: "বাংলা", flag: "🇧🇩" },
  urd: { code: "urd", name: "Urdu", nativeName: "اردو", flag: "🇵🇰" },
  tha: { code: "tha", name: "Thai", nativeName: "ไทย", flag: "🇹🇭" },
  vie: { code: "vie", name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳" },
  ind: { code: "ind", name: "Indonesian", nativeName: "Bahasa Indonesia", flag: "🇮🇩" },
  msa: { code: "msa", name: "Malay", nativeName: "Bahasa Melayu", flag: "🇲🇾" },
  fil: { code: "fil", name: "Filipino", nativeName: "Filipino", flag: "🇵🇭" },
  heb: { code: "heb", name: "Hebrew", nativeName: "עברית", flag: "🇮🇱" },
  fas: { code: "fas", name: "Persian", nativeName: "فارسی", flag: "🇮🇷" },
  tam: { code: "tam", name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳" },
  tel: { code: "tel", name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳" },
  guj: { code: "guj", name: "Gujarati", nativeName: "ગુજરાતી", flag: "🇮🇳" },
  pan: { code: "pan", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
  mar: { code: "mar", name: "Marathi", nativeName: "मराठी", flag: "🇮🇳" },
  kan: { code: "kan", name: "Kannada", nativeName: "ಕನ್ನಡ", flag: "🇮🇳" },
  mal: { code: "mal", name: "Malayalam", nativeName: "മലയാളം", flag: "🇮🇳" },
  ori: { code: "ori", name: "Odia", nativeName: "ଓଡ଼ିଆ", flag: "🇮🇳" },
  nep: { code: "nep", name: "Nepali", nativeName: "नेपाली", flag: "🇳🇵" },
  sin: { code: "sin", name: "Sinhala", nativeName: "සිංහල", flag: "🇱🇰" },
  mya: { code: "mya", name: "Burmese", nativeName: "မြန်မာ", flag: "🇲🇲" },
  khm: { code: "khm", name: "Khmer", nativeName: "ខ្មែរ", flag: "🇰🇭" },
  lao: { code: "lao", name: "Lao", nativeName: "ລາວ", flag: "🇱🇦" },
};

function parseM3U(content: string, languageCode: string): Channel[] {
  const channels: Channel[] = [];
  const lines = content.split("\n");
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith("#EXTINF:")) {
      const logoMatch = line.match(/tvg-logo="([^"]*)"/);
      const groupMatch = line.match(/group-title="([^"]*)"/);
      const countryMatch = line.match(/tvg-country="([^"]*)"/);
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
        const countryCode = countryMatch ? countryMatch[1].split(";")[0].trim().toUpperCase() : undefined;
        channels.push({
          id: `${languageCode}-${channels.length + 1}`,
          name,
          url,
          logo: logoMatch ? logoMatch[1] : undefined,
          category: groupMatch ? groupMatch[1] : "General",
          language: [languageCode],
          countryCode,
        });
      }
    }
  }
  
  return channels;
}

async function fetchChannelsFromIPTV(languageCode: string): Promise<Channel[]> {
  try {
    const m3uUrl = `https://iptv-org.github.io/iptv/languages/${languageCode}.m3u`;
    
    const response = await fetch(m3uUrl, {
      next: { revalidate: 3600 },
      headers: {
        "User-Agent": "vilo-tv-web/1.0",
      },
    });
    
    if (!response.ok) {
      console.warn(`Failed to fetch M3U for ${languageCode}: ${response.status}`);
      return [];
    }
    
    const m3uContent = await response.text();
    const channels = parseM3U(m3uContent, languageCode);
    
    return channels;
  } catch (error) {
    console.error(`Error fetching IPTV channels for ${languageCode}:`, error);
    return [];
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ languageCode: string }> }
) {
  try {
    // Rate limiting
    if (!rateLimit(request, 60, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    const { languageCode } = await params;
    
    // Validate language code
    if (!validateLanguageCode(languageCode)) {
      return NextResponse.json(
        { error: "Invalid language code" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = validateSearchParam(searchParams.get("search"));
    const page = validatePageParam(searchParams.get("page"));
    const limit = validateLimitParam(searchParams.get("limit"));

    // Get language info
    const language = languageInfo[languageCode.toLowerCase()];
    if (!language) {
      return NextResponse.json(
        { error: "Language not found" },
        { status: 404 }
      );
    }

    // Fetch channels from IPTV-org
    let channels = await fetchChannelsFromIPTV(languageCode.toLowerCase());

    // Apply search filter
    if (search) {
      const searchTerm = search.toLowerCase();
      channels = channels.filter((channel: Channel) =>
        channel.name.toLowerCase().includes(searchTerm) ||
        channel.category.toLowerCase().includes(searchTerm)
      );
    }

    // Calculate pagination
    const total = channels.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedChannels = channels.slice(startIndex, endIndex);

    const response = NextResponse.json({
      success: true,
      language,
      channels: paginatedChannels,
      total,
      page,
      totalPages,
      limit,
    });

    // Add caching headers
    response.headers.set(
      "Cache-Control",
      "s-maxage=3600, stale-while-revalidate=86400"
    );

    return addSecurityHeaders(response);
  } catch (error) {
    console.error("Error fetching language channels:", error);
    return NextResponse.json(
      { error: "Failed to fetch language channels" },
      { status: 500 }
    );
  }
}