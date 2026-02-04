import { Artist, WallItem } from '../types';
import pool from './db';

// Initial Mock Data - Latin Grammy Theme (Used for Seeding)
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
    visitorCountries: ['Spain', 'USA', 'Mexico', 'Colombia', 'Argentina'],
    status: 'active'
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
    visitorCountries: ['Puerto Rico', 'USA', 'Spain', 'Chile'],
    status: 'active'
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

// Initialize Database Schema
export const initDB = async () => {
    try {
        const client = await pool.connect();
        try {
            // Create Artists Table
            await client.query(`
                CREATE TABLE IF NOT EXISTS artists (
                    id TEXT PRIMARY KEY,
                    slug TEXT UNIQUE,
                    data JSONB
                );
            `);

            // Create Wall Items Table
            await client.query(`
                CREATE TABLE IF NOT EXISTS wall_items (
                    id TEXT PRIMARY KEY,
                    data JSONB
                );
            `);

            // Create Visual Effects Table
            await client.query(`
                CREATE TABLE IF NOT EXISTS visual_effects (
                    key TEXT PRIMARY KEY,
                    value TEXT
                );
            `);

            // Seed Initial Data if Empty
            const artistCount = await client.query('SELECT COUNT(*) FROM artists');
            if (parseInt(artistCount.rows[0].count) === 0) {
                console.log("Seeding Initial Artists...");
                for (const artist of INITIAL_ARTISTS) {
                    await client.query(
                        'INSERT INTO artists (id, slug, data) VALUES ($1, $2, $3)',
                        [artist.id, artist.slug, JSON.stringify(artist)]
                    );
                }
            }

            const wallCount = await client.query('SELECT COUNT(*) FROM wall_items');
            if (parseInt(wallCount.rows[0].count) === 0) {
                console.log("Seeding Initial Wall...");
                for (const item of INITIAL_WALL) {
                    await client.query(
                        'INSERT INTO wall_items (id, data) VALUES ($1, $2)',
                        [item.id, JSON.stringify(item)]
                    );
                }
            }

        } finally {
            client.release();
        }
        console.log("Database Initialized Successfully");
    } catch (err) {
        console.error("Failed to initialize database:", err);
    }
};

// Check DB Connection
export const checkDbConnection = async (): Promise<boolean> => {
    try {
        const client = await pool.connect();
        try {
            await client.query('SELECT 1');
            return true;
        } finally {
            client.release();
        }
    } catch (e) {
        console.error("DB Check failed", e);
        return false;
    }
}

// --- Artists ---

export const getArtists = async (): Promise<Artist[]> => {
  try {
      const result = await pool.query('SELECT data FROM artists');
      return result.rows.map(row => row.data as Artist);
  } catch (e) {
      console.error(e);
      return [];
  }
};

export const getArtistById = async (idOrSlug: string): Promise<Artist | undefined> => {
  try {
      // Try ID
      let result = await pool.query('SELECT data FROM artists WHERE id = $1', [idOrSlug]);
      if (result.rows.length > 0) return result.rows[0].data as Artist;

      // Try Slug
      result = await pool.query('SELECT data FROM artists WHERE slug = $1', [idOrSlug]);
      if (result.rows.length > 0) return result.rows[0].data as Artist;

      return undefined;
  } catch (e) {
      console.error(e);
      return undefined;
  }
};

export const saveArtist = async (artist: Artist): Promise<void> => {
  try {
      await pool.query(
          `INSERT INTO artists (id, slug, data) 
           VALUES ($1, $2, $3) 
           ON CONFLICT (id) 
           DO UPDATE SET slug = $2, data = $3`,
          [artist.id, artist.slug, JSON.stringify(artist)]
      );
  } catch (e) {
      console.error("Error saving artist:", e);
  }
};

export const deleteArtist = async (id: string): Promise<void> => {
    try {
        await pool.query('DELETE FROM artists WHERE id = $1', [id]);
    } catch (e) {
        console.error("Error deleting artist:", e);
    }
}

export const trackArtistVisit = async (artistId: string): Promise<Artist | null> => {
    try {
        const client = await pool.connect();
        try {
            const res = await client.query('SELECT data FROM artists WHERE id = $1', [artistId]);
            if (res.rows.length === 0) return null;

            const artist = res.rows[0].data as Artist;
            
            // Logic to update stats
            artist.visitCount = (artist.visitCount || 0) + 1;
            
            const potentialCountries = ['USA', 'Spain', 'Mexico', 'UK', 'France', 'Brazil', 'Japan', 'Germany', 'Argentina', 'Colombia'];
            if (!artist.visitorCountries) artist.visitorCountries = [];
            
            if (Math.random() > 0.9) {
                const randomCountry = potentialCountries[Math.floor(Math.random() * potentialCountries.length)];
                if (!artist.visitorCountries.includes(randomCountry)) {
                    artist.visitorCountries.push(randomCountry);
                }
            }

            await client.query(
                'UPDATE artists SET data = $1 WHERE id = $2',
                [JSON.stringify(artist), artistId]
            );
            
            return artist;
        } finally {
            client.release();
        }
    } catch (e) {
        console.error("Error tracking visit:", e);
        return null;
    }
}

// --- Wall Items ---

export const getWallItems = async (): Promise<WallItem[]> => {
     try {
         const result = await pool.query('SELECT data FROM wall_items ORDER BY id DESC'); // Naive sort, assuming newer IDs are higher or UUIDs
         // Actually better to rely on insert order if we had a created_at, but for now just returning all
         return result.rows.map(r => r.data as WallItem);
     } catch (e) {
         console.error(e);
         return [];
     }
}

export const addToWall = async (item: WallItem): Promise<void> => {
    try {
        await pool.query(
            'INSERT INTO wall_items (id, data) VALUES ($1, $2)',
            [item.id, JSON.stringify(item)]
        );
    } catch (e) {
        console.error(e);
    }
}

export const deleteWallItem = async (id: string): Promise<void> => {
    try {
        await pool.query('DELETE FROM wall_items WHERE id = $1', [id]);
    } catch (e) {
        console.error("Error deleting wall item:", e);
    }
}

// --- Utils ---

export const convertDropboxLink = (url: string): string => {
    if (url.includes('dropbox.com')) {
        return url.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '');
    }
    return url;
}

// --- Visual Effects ---

export const getVisualEffects = async (): Promise<{ title: string, wall: string }> => {
    try {
        const titleRes = await pool.query("SELECT value FROM visual_effects WHERE key = 'title'");
        const wallRes = await pool.query("SELECT value FROM visual_effects WHERE key = 'wall'");
        
        return {
            title: titleRes.rows[0]?.value || '',
            wall: wallRes.rows[0]?.value || ''
        };
    } catch (e) {
        return { title: '', wall: '' };
    }
}

export const saveVisualEffects = async (titleFx: string, wallFx: string): Promise<void> => {
    try {
        await pool.query("INSERT INTO visual_effects (key, value) VALUES ('title', $1) ON CONFLICT (key) DO UPDATE SET value = $1", [titleFx]);
        await pool.query("INSERT INTO visual_effects (key, value) VALUES ('wall', $1) ON CONFLICT (key) DO UPDATE SET value = $1", [wallFx]);
        
        // Dispatch event for local reactivity if needed (though DB is source of truth now, a refresh might be needed)
        window.dispatchEvent(new Event('storage_fx_update'));
    } catch (e) {
        console.error(e);
    }
}
