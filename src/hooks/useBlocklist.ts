import { useState, useEffect } from 'react';

const BLOCKLIST_KEY = 'viloTvBlocklist';

export function useBlocklist() {
  const [blocklist, setBlocklist] = useState<Set<string>>(new Set());
  const [isInitialized, setIsInitialized] = useState(false);

  // Load blocklist from localStorage on mount
  useEffect(() => {
    const storedBlocklist = localStorage.getItem(BLOCKLIST_KEY);
    if (storedBlocklist) {
      try {
        const parsed = JSON.parse(storedBlocklist);
        setBlocklist(new Set(parsed));
      } catch (error) {
        console.error('Error loading blocklist:', error);
      }
    }
    setIsInitialized(true);
  }, []);

  // Save blocklist to localStorage whenever it changes (but only after initialization)
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(BLOCKLIST_KEY, JSON.stringify(Array.from(blocklist)));
    }
  }, [blocklist, isInitialized]);

  const addToBlocklist = (channelId: string) => {
    setBlocklist((prev) => {
      const newSet = new Set(prev);
      newSet.add(channelId);
      return newSet;
    });
  };

  const removeFromBlocklist = (channelId: string) => {
    setBlocklist((prev) => {
      const newSet = new Set(prev);
      newSet.delete(channelId);
      return newSet;
    });
  };

  const isBlocked = (channelId: string) => {
    return blocklist.has(channelId);
  };

  const clearBlocklist = () => {
    setBlocklist(new Set());
  };

  return {
    blocklist,
    addToBlocklist,
    removeFromBlocklist,
    isBlocked,
    clearBlocklist,
    blocklistSize: blocklist.size,
  };
}
