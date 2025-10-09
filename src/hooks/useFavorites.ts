import { useState, useEffect } from 'react';

// Interface for old channel data (for migration)
interface LegacyChannel {
  id: string;
  name: string;
  url?: string;
  logo?: string;
  website?: string;
  category?: string;
  categories?: string[];
  country?: string;
  countryCode?: string;
  language?: string | string[];
  languages?: string[];
}

export interface Channel {
  id: string;
  name: string;
  url: string;
  logo?: string;
  website?: string;
  category: string;
  country: string;
  countryCode?: string;
  language: string[];
}

// Helper function to get initial favorites synchronously
const getInitialFavorites = (): Channel[] => {
  if (typeof window === 'undefined') return []; // SSR guard
  
  try {
    const stored = localStorage.getItem('viloTvFavorites');
    if (!stored) return [];
    
    const parsedFavorites = JSON.parse(stored);
    
    // Validate and migrate old data
    const validFavorites = (parsedFavorites as LegacyChannel[]).filter((channel: LegacyChannel) => {
      return channel && channel.id && channel.name;
    }).map((channel: LegacyChannel) => ({
      id: channel.id,
      name: channel.name,
      url: channel.url || channel.id,
      logo: channel.logo,
      website: channel.website,
      category: channel.category || (Array.isArray(channel.categories) ? channel.categories.join(', ') : 'General'),
      country: channel.country || '',
      countryCode: channel.countryCode,
      language: Array.isArray(channel.language) ? channel.language : 
               Array.isArray(channel.languages) ? channel.languages : 
               typeof channel.language === 'string' ? [channel.language] : []
    }));
    
    return validFavorites;
  } catch (e) {
    console.error('Error loading favorites:', e);
    return [];
  }
};

export function useFavorites() {
  const [favorites, setFavorites] = useState<Channel[]>(getInitialFavorites);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Mark as initialized after first render
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // Save to localStorage when favorites change (but only after initialization)
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('viloTvFavorites', JSON.stringify(favorites));
    }
  }, [favorites, isInitialized]);

  const addFavorite = (channel: Channel) => {
    setFavorites(prev => {
      if (prev.some(fav => fav.id === channel.id)) return prev;
      return [...prev, channel];
    });
  };

  const removeFavorite = (id: string) => {
    setFavorites(prev => prev.filter(fav => fav.id !== id));
  };

  const isFavorite = (id: string) => {
    const result = favorites.some(fav => fav.id === id);
    return result;
  };

  const toggleFavorite = (channel: Channel) => {
    if (isFavorite(channel.id)) {
      removeFavorite(channel.id);
    } else {
      addFavorite(channel);
    }
  };

  return { favorites, addFavorite, removeFavorite, isFavorite, toggleFavorite, isLoaded: isInitialized };
}