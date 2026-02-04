
export interface SocialStats {
  spotifyListeners: number;
  youtubeSubscribers: number;
  instagramFollowers: number;
  tiktokFollowers: number;
}

export interface Song {
  id: string;
  title: string;
  streams: number;
  coverUrl: string;
}

export interface SocialLink {
  url: string;
  isActive: boolean;
}

export interface SocialLinks {
  youtube?: SocialLink;
  instagram?: SocialLink;
  facebook?: SocialLink;
  twitter?: SocialLink; // X
  discord?: SocialLink;
}

export type ArtistStatus = 'active' | 'maintenance' | 'updating' | 'suspended' | 'unsigned' | 'editing';

export type BlockType = 'traffic' | 'bio' | 'music' | 'video' | 'stats';

export interface Artist {
  id: string;
  slug: string; // Friendly URL part (e.g., 'bad-bunny')
  name: string;
  bio: string;
  photoUrl: string;
  genre: string;
  stats: SocialStats;
  topSongs: Song[];
  youtubeVideoId: string; // e.g., "dQw4w9WgXcQ"
  spotifyArtistId: string; // e.g., "06HL4z0CvFAxyc27GXpf02"
  bookUrl?: string; // Link to Dropbox PDF
  isPublic: boolean;
  generatedLink?: string;
  galleryUrls?: string[]; // Array of image URLs for the "Book"
  visitCount?: number;
  visitorCountries?: string[];
  status: ArtistStatus;
  socialLinks?: SocialLinks; 
  layoutOrder?: BlockType[]; // New: Controls the order of sections
}

export interface WallItem {
  id: string;
  type: 'album' | 'artist' | 'single';
  imageUrl: string;
  title: string;
  subtitle: string;
}

export interface ImpactStats {
    produced: string;
    promoted: string;
    advised: string;
    lyrics: string;
    audiovisual: string;
    buttonPosition?: 'left' | 'right' | 'center';
}

export type ViewMode = 'public' | 'admin' | 'artist_landing';