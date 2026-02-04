import { Artist, WallItem, ImpactStats } from '../types';
import pool from './db';

// Initial Mock Data - Latin Grammy Theme (Used for Seeding Artists ONLY)
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
    galleryUrls: [],
    visitCount: 1245092,
    visitorCountries: ['Spain', 'USA', 'Mexico'],
    status: 'active',
    socialLinks: {
        instagram: { url: 'https://instagram.com', isActive: true },
        youtube: { url: 'https://youtube.com', isActive: true }
    },
    layoutOrder: ['traffic', 'bio', 'video', 'music', 'stats']
  }
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

            // Create Global Settings Table (For Site Lock & SEO)
            await client.query(`
                CREATE TABLE IF NOT EXISTS global_settings (
                    key TEXT PRIMARY KEY,
                    value TEXT
                );
            `);
            
            // Create Live Analytics Table
             await client.query(`
                CREATE TABLE IF NOT EXISTS analytics_logs (
                    id SERIAL PRIMARY KEY,
                    artist_id TEXT,
                    country TEXT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

// --- Global Settings (Lock & SEO & Impact Stats) ---

export const getSiteLockStatus = async (): Promise<boolean> => {
    try {
        const result = await pool.query("SELECT value FROM global_settings WHERE key = 'site_lock'");
        return result.rows[0]?.value === 'true';
    } catch (e) {
        return false;
    }
};

export const setSiteLockStatus = async (isLocked: boolean): Promise<void> => {
    try {
        const val = isLocked ? 'true' : 'false';
        await pool.query(
            "INSERT INTO global_settings (key, value) VALUES ('site_lock', $1) ON CONFLICT (key) DO UPDATE SET value = $1", 
            [val]
        );
    } catch (e) {
        console.error(e);
    }
};

export interface SEOSettings {
    title: string;
    description: string;
    keywords: string;
    lastUpdated: string;
}

export const getSEOSettings = async (): Promise<SEOSettings | null> => {
    try {
        const result = await pool.query("SELECT value FROM global_settings WHERE key = 'seo_config'");
        if (result.rows[0]?.value) {
            return JSON.parse(result.rows[0].value);
        }
        return null;
    } catch (e) {
        return null;
    }
}

export const saveSEOSettings = async (settings: SEOSettings): Promise<void> => {
    try {
        await pool.query(
            "INSERT INTO global_settings (key, value) VALUES ('seo_config', $1) ON CONFLICT (key) DO UPDATE SET value = $1",
            [JSON.stringify(settings)]
        );
    } catch (e) {
        console.error("Error saving SEO", e);
    }
}

// --- Impact Stats ---

export const getImpactStats = async (): Promise<ImpactStats> => {
    try {
        const result = await pool.query("SELECT value FROM global_settings WHERE key = 'impact_stats'");
        if (result.rows[0]?.value) {
            return JSON.parse(result.rows[0].value);
        }
        // Default values
        return {
            produced: "500+",
            promoted: "1.2K",
            advised: "300",
            lyrics: "5,000+",
            audiovisual: "250"
        };
    } catch (e) {
        return {
            produced: "500+",
            promoted: "1.2K",
            advised: "300",
            lyrics: "5,000+",
            audiovisual: "250"
        };
    }
}

export const saveImpactStats = async (stats: ImpactStats): Promise<void> => {
    try {
        await pool.query(
            "INSERT INTO global_settings (key, value) VALUES ('impact_stats', $1) ON CONFLICT (key) DO UPDATE SET value = $1",
            [JSON.stringify(stats)]
        );
    } catch (e) {
        console.error("Error saving impact stats", e);
    }
}

// --- Analytics ---

export const getLiveAnalytics = async (): Promise<{activeUsers: number, countries: string[]}> => {
    try {
        // Count logs from last 10 minutes to simulate "Live" users
        const result = await pool.query(`
            SELECT country, COUNT(*) as count 
            FROM analytics_logs 
            WHERE timestamp > NOW() - INTERVAL '10 minutes'
            GROUP BY country
        `);
        
        const countries = result.rows.map(r => r.country).filter(c => c);
        const activeUsers = result.rows.reduce((acc, r) => acc + parseInt(r.count), 0);
        
        return { 
            activeUsers: activeUsers > 0 ? activeUsers : 0, 
            countries: countries.length > 0 ? countries : ['Global'] 
        };
    } catch(e) {
        return { activeUsers: 0, countries: [] };
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
            
            // 1. Update total visits
            artist.visitCount = (artist.visitCount || 0) + 1;
            
            // 2. Determine country (Simulated for this demo, would be IP based in real app)
            const potentialCountries = ['USA', 'Spain', 'Mexico', 'UK', 'France', 'Brazil', 'Japan', 'Germany', 'Argentina', 'Colombia'];
            const randomCountry = potentialCountries[Math.floor(Math.random() * potentialCountries.length)];
            
            if (!artist.visitorCountries) artist.visitorCountries = [];
            if (!artist.visitorCountries.includes(randomCountry)) {
                artist.visitorCountries.push(randomCountry);
            }

            // 3. Save Artist Data
            await client.query(
                'UPDATE artists SET data = $1 WHERE id = $2',
                [JSON.stringify(artist), artistId]
            );

            // 4. Insert into Live Analytics Log
            await client.query(
                'INSERT INTO analytics_logs (artist_id, country) VALUES ($1, $2)',
                [artistId, randomCountry]
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
         // CRITICAL FIX: Ensure we get ID from column in case JSON data is corrupted
         const result = await pool.query('SELECT id, data FROM wall_items ORDER BY id DESC');
         return result.rows.map(r => {
             const data = r.data || {};
             // Merge DB ID on top of data ID to ensure validity for deletion
             return { ...data, id: r.id } as WallItem;
         });
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

export const deleteWallItem = async (id: string): Promise<boolean> => {
    try {
        await pool.query('DELETE FROM wall_items WHERE id = $1', [id]);
        return true;
    } catch (e) {
        console.error("Error deleting wall item:", e);
        return false;
    }
}

export const clearWall = async (): Promise<void> => {
    try {
        await pool.query('DELETE FROM wall_items');
    } catch (e) {
        console.error("Error clearing wall:", e);
    }
}

export const hardResetWall = async (): Promise<boolean> => {
    try {
        // DROP and RECREATE the table. This is the "Nuclear Option" to fix all corruption.
        await pool.query('DROP TABLE IF EXISTS wall_items');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS wall_items (
                id TEXT PRIMARY KEY,
                data JSONB
            );
        `);
        return true;
    } catch (e) {
        console.error("Error resetting wall:", e);
        return false;
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

export const getVisualEffects = async (): Promise<{ title: string, wall: string, speed: number }> => {
    try {
        const titleRes = await pool.query("SELECT value FROM visual_effects WHERE key = 'title'");
        const wallRes = await pool.query("SELECT value FROM visual_effects WHERE key = 'wall'");
        const speedRes = await pool.query("SELECT value FROM visual_effects WHERE key = 'wall_speed'");
        
        return {
            title: titleRes.rows[0]?.value || '',
            wall: wallRes.rows[0]?.value || '',
            speed: parseInt(speedRes.rows[0]?.value || '45')
        };
    } catch (e) {
        return { title: '', wall: '', speed: 45 };
    }
}

export const saveVisualEffects = async (titleFx: string, wallFx: string, speed: number): Promise<void> => {
    try {
        await pool.query("INSERT INTO visual_effects (key, value) VALUES ('title', $1) ON CONFLICT (key) DO UPDATE SET value = $1", [titleFx]);
        await pool.query("INSERT INTO visual_effects (key, value) VALUES ('wall', $1) ON CONFLICT (key) DO UPDATE SET value = $1", [wallFx]);
        await pool.query("INSERT INTO visual_effects (key, value) VALUES ('wall_speed', $1) ON CONFLICT (key) DO UPDATE SET value = $1", [speed.toString()]);
        window.dispatchEvent(new Event('storage_fx_update'));
    } catch (e) {
        console.error(e);
    }
}