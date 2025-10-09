import { NextRequest, NextResponse } from "next/server";
import { Language } from "@/lib/types";
import { 
  validateSearchParam, 
  rateLimit,
  addSecurityHeaders 
} from "@/lib/validation";
import { withErrorHandling } from '@/lib/errors';
import { getCachedResponse, setCachedResponse } from '@/lib/cache';
import { CACHE_KEYS } from '@/lib/constants';
import logger from '@/lib/logger';

// Languages data from your IPTV repository with channel counts
const languages: (Language & {
  channelCount: number;
  flag: string;
  nativeName?: string;
})[] = [
  {
    code: "eng",
    name: "English",
    nativeName: "English",
    flag: "🇺🇸",
    channelCount: 3750, // Updated: +208 from Caribbean countries (Jamaica, Trinidad, Bahamas, Barbados, etc.)
  },
  {
    code: "spa",
    name: "Spanish",
    nativeName: "Español",
    flag: "🇪🇸",
    channelCount: 1587, // Updated: +464 from South America (Colombia, Chile, Peru, Venezuela, Ecuador, etc.) + Central America (Costa Rica, Panama, Guatemala, etc.) + Caribbean (Dominican Republic, Cuba, Puerto Rico)
  },
  {
    code: "fra",
    name: "French",
    nativeName: "Français",
    flag: "🇫🇷",
    channelCount: 933, // Updated: +57 from Caribbean (Haiti, Martinique, Guadeloupe) + South America (French Guiana)
  },
  {
    code: "deu",
    name: "German",
    nativeName: "Deutsch",
    flag: "🇩🇪",
    channelCount: 654,
  },
  {
    code: "ita",
    name: "Italian",
    nativeName: "Italiano",
    flag: "🇮🇹",
    channelCount: 543,
  },
  {
    code: "por",
    name: "Portuguese",
    nativeName: "Português",
    flag: "🇵🇹",
    channelCount: 486, // Updated: +54 from South America (Bolivia, Uruguay, Paraguay, Suriname, Guyana, French Guiana)
  },
  {
    code: "rus",
    name: "Russian",
    nativeName: "Русский",
    flag: "🇷🇺",
    channelCount: 387,
  },
  {
    code: "ara",
    name: "Arabic",
    nativeName: "العربية",
    flag: "🇸🇦",
    channelCount: 298,
  },
  {
    code: "zho",
    name: "Chinese",
    nativeName: "中文",
    flag: "🇨🇳",
    channelCount: 276,
  },
  {
    code: "hin",
    name: "Hindi",
    nativeName: "हिंदी",
    flag: "🇮🇳",
    channelCount: 234,
  },
  {
    code: "jpn",
    name: "Japanese",
    nativeName: "日本語",
    flag: "🇯🇵",
    channelCount: 187,
  },
  {
    code: "kor",
    name: "Korean",
    nativeName: "한국어",
    flag: "🇰🇷",
    channelCount: 156,
  },
  {
    code: "tur",
    name: "Turkish",
    nativeName: "Türkçe",
    flag: "🇹🇷",
    channelCount: 145,
  },
  {
    code: "nld",
    name: "Dutch",
    nativeName: "Nederlands",
    flag: "🇳🇱",
    channelCount: 176, // Updated: +42 from Caribbean (Aruba, Curacao, Sint Maarten, Bonaire) + South America (Suriname)
  },
  {
    code: "pol",
    name: "Polish",
    nativeName: "Polski",
    flag: "🇵🇱",
    channelCount: 123,
  },
  {
    code: "swe",
    name: "Swedish",
    nativeName: "Svenska",
    flag: "🇸🇪",
    channelCount: 112,
  },
  {
    code: "nor",
    name: "Norwegian",
    nativeName: "Norsk",
    flag: "🇳🇴",
    channelCount: 101,
  },
  {
    code: "dan",
    name: "Danish",
    nativeName: "Dansk",
    flag: "🇩🇰",
    channelCount: 98,
  },
  {
    code: "fin",
    name: "Finnish",
    nativeName: "Suomi",
    flag: "🇫🇮",
    channelCount: 87,
  },
  {
    code: "ell",
    name: "Greek",
    nativeName: "Ελληνικά",
    flag: "🇬🇷",
    channelCount: 76,
  },
  {
    code: "ces",
    name: "Czech",
    nativeName: "Čeština",
    flag: "🇨🇿",
    channelCount: 65,
  },
  {
    code: "hun",
    name: "Hungarian",
    nativeName: "Magyar",
    flag: "🇭🇺",
    channelCount: 54,
  },
  {
    code: "ron",
    name: "Romanian",
    nativeName: "Română",
    flag: "🇷🇴",
    channelCount: 47,
  },
  {
    code: "bul",
    name: "Bulgarian",
    nativeName: "Български",
    flag: "🇧🇬",
    channelCount: 42,
  },
  {
    code: "hrv",
    name: "Croatian",
    nativeName: "Hrvatski",
    flag: "🇭🇷",
    channelCount: 38,
  },
  {
    code: "srp",
    name: "Serbian",
    nativeName: "Српски",
    flag: "🇷🇸",
    channelCount: 35,
  },
  {
    code: "slk",
    name: "Slovak",
    nativeName: "Slovenčina",
    flag: "🇸🇰",
    channelCount: 32,
  },
  {
    code: "slv",
    name: "Slovenian",
    nativeName: "Slovenščina",
    flag: "🇸🇮",
    channelCount: 29,
  },
  {
    code: "ukr",
    name: "Ukrainian",
    nativeName: "Українська",
    flag: "🇺🇦",
    channelCount: 67,
  },
  {
    code: "ben",
    name: "Bengali",
    nativeName: "বাংলা",
    flag: "🇧🇩",
    channelCount: 45,
  },
  {
    code: "urd",
    name: "Urdu",
    nativeName: "اردو",
    flag: "🇵🇰",
    channelCount: 41,
  },
  {
    code: "tha",
    name: "Thai",
    nativeName: "ไทย",
    flag: "🇹🇭",
    channelCount: 38,
  },
  {
    code: "vie",
    name: "Vietnamese",
    nativeName: "Tiếng Việt",
    flag: "🇻🇳",
    channelCount: 35,
  },
  {
    code: "ind",
    name: "Indonesian",
    nativeName: "Bahasa Indonesia",
    flag: "🇮🇩",
    channelCount: 32,
  },
  {
    code: "msa",
    name: "Malay",
    nativeName: "Bahasa Melayu",
    flag: "🇲🇾",
    channelCount: 29,
  },
  {
    code: "fil",
    name: "Filipino",
    nativeName: "Filipino",
    flag: "🇵🇭",
    channelCount: 26,
  },
  {
    code: "heb",
    name: "Hebrew",
    nativeName: "עברית",
    flag: "🇮🇱",
    channelCount: 23,
  },
  {
    code: "fas",
    name: "Persian",
    nativeName: "فارسی",
    flag: "🇮🇷",
    channelCount: 34,
  },
  {
    code: "tam",
    name: "Tamil",
    nativeName: "தமிழ்",
    flag: "🇮🇳",
    channelCount: 28,
  },
  {
    code: "tel",
    name: "Telugu",
    nativeName: "తెలుగు",
    flag: "🇮🇳",
    channelCount: 25,
  },
  {
    code: "guj",
    name: "Gujarati",
    nativeName: "ગુજરાતી",
    flag: "🇮🇳",
    channelCount: 22,
  },
  {
    code: "pan",
    name: "Punjabi",
    nativeName: "ਪੰਜਾਬੀ",
    flag: "🇮🇳",
    channelCount: 19,
  },
  {
    code: "mar",
    name: "Marathi",
    nativeName: "मराठी",
    flag: "🇮🇳",
    channelCount: 16,
  },
  {
    code: "kan",
    name: "Kannada",
    nativeName: "ಕನ್ನಡ",
    flag: "🇮🇳",
    channelCount: 14,
  },
  {
    code: "mal",
    name: "Malayalam",
    nativeName: "മലയാളം",
    flag: "🇮🇳",
    channelCount: 13,
  },
  {
    code: "ori",
    name: "Odia",
    nativeName: "ଓଡ଼ିଆ",
    flag: "🇮🇳",
    channelCount: 11,
  },
  {
    code: "nep",
    name: "Nepali",
    nativeName: "नेपाली",
    flag: "🇳🇵",
    channelCount: 18,
  },
  {
    code: "sin",
    name: "Sinhala",
    nativeName: "සිංහල",
    flag: "🇱🇰",
    channelCount: 15,
  },
  {
    code: "mya",
    name: "Burmese",
    nativeName: "မြန်မာ",
    flag: "🇲🇲",
    channelCount: 12,
  },
  {
    code: "khm",
    name: "Khmer",
    nativeName: "ខ្មែរ",
    flag: "🇰🇭",
    channelCount: 9,
  },
  { code: "lao", name: "Lao", nativeName: "ລາວ", flag: "🇱🇦", channelCount: 7 },
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
    const sortBy = searchParams.get("sortBy") || "channels"; // 'channels' or 'name'

    // Create cache key based on search parameters
    const cacheKey = `${CACHE_KEYS.LANGUAGES}_${search || 'all'}_${sortBy}`;
    
    // Try to get from cache first
    const cachedData = getCachedResponse(cacheKey);
    if (cachedData) {
      logger.debug('Returning cached languages data', 'LanguagesAPI', { search, sortBy });
      return NextResponse.json(cachedData);
    }

    logger.info('Processing languages request', 'LanguagesAPI', { search, sortBy });

    let filteredLanguages = languages;

    if (search) {
      const searchTerm = search.toLowerCase();
      filteredLanguages = languages.filter(
        (language) =>
          language.name.toLowerCase().includes(searchTerm) ||
          language.code.toLowerCase().includes(searchTerm) ||
          (language.nativeName &&
            language.nativeName.toLowerCase().includes(searchTerm))
      );
    }

    // Sort languages
    filteredLanguages.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else {
        // Sort by channel count (descending)
        return b.channelCount - a.channelCount;
      }
    });

    const responseData = {
      languages: filteredLanguages,
      total: filteredLanguages.length,
    };

    // Cache the response for 1 hour
    setCachedResponse(cacheKey, responseData, 60 * 60 * 1000);

    const response = NextResponse.json(responseData);

    // Add caching headers
    response.headers.set(
      "Cache-Control",
      "s-maxage=3600, stale-while-revalidate=86400"
    );

    logger.debug('Languages data processed successfully', 'LanguagesAPI', { 
      total: responseData.total,
      filtered: Boolean(search)
    });

    return addSecurityHeaders(response);
  }, 'LanguagesAPI');
}
