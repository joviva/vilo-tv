export interface Category {
  id: string;
  name: string;
}

export interface Country {
  code: string;
  name: string;
  flag: string;
  languageCode: string;
  language?: Language;
}

export interface Language {
  code: string;
  name: string;
}

export interface Channel {
  id: string;
  name: string;
  logo?: string;
  website?: string;
  categories: string[];
  country: string;
  languages: string[];
}

export interface Stream {
  url: string;
  title: string;
  tvgId?: string;
  tvgLogo?: string;
  groupTitle?: string;
  quality?: string;
  country?: string;
  categories: string[];
  languages: string[];
}

export interface PlaylistData {
  channels: Stream[];
  total: number;
  page?: number;
  limit?: number;
}
