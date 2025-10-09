import { NextRequest, NextResponse } from "next/server";
import {
  validateSearchParam,
  rateLimit,
  addSecurityHeaders,
} from "@/lib/validation";
import { withErrorHandling } from '@/lib/errors';
import { fetchWithRetry } from '@/lib/api-utils';
import { getCachedResponse, setCachedResponse } from '@/lib/cache';
import { CACHE_KEYS, API_ENDPOINTS } from '@/lib/constants';
import logger from '@/lib/logger';

interface Channel {
  id: string;
  name: string;
  url: string;
  logo?: string;
  category: string;
  language: string[];
  countryCode: string;
}

function parseM3U(content: string, countryCode: string): Channel[] {
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
          id: `${countryCode}-${channels.length + 1}`,
          name,
          url,
          logo: logoMatch ? logoMatch[1] : undefined,
          category: groupMatch ? groupMatch[1] : "General",
          language: ["eng"],
          countryCode: countryCode.toUpperCase(),
        });
      }
    }
  }
  
  return channels;
}

async function fetchChannelsFromIPTV(countryCode: string): Promise<Channel[]> {
  // Check cache first
  const cacheKey = `${CACHE_KEYS.CHANNELS}_${countryCode.toLowerCase()}`;
  const cachedChannels = getCachedResponse(cacheKey) as Channel[] | undefined;
  if (cachedChannels) {
    logger.debug('Returning cached channels', 'ChannelsAPI', { countryCode });
    return cachedChannels;
  }

  try {
    // Map GB to UK for IPTV-org compatibility
    const iptvCountryCode = countryCode.toLowerCase() === 'gb' ? 'uk' : countryCode.toLowerCase();
    const m3uUrl = `${API_ENDPOINTS.IPTV_BASE}/countries/${iptvCountryCode}.m3u`;
    
    logger.info(`Fetching channels for ${countryCode}`, 'ChannelsAPI', { 
      countryCode, 
      iptvCountryCode, 
      m3uUrl 
    });
    
    const response = await fetchWithRetry(m3uUrl, {
      headers: {
        "User-Agent": "vilo-tv-web/1.0",
      },
    });
    
    const m3uContent = await response.text();
    const channels = parseM3U(m3uContent, countryCode);
    
    logger.info(`Successfully parsed channels for ${countryCode}`, 'ChannelsAPI', { 
      countryCode,
      channelCount: channels.length 
    });
    
    if (channels.length === 0) {
      return generateFallbackChannels(countryCode);
    }
    
    // Cache the channels for 1 hour
    setCachedResponse(cacheKey, channels, 60 * 60 * 1000);
    
    return channels;
  } catch (error) {
    logger.error(`Error fetching IPTV channels for ${countryCode}`, error instanceof Error ? error : undefined, 'ChannelsAPI', { 
      countryCode 
    });
    return generateFallbackChannels(countryCode);
  }
}

function generateFallbackChannels(countryCode: string): Channel[] {
  return [
    {
      id: `${countryCode}-fallback-1`,
      name: `${countryCode.toUpperCase()} News`,
      url: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
      logo: "https://via.placeholder.com/200x200?text=News",
      category: "News",
      language: ["eng"],
      countryCode: countryCode.toUpperCase(),
    },
    {
      id: `${countryCode}-fallback-2`,
      name: `${countryCode.toUpperCase()} Entertainment`,
      url: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
      logo: "https://via.placeholder.com/200x200?text=Entertainment",
      category: "Entertainment",
      language: ["eng"],
      countryCode: countryCode.toUpperCase(),
    },
  ];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ countryCode: string }> }
) {
  return withErrorHandling(async () => {
    if (!rateLimit(request, 1000, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    const { countryCode } = await params;

    if (!countryCode || countryCode.length !== 2) {
      return NextResponse.json(
        { error: "Invalid country code" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const searchQuery = validateSearchParam(searchParams.get("search"));
    const page = parseInt(searchParams.get("page") || "1", 10);
    // No limit - show all channels
    const limit = parseInt(searchParams.get("limit") || "100000", 10);

    const allChannels = await fetchChannelsFromIPTV(countryCode);

    if (allChannels.length === 0) {
      return NextResponse.json(
        { error: "No channels found for this country" },
        { status: 404 }
      );
    }

    const filteredChannels = searchQuery
      ? allChannels.filter(
          (channel) =>
            channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            channel.category?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : allChannels;

    const total = filteredChannels.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedChannels = filteredChannels.slice(start, end);

    // Get country info for display - Comprehensive list from IPTV-org
    const countryNames: { [key: string]: string } = {
      // Americas
      us: "United States", ca: "Canada", mx: "Mexico", br: "Brazil", ar: "Argentina",
      cl: "Chile", co: "Colombia", pe: "Peru", ve: "Venezuela", ec: "Ecuador",
      bo: "Bolivia", py: "Paraguay", uy: "Uruguay", cr: "Costa Rica", pa: "Panama",
      cu: "Cuba", do: "Dominican Republic", ht: "Haiti", jm: "Jamaica", tt: "Trinidad & Tobago",
      bs: "Bahamas", bb: "Barbados", gy: "Guyana", sr: "Suriname", bz: "Belize",
      gt: "Guatemala", hn: "Honduras", sv: "El Salvador", ni: "Nicaragua", pr: "Puerto Rico",
      gf: "French Guiana", ag: "Antigua & Barbuda", kn: "St. Kitts & Nevis",
      lc: "Saint Lucia", vc: "St. Vincent & Grenadines", dm: "Dominica", gd: "Grenada",
      aw: "Aruba", cw: "Curacao", sx: "Sint Maarten", bq: "Bonaire", mq: "Martinique",
      gp: "Guadeloupe", ai: "Anguilla", ky: "Cayman Islands", tc: "Turks & Caicos",
      vg: "British Virgin Is.", vi: "U.S. Virgin Is.", bm: "Bermuda", ms: "Montserrat",
      
      // Europe
      gb: "United Kingdom", de: "Germany", fr: "France", es: "Spain", it: "Italy",
      nl: "Netherlands", be: "Belgium", se: "Sweden", no: "Norway", dk: "Denmark",
      fi: "Finland", pl: "Poland", ru: "Russia", ua: "Ukraine", ro: "Romania",
      cz: "Czech Republic", hu: "Hungary", at: "Austria", ch: "Switzerland", gr: "Greece",
      pt: "Portugal", ie: "Ireland", hr: "Croatia", rs: "Serbia", bg: "Bulgaria",
      sk: "Slovakia", si: "Slovenia", lt: "Lithuania", lv: "Latvia", ee: "Estonia",
      by: "Belarus", md: "Moldova", al: "Albania", mk: "North Macedonia", ba: "Bosnia and Herzegovina",
      me: "Montenegro", xk: "Kosovo", is: "Iceland", lu: "Luxembourg", mt: "Malta",
      cy: "Cyprus", li: "Liechtenstein", mc: "Monaco", ad: "Andorra", sm: "San Marino",
      va: "Vatican City",
      
      // Asia
      cn: "China", in: "India", jp: "Japan", kr: "South Korea", th: "Thailand",
      sg: "Singapore", my: "Malaysia", id: "Indonesia", ph: "Philippines", vn: "Vietnam",
      kh: "Cambodia", la: "Laos", mm: "Myanmar", bd: "Bangladesh", pk: "Pakistan",
      lk: "Sri Lanka", np: "Nepal", af: "Afghanistan", ir: "Iran", iq: "Iraq",
      sy: "Syria", jo: "Jordan", lb: "Lebanon", il: "Israel", ps: "Palestine",
      kw: "Kuwait", om: "Oman", qa: "Qatar", bh: "Bahrain", ye: "Yemen",
      kz: "Kazakhstan", uz: "Uzbekistan", kg: "Kyrgyzstan", tj: "Tajikistan", tm: "Turkmenistan",
      mn: "Mongolia", tw: "Taiwan", hk: "Hong Kong", mo: "Macao", kp: "North Korea",
      bt: "Bhutan", mv: "Maldives",
      
      // Middle East
      tr: "Turkey", sa: "Saudi Arabia", ae: "United Arab Emirates", eg: "Egypt",
      
      // Africa
      za: "South Africa", ng: "Nigeria", ke: "Kenya", gh: "Ghana", et: "Ethiopia",
      tz: "Tanzania", ug: "Uganda", dz: "Algeria", ma: "Morocco", tn: "Tunisia",
      ly: "Libya", sd: "Sudan", sn: "Senegal", ci: "Ivory Coast", cm: "Cameroon",
      ao: "Angola", mz: "Mozambique", mg: "Madagascar", bw: "Botswana", na: "Namibia",
      zm: "Zambia", zw: "Zimbabwe", mw: "Malawi", ml: "Mali", bf: "Burkina Faso",
      ne: "Niger", td: "Chad", so: "Somalia", rw: "Rwanda", bi: "Burundi",
      cg: "Republic of the Congo", cd: "Democratic Republic of the Congo", ga: "Gabon",
      gq: "Equatorial Guinea", gm: "Gambia", gn: "Guinea", lr: "Liberia", sl: "Sierra Leone",
      tg: "Togo", bj: "Benin", mr: "Mauritania", mu: "Mauritius", er: "Eritrea",
      dj: "Djibouti", km: "Comoros", cv: "Cape Verde", cf: "Central African Republic",
      
      // Oceania
      au: "Australia", nz: "New Zealand", pg: "Papua New Guinea", fj: "Fiji",
      ws: "Samoa", pf: "French Polynesia", gu: "Guam", fo: "Faroe Islands",
    };

    const countryFlags: { [key: string]: string } = {
      // Americas
      us: "🇺🇸", ca: "🇨🇦", mx: "🇲🇽", br: "🇧🇷", ar: "🇦🇷",
      cl: "🇨🇱", co: "🇨🇴", pe: "🇵🇪", ve: "🇻🇪", ec: "🇪🇨",
      bo: "🇧🇴", py: "🇵🇾", uy: "🇺🇾", cr: "🇨🇷", pa: "🇵🇦",
      cu: "🇨🇺", do: "🇩🇴", ht: "🇭🇹", jm: "🇯🇲", tt: "🇹🇹",
      bs: "🇧🇸", bb: "🇧🇧", gy: "🇬🇾", sr: "🇸🇷", bz: "🇧🇿",
      gt: "🇬🇹", hn: "🇭🇳", sv: "🇸🇻", ni: "🇳🇮", pr: "🇵🇷",
      gf: "🇬🇫", ag: "🇦🇬", kn: "🇰🇳", lc: "🇱🇨", vc: "🇻🇨",
      dm: "🇩🇲", gd: "🇬🇩", aw: "🇦🇼", cw: "🇨🇼", sx: "🇸🇽",
      bq: "🇧🇶", mq: "🇲🇶", gp: "🇬🇵", ai: "🇦🇮", ky: "🇰🇾",
      tc: "🇹🇨", vg: "🇻🇬", vi: "🇻🇮", bm: "🇧🇲", ms: "🇲🇸",
      
      // Europe
      gb: "🇬🇧", de: "🇩🇪", fr: "🇫🇷", es: "🇪🇸", it: "🇮🇹",
      nl: "🇳🇱", be: "🇧🇪", se: "🇸🇪", no: "🇳🇴", dk: "🇩🇰",
      fi: "🇫🇮", pl: "🇵🇱", ru: "🇷🇺", ua: "🇺🇦", ro: "🇷🇴",
      cz: "🇨🇿", hu: "🇭🇺", at: "🇦🇹", ch: "🇨🇭", gr: "🇬🇷",
      pt: "🇵🇹", ie: "🇮🇪", hr: "🇭🇷", rs: "🇷🇸", bg: "🇧🇬",
      sk: "🇸🇰", si: "🇸🇮", lt: "🇱🇹", lv: "🇱🇻", ee: "🇪🇪",
      by: "🇧🇾", md: "🇲🇩", al: "🇦🇱", mk: "🇲🇰", ba: "🇧🇦",
      me: "🇲🇪", xk: "🇽🇰", is: "🇮🇸", lu: "🇱🇺", mt: "🇲🇹",
      cy: "🇨🇾", li: "🇱🇮", mc: "🇲🇨", ad: "🇦🇩", sm: "🇸🇲",
      va: "🇻🇦",
      
      // Asia
      cn: "🇨🇳", in: "🇮🇳", jp: "🇯🇵", kr: "🇰🇷", th: "🇹🇭",
      sg: "🇸🇬", my: "🇲🇾", id: "🇮🇩", ph: "🇵🇭", vn: "🇻🇳",
      kh: "🇰🇭", la: "🇱🇦", mm: "🇲🇲", bd: "🇧🇩", pk: "🇵🇰",
      lk: "🇱🇰", np: "🇳🇵", af: "🇦🇫", ir: "🇮🇷", iq: "🇮🇶",
      sy: "🇸🇾", jo: "🇯🇴", lb: "🇱🇧", il: "🇮🇱", ps: "🇵🇸",
      kw: "🇰🇼", om: "🇴🇲", qa: "🇶🇦", bh: "🇧🇭", ye: "🇾🇪",
      kz: "🇰🇿", uz: "🇺🇿", kg: "🇰🇬", tj: "🇹🇯", tm: "🇹🇲",
      mn: "🇲🇳", tw: "🇹🇼", hk: "🇭🇰", mo: "🇲🇴", kp: "🇰🇵",
      bt: "🇧🇹", mv: "🇲🇻",
      
      // Middle East
      tr: "🇹🇷", sa: "🇸🇦", ae: "🇦🇪", eg: "🇪🇬",
      
      // Africa
      za: "🇿🇦", ng: "🇳🇬", ke: "🇰🇪", gh: "🇬🇭", et: "🇪🇹",
      tz: "🇹🇿", ug: "🇺🇬", dz: "🇩🇿", ma: "🇲🇦", tn: "🇹🇳",
      ly: "🇱🇾", sd: "🇸🇩", sn: "🇸🇳", ci: "🇨🇮", cm: "🇨🇲",
      ao: "🇦🇴", mz: "🇲🇿", mg: "🇲🇬", bw: "🇧🇼", na: "🇳🇦",
      zm: "🇿🇲", zw: "🇿🇼", mw: "🇲🇼", ml: "🇲🇱", bf: "🇧🇫",
      ne: "🇳🇪", td: "🇹🇩", so: "🇸🇴", rw: "🇷🇼", bi: "🇧🇮",
      cg: "🇨🇬", cd: "🇨🇩", ga: "🇬🇦", gq: "🇬🇶", gm: "🇬🇲",
      gn: "🇬🇳", lr: "🇱🇷", sl: "🇸🇱", tg: "🇹🇬", bj: "🇧🇯",
      mr: "🇲🇷", mu: "🇲🇺", er: "🇪🇷", dj: "🇩🇯", km: "🇰🇲",
      cv: "🇨🇻", cf: "🇨🇫",
      
      // Oceania
      au: "🇦🇺", nz: "🇳🇿", pg: "🇵🇬", fj: "🇫🇯",
      ws: "🇼🇸", pf: "🇵🇫", gu: "🇬🇺", fo: "🇫🇴",
    };

    const response = NextResponse.json({
      success: true,
      country: {
        code: countryCode.toUpperCase(),
        name: countryNames[countryCode.toLowerCase()] || countryCode.toUpperCase(),
        flag: countryFlags[countryCode.toLowerCase()] || "🏳️",
      },
      channels: paginatedChannels,
      total,
      page,
      totalPages,
      limit,
    });

    addSecurityHeaders(response);
    return response;
  }, 'CountryChannelsAPI');
}
