export interface WebsiteVideo {
  id: string;
  title: string;
  quote: string;
  hook?: string;
  cta?: string;
  category: string;
  coverImageUrl: string;
  videoUrl?: string;
  audioUrl?: string;
  voice: string;
  aspectRatio: string;
  duration: string;
  visualTheme: string;
  subtitles?: string | any[];
  tags?: string | string[];
  status: 'ready' | 'rendering' | 'draft';
  views?: number;
  likes?: number;
  createdAt: string;
}

export interface VideoFilterState {
  search: string;
  category: string;
  aspectRatio: string;
  sortBy: 'newest' | 'oldest' | 'title' | 'duration';
  viewMode: 'grid' | 'list';
}
