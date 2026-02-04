
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

export type ArtistStatus = 'active' | 'maintenance' | 'updating' | 'suspended' | 'unsigned' | 'editing';

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
}

export interface WallItem {
  id: string;
  type: 'album' | 'artist' | 'single';
  imageUrl: string;
  title: string;
  subtitle: string;
}

export type ViewMode = 'public' | 'admin' | 'artist_landing';
