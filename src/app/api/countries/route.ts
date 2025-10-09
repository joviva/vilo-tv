import { NextRequest, NextResponse } from 'next/server';
import { Country } from '@/lib/types';
import {
  validateSearchParam,
  rateLimit,
  addSecurityHeaders
} from '@/lib/validation';
import { getFlagByCountryCode } from '@/lib/countryFlags';
import { withErrorHandling } from '@/lib/errors';
import { getCachedResponse, setCachedResponse } from '@/lib/cache';
import { CACHE_KEYS } from '@/lib/constants';
import logger from '@/lib/logger';

// Simplified static country list with estimated channel counts
const countriesData: { code: string; name: string; languageCode: string; channelCount: number }[] = [
  { code: 'US', name: 'United States', languageCode: 'eng', channelCount: 1500 },
  { code: 'GB', name: 'United Kingdom', languageCode: 'eng', channelCount: 350 },
  { code: 'FR', name: 'France', languageCode: 'fra', channelCount: 300 },
  { code: 'DE', name: 'Germany', languageCode: 'deu', channelCount: 270 },
  { code: 'IT', name: 'Italy', languageCode: 'ita', channelCount: 245 },
  { code: 'ES', name: 'Spain', languageCode: 'spa', channelCount: 234 },
  { code: 'CA', name: 'Canada', languageCode: 'eng', channelCount: 198 },
  { code: 'BR', name: 'Brazil', languageCode: 'por', channelCount: 187 },
  { code: 'RU', name: 'Russia', languageCode: 'rus', channelCount: 176 },
  { code: 'IN', name: 'India', languageCode: 'hin', channelCount: 165 },
  { code: 'AU', name: 'Australia', languageCode: 'eng', channelCount: 154 },
  { code: 'MX', name: 'Mexico', languageCode: 'spa', channelCount: 143 },
  { code: 'TR', name: 'Turkey', languageCode: 'tur', channelCount: 132 },
  { code: 'NL', name: 'Netherlands', languageCode: 'nld', channelCount: 121 },
  { code: 'CN', name: 'China', languageCode: 'zho', channelCount: 110 },
  { code: 'JP', name: 'Japan', languageCode: 'jpn', channelCount: 99 },
  { code: 'AR', name: 'Argentina', languageCode: 'spa', channelCount: 88 },
  { code: 'BE', name: 'Belgium', languageCode: 'nld', channelCount: 77 },
  { code: 'CH', name: 'Switzerland', languageCode: 'deu', channelCount: 66 },
  { code: 'SE', name: 'Sweden', languageCode: 'swe', channelCount: 55 },
  { code: 'NO', name: 'Norway', languageCode: 'nor', channelCount: 54 },
  { code: 'DK', name: 'Denmark', languageCode: 'dan', channelCount: 53 },
  { code: 'FI', name: 'Finland', languageCode: 'fin', channelCount: 52 },
  { code: 'PL', name: 'Poland', languageCode: 'pol', channelCount: 51 },
  { code: 'PT', name: 'Portugal', languageCode: 'por', channelCount: 50 },
  
  // South America
  { code: 'CO', name: 'Colombia', languageCode: 'spa', channelCount: 45 },
  { code: 'CL', name: 'Chile', languageCode: 'spa', channelCount: 42 },
  { code: 'PE', name: 'Peru', languageCode: 'spa', channelCount: 38 },
  { code: 'VE', name: 'Venezuela', languageCode: 'spa', channelCount: 35 },
  { code: 'EC', name: 'Ecuador', languageCode: 'spa', channelCount: 32 },
  { code: 'BO', name: 'Bolivia', languageCode: 'spa', channelCount: 28 },
  { code: 'UY', name: 'Uruguay', languageCode: 'spa', channelCount: 25 },
  { code: 'PY', name: 'Paraguay', languageCode: 'spa', channelCount: 22 },
  { code: 'GY', name: 'Guyana', languageCode: 'eng', channelCount: 18 },
  { code: 'SR', name: 'Suriname', languageCode: 'nld', channelCount: 15 },
  { code: 'GF', name: 'French Guiana', languageCode: 'fra', channelCount: 12 },
  
  // Central America
  { code: 'CR', name: 'Costa Rica', languageCode: 'spa', channelCount: 30 },
  { code: 'PA', name: 'Panama', languageCode: 'spa', channelCount: 28 },
  { code: 'GT', name: 'Guatemala', languageCode: 'spa', channelCount: 26 },
  { code: 'HN', name: 'Honduras', languageCode: 'spa', channelCount: 24 },
  { code: 'SV', name: 'El Salvador', languageCode: 'spa', channelCount: 22 },
  { code: 'NI', name: 'Nicaragua', languageCode: 'spa', channelCount: 20 },
  { code: 'BZ', name: 'Belize', languageCode: 'eng', channelCount: 16 },
  
  // Caribbean
  { code: 'DO', name: 'Dominican Republic', languageCode: 'spa', channelCount: 40 },
  { code: 'CU', name: 'Cuba', languageCode: 'spa', channelCount: 35 },
  { code: 'PR', name: 'Puerto Rico', languageCode: 'spa', channelCount: 32 },
  { code: 'JM', name: 'Jamaica', languageCode: 'eng', channelCount: 28 },
  { code: 'HT', name: 'Haiti', languageCode: 'fra', channelCount: 25 },
  { code: 'TT', name: 'Trinidad & Tobago', languageCode: 'eng', channelCount: 22 },
  { code: 'BS', name: 'Bahamas', languageCode: 'eng', channelCount: 20 },
  { code: 'BB', name: 'Barbados', languageCode: 'eng', channelCount: 18 },
  { code: 'GD', name: 'Grenada', languageCode: 'eng', channelCount: 16 },
  { code: 'LC', name: 'Saint Lucia', languageCode: 'eng', channelCount: 15 },
  { code: 'VC', name: 'St. Vincent & Grenadines', languageCode: 'eng', channelCount: 14 },
  { code: 'AG', name: 'Antigua & Barbuda', languageCode: 'eng', channelCount: 14 },
  { code: 'KN', name: 'St. Kitts & Nevis', languageCode: 'eng', channelCount: 13 },
  { code: 'DM', name: 'Dominica', languageCode: 'eng', channelCount: 12 },
  { code: 'AW', name: 'Aruba', languageCode: 'nld', channelCount: 12 },
  { code: 'CW', name: 'Curacao', languageCode: 'nld', channelCount: 11 },
  { code: 'SX', name: 'Sint Maarten', languageCode: 'nld', channelCount: 10 },
  { code: 'BQ', name: 'Bonaire', languageCode: 'nld', channelCount: 9 },
  { code: 'MQ', name: 'Martinique', languageCode: 'fra', channelCount: 10 },
  { code: 'GP', name: 'Guadeloupe', languageCode: 'fra', channelCount: 10 },
  { code: 'AI', name: 'Anguilla', languageCode: 'eng', channelCount: 8 },
  { code: 'KY', name: 'Cayman Islands', languageCode: 'eng', channelCount: 8 },
  { code: 'TC', name: 'Turks & Caicos', languageCode: 'eng', channelCount: 7 },
  { code: 'VG', name: 'British Virgin Is.', languageCode: 'eng', channelCount: 7 },
  { code: 'VI', name: 'U.S. Virgin Is.', languageCode: 'eng', channelCount: 7 },
  { code: 'BM', name: 'Bermuda', languageCode: 'eng', channelCount: 6 },
  { code: 'MS', name: 'Montserrat', languageCode: 'eng', channelCount: 5 },
];

// Map country data to include flags
const countries: (Country & { channelCount: number })[] = countriesData.map(country => {
  const flag = getFlagByCountryCode(country.code);
  return {
    ...country,
    flag,
  };
});

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    if (!rateLimit(request, 60, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = validateSearchParam(searchParams.get('search'));
    const sortBy = searchParams.get('sortBy') || 'channels';

    // Create cache key based on search parameters
    const cacheKey = `${CACHE_KEYS.COUNTRIES}_${search || 'all'}_${sortBy}`;
    
    // Try to get from cache first
    const cachedData = getCachedResponse(cacheKey);
    if (cachedData) {
      logger.debug('Returning cached countries data', 'CountriesAPI', { search, sortBy });
      return NextResponse.json(cachedData);
    }

    logger.info('Processing countries request', 'CountriesAPI', { search, sortBy });

    let filteredCountries = countries;

    if (search) {
      const searchTerm = search.toLowerCase();
      filteredCountries = countries.filter(
        (country) =>
          country.name.toLowerCase().includes(searchTerm) ||
          country.code.toLowerCase().includes(searchTerm)
      );
    }

    filteredCountries.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else {
        return b.channelCount - a.channelCount;
      }
    });

    const responseData = {
      countries: filteredCountries,
      total: filteredCountries.length,
    };

    // Cache the response for 1 hour
    setCachedResponse(cacheKey, responseData, 60 * 60 * 1000);

    const response = NextResponse.json(responseData);

    response.headers.set(
      'Cache-Control',
      's-maxage=3600, stale-while-revalidate=86400'
    );

    logger.debug('Countries data processed successfully', 'CountriesAPI', { 
      total: responseData.total,
      filtered: Boolean(search)
    });

    return addSecurityHeaders(response);
  }, 'CountriesAPI');
}
