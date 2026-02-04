import { Artist, WallItem } from '../types';

// Initial Mock Data - Latin Grammy Theme
const INITIAL_ARTISTS: Artist[] = [
  {
    id: '1',
    slug: 'rosalia',
    name: "Rosalía & The Motomamis",
    bio: "Redefining flamenco pop with experimental beats and Latin Grammy winning aesthetics.",
    photoUrl: "https://picsum.photos/800/800?random=101",
    genre: "Neoflamenco / Pop",
    stats: { spotifyListeners: 45000000, youtubeSubscribers: 12000000, instagramFollowers: 28000000, tiktokFollowers: 32000000 },
    topSongs: [
       { id: 's1', title: "Despechá", streams: 890000000, coverUrl: "https://picsum.photos/400/400?random=102" }
    ],
    youtubeVideoId: "o5OIBh4k-Zg", 
    spotifyArtistId: "7ltDVBr6mKbRvohxheJ9h1",
    bookUrl: "",
    isPublic: true,
    generatedLink: '/artist/rosalia',
    galleryUrls: [
        "https://picsum.photos/800/600?random=1",
        "https://picsum.photos/800/600?random=2",
        "https://picsum.photos/800/600?random=3"
    ],
    visitCount: 1245092,
    visitorCountries: ['Spain', 'USA', 'Mexico', 'Colombia', 'Argentina']
  },
  {
    id: '2',
    slug: 'bad-bunny',
    name: "Bad Bunny",
    bio: "Global icon dominating the charts. The face of modern Reggaeton.",
    photoUrl: "https://picsum.photos/800/800?random=103",
    genre: "Trap / Reggaeton",
    stats: { spotifyListeners: 80000000, youtubeSubscribers: 45000000, instagramFollowers: 46000000, tiktokFollowers: 35000000 },
    topSongs: [
        { id: 's3', title: "Monaco", streams: 1200000000, coverUrl: "https://picsum.photos/400/400?random=104" }
    ],
    youtubeVideoId: "UNZqm3dxdRE",
    spotifyArtistId: "4q3ewBCX7sLwd24euuV69X",
    bookUrl: "",
    isPublic: true,
    generatedLink: '/artist/bad-bunny',
    galleryUrls: [],
    visitCount: 5430210,
    visitorCountries: ['Puerto Rico', 'USA', 'Spain', 'Chile']
  }
];

const INITIAL_WALL: WallItem[] = [
    { id: 'w1', type: 'album', title: 'MOTOMAMI', subtitle: 'Album of the Year', imageUrl: 'https://picsum.photos/400/400?random=102' },
    { id: 'w2', type: 'artist', title: 'Karol G', subtitle: 'Artist', imageUrl: 'https://picsum.photos/800/800?random=105' },
    { id: 'w3', type: 'single', title: 'Titi Me Preguntó', subtitle: 'Single', imageUrl: 'https://picsum.photos/400/400?random=104' },
    { id: 'w4', type: 'artist', title: 'Rauw Alejandro', subtitle: 'Artist', imageUrl: 'https://picsum.photos/800/800?random=106' },
    { id: 'w5', type: 'album', title: 'Un Verano Sin Ti', subtitle: 'Bad Bunny', imageUrl: 'https://picsum.photos/400/400?random=107' },
    { id: 'w6', type: 'single', title: 'Provenza', subtitle: 'Karol G', imageUrl: 'https://picsum.photos/400/400?random=108' },
    { id: 'w7', type: 'album', title: 'Mañana Será Bonito', subtitle: 'Karol G', imageUrl: 'https://picsum.photos/400/400?random=109' },
    { id: 'w8', type: 'single', title: 'Ojitos Lindos', subtitle: 'Bad Bunny', imageUrl: 'https://picsum.photos/400/400?random=110' },
    { id: 'w9', type: 'artist', title: 'Shakira', subtitle: 'Legend', imageUrl: 'https://picsum.photos/400/400?random=111' },
    { id: 'w10', type: 'artist', title: 'Bizarrap', subtitle: 'Producer', imageUrl: 'https://picsum.photos/800/800?random=112' },
];

export const getArtists = (): Artist[] => {
  const stored = localStorage.getItem('uom_artists');
  if (!stored) {
    localStorage.setItem('uom_artists', JSON.stringify(INITIAL_ARTISTS));
    return INITIAL_ARTISTS;
  }
  return JSON.parse(stored);
};

export const getArtistById = (idOrSlug: string): Artist | undefined => {
  const artists = getArtists();
  // Try ID first
  const byId = artists.find(a => a.id === idOrSlug);
  if (byId) return byId;
  // Then try slug
  return artists.find(a => a.slug === idOrSlug);
};

export const saveArtist = (artist: Artist): void => {
  const artists = getArtists();
  const existingIndex = artists.findIndex(a => a.id === artist.id);
  if (existingIndex >= 0) {
    artists[existingIndex] = artist;
  } else {
    artists.push(artist);
  }
  localStorage.setItem('uom_artists', JSON.stringify(artists));
};

export const trackArtistVisit = (artistId: string): Artist | null => {
    const artists = getArtists();
    const index = artists.findIndex(a => a.id === artistId);
    
    if (index >= 0) {
        // Increment visit count
        const currentVisits = artists[index].visitCount || 0;
        artists[index].visitCount = currentVisits + 1;
        
        // Simulate adding a country occasionally
        const potentialCountries = ['USA', 'Spain', 'Mexico', 'UK', 'France', 'Brazil', 'Japan', 'Germany', 'Argentina', 'Colombia'];
        const existingCountries = artists[index].visitorCountries || [];
        
        // 10% chance to add a new country if not present
        if (Math.random() > 0.9) {
            const randomCountry = potentialCountries[Math.floor(Math.random() * potentialCountries.length)];
            if (!existingCountries.includes(randomCountry)) {
                existingCountries.push(randomCountry);
                artists[index].visitorCountries = existingCountries;
            }
        }
        
        localStorage.setItem('uom_artists', JSON.stringify(artists));
        return artists[index];
    }
    return null;
}

export const getWallItems = (): WallItem[] => {
     const stored = localStorage.getItem('uom_wall');
     if (!stored) {
         localStorage.setItem('uom_wall', JSON.stringify(INITIAL_WALL));
         return INITIAL_WALL;
     }
     return JSON.parse(stored);
}

export const addToWall = (item: WallItem) => {
    const items = getWallItems();
    items.unshift(item); // Add to top
    localStorage.setItem('uom_wall', JSON.stringify(items));
}

export const convertDropboxLink = (url: string): string => {
    // Converts a standard Dropbox share link to a direct download image link
    // Example: https://www.dropbox.com/s/xyz/image.jpg?dl=0 -> https://dl.dropboxusercontent.com/s/xyz/image.jpg
    if (url.includes('dropbox.com')) {
        return url.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '');
    }
    return url;
}

// Return an object with both effects
export const getVisualEffects = (): { title: string, wall: string } => {
    return {
        title: localStorage.getItem('uom_fx_title') || '',
        wall: localStorage.getItem('uom_fx_wall') || ''
    };
}

// Save both effects separatelely
export const saveVisualEffects = (titleFx: string, wallFx: string) => {
    localStorage.setItem('uom_fx_title', titleFx);
    localStorage.setItem('uom_fx_wall', wallFx);
    
    // Dispatch a custom event so other components can react instantly without reload
    window.dispatchEvent(new Event('storage_fx_update'));
}

// Deprecated single setters (keeping for backward compatibility if needed temporarily)
export const getActiveEffect = (): string => {
    return localStorage.getItem('uom_fx_title') || '';
}

export const setActiveEffect = (effectClass: string) => {
    localStorage.setItem('uom_fx_title', effectClass);
}