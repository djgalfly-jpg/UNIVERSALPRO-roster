import React, { useState, useRef, useEffect } from 'react';
import { Artist, WallItem, ArtistStatus, SocialLinks } from '../types';
import { getArtists, saveArtist, addToWall, convertDropboxLink, getVisualEffects, saveVisualEffects, deleteArtist, getWallItems, deleteWallItem, checkDbConnection, getSiteLockStatus, setSiteLockStatus, clearWall, getSEOSettings, saveSEOSettings, SEOSettings, hardResetWall } from '../services/store';
import { searchArtistBio, editArtistImage, extractSpotifyPlaylistData, generateSiteSEO } from '../services/geminiService';
import { Link } from 'react-router-dom';
import { Camera, Wand2, Search, Link as LinkIcon, Upload, Music, Loader2, Sparkles, LayoutGrid, Image as ImageIcon, CheckCircle, BarChart3, Youtube, Instagram, Twitter, Copy, Check, Eye, Globe, Images, Monitor, Type, Save, Disc, FileText, Lock, AlertTriangle, Trash2, Settings, Power, RefreshCw, XCircle, AlertOctagon, Edit3, ArrowLeft, Database, Pencil, Facebook, MessageCircle, Shield, Radio, ListPlus, Play, Key, SearchCode, Ghost, Zap, Gauge, MousePointerClick } from 'lucide-react';
import ArtistLandingPage from './ArtistLandingPage';

const AdminDashboard: React.FC = () => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);

  const [activeTab, setActiveTab] = useState<'create' | 'wall' | 'animations' | 'sites' | 'seo'>('create');
  const [artists, setArtists] = useState<Artist[]>([]);
  
  // System Status
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [isSiteLocked, setIsSiteLocked] = useState(false);
  
  // SEO State
  const [seoSettings, setSeoSettings] = useState<SEOSettings | null>(null);
  const [isGeneratingSEO, setIsGeneratingSEO] = useState(false);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDesc, setSeoDesc] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');

  // FX State
  const [currentEffects, setCurrentEffects] = useState({ title: '', wall: '', speed: 45 });
  const [tempTitleFx, setTempTitleFx] = useState('');
  const [tempWallFx, setTempWallFx] = useState('');
  const [wallSpeed, setWallSpeed] = useState(45);
  
  // Artist Form State
  const [editingArtistId, setEditingArtistId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [photoUrl, setPhotoUrl] = useState('https://picsum.photos/800/800');
  const [genre, setGenre] = useState('');
  const [ytId, setYtId] = useState('');
  const [spotifyId, setSpotifyId] = useState('');
  const [bookUrl, setBookUrl] = useState('');
  
  // Social Media State
  const [socials, setSocials] = useState<SocialLinks>({
      youtube: { url: '', isActive: false },
      instagram: { url: '', isActive: false },
      facebook: { url: '', isActive: false },
      twitter: { url: '', isActive: false },
      discord: { url: '', isActive: false },
  });

  // Gallery/Book State
  const [galleryInput, setGalleryInput] = useState('');

  // Stats Form State
  const [spotifyListeners, setSpotifyListeners] = useState('');
  const [youtubeSubs, setYoutubeSubs] = useState('');
  const [instaFollowers, setInstaFollowers] = useState('');
  const [tiktokFollowers, setTiktokFollowers] = useState('');

  // Creation & Preview State
  const [previewArtist, setPreviewArtist] = useState<Artist | null>(null);
  const [generatedPublicLink, setGeneratedPublicLink] = useState<string | null>(null);
  const [justCopied, setJustCopied] = useState(false);
  
  // Wall Item Form State
  const [wallTitle, setWallTitle] = useState('');
  const [wallSubtitle, setWallSubtitle] = useState('');
  const [dropboxLink, setDropboxLink] = useState('');
  const [existingWallItems, setExistingWallItems] = useState<WallItem[]>([]);
  
  // Spotify Import State
  const [spotifyPlaylistInput, setSpotifyPlaylistInput] = useState('https://open.spotify.com/playlist/37i9dQZEVXbNFJfN1Vw8d9');
  const [isImporting, setIsImporting] = useState(false);
  
  // AI States
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Data
  useEffect(() => {
      if (isAuthenticated) {
          loadData();
          verifyDb();
          loadSystemSettings();
      }
  }, [isAuthenticated, activeTab]);

  const verifyDb = async () => {
      setDbStatus('checking');
      const isConnected = await checkDbConnection();
      setDbStatus(isConnected ? 'connected' : 'error');
  }
  
  const loadSystemSettings = async () => {
      const locked = await getSiteLockStatus();
      setIsSiteLocked(locked);
      
      const seo = await getSEOSettings();
      setSeoSettings(seo);
      if (seo) {
          setSeoTitle(seo.title || '');
          setSeoDesc(seo.description || '');
          setSeoKeywords(seo.keywords || '');
      }
  }

  const toggleSiteLock = async () => {
      const newState = !isSiteLocked;
      setIsSiteLocked(newState);
      await setSiteLockStatus(newState);
  }

  const loadData = async () => {
      const fetchedArtists = await getArtists();
      setArtists(fetchedArtists);

      const effects = await getVisualEffects();
      setCurrentEffects(effects);
      
      // Sync temp state with live DB state only if we haven't touched them yet
      if (!tempTitleFx && effects.title) setTempTitleFx(effects.title);
      if (!tempWallFx && effects.wall) setTempWallFx(effects.wall);
      setWallSpeed(effects.speed);

      if (activeTab === 'wall') {
          const wItems = await getWallItems();
          setExistingWallItems(wItems);
      }
  };

  const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      if (passwordInput === '8069987Pt') {
          setIsAuthenticated(true);
          setAuthError(false);
      } else {
          setAuthError(true);
          setPasswordInput('');
      }
  }

  const handleSearchBio = async () => {
    if (!name) return alert("Enter artist name first");
    setIsGeneratingBio(true);
    const generatedBio = await searchArtistBio(name);
    setBio(generatedBio);
    setIsGeneratingBio(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDropboxImageForArtist = (val: string) => {
      const converted = convertDropboxLink(val);
      setPhotoUrl(converted);
  };

  const handleAiImageEdit = async () => {
    if (!photoUrl.startsWith('data:')) return alert("AI editing requires a direct file upload (base64) currently, not a remote URL.");
    if (!editPrompt) return alert("Describe the change (e.g., 'High contrast noir style')");

    setIsEditingImage(true);
    try {
        const base64 = photoUrl.split(',')[1];
        const newUrl = await editArtistImage(base64, editPrompt);
        if (newUrl) setPhotoUrl(newUrl);
    } catch (e) {
        alert("Failed to edit image");
    } finally {
        setIsEditingImage(false);
    }
  };

  const handleSpotifyUrlChange = (val: string) => {
      let extractedId = val.trim();
      try {
          if (extractedId.includes('/artist/')) {
              const parts = extractedId.split('/artist/');
              if (parts.length > 1) {
                  extractedId = parts[1].split(/[?\/]/)[0];
              }
          }
          else if (extractedId.includes('spotify:artist:')) {
              extractedId = extractedId.split(':')[2];
          }
      } catch (e) {
          console.error("Error parsing Spotify URL", e);
      }
      setSpotifyId(extractedId);
  }

  const handleSocialChange = (platform: keyof SocialLinks, field: 'url' | 'isActive', value: any) => {
      setSocials(prev => ({
          ...prev,
          [platform]: {
              ...prev[platform],
              [field]: value
          }
      }));
  };

  const generateSlug = (artistName: string) => {
      return artistName
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
  };

  const handleEditArtist = (artist: Artist) => {
      setEditingArtistId(artist.id);
      setName(artist.name);
      setBio(artist.bio);
      setPhotoUrl(artist.photoUrl);
      setGenre(artist.genre);
      setYtId(artist.youtubeVideoId);
      setSpotifyId(artist.spotifyArtistId);
      setBookUrl(artist.bookUrl || '');
      setGalleryInput(artist.galleryUrls ? artist.galleryUrls.join('\n') : '');
      setSpotifyListeners(artist.stats.spotifyListeners.toString());
      setYoutubeSubs(artist.stats.youtubeSubscribers.toString());
      setInstaFollowers(artist.stats.instagramFollowers.toString());
      setTiktokFollowers(artist.stats.tiktokFollowers.toString());
      
      // Load Socials robustly
      const defaultSocials: SocialLinks = {
          youtube: { url: '', isActive: false },
          instagram: { url: '', isActive: false },
          facebook: { url: '', isActive: false },
          twitter: { url: '', isActive: false },
          discord: { url: '', isActive: false },
      };
      
      // Merge with defaults to prevent crashes if key is missing
      const mergedSocials = { ...defaultSocials, ...(artist.socialLinks || {}) };
      setSocials(mergedSocials);
      
      setActiveTab('create');
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePreviewArtist = () => {
      if (!name) return alert("Artist Name is required");
      
      const newId = editingArtistId || Date.now().toString();
      const slug = generateSlug(name);
      
      const galleryUrls = galleryInput
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0)
        .map(url => convertDropboxLink(url));

      // If editing, find original to preserve some fields
      const originalArtist = editingArtistId ? artists.find(a => a.id === editingArtistId) : null;

      const tempArtist: Artist = {
          id: newId,
          slug: slug,
          name,
          bio,
          photoUrl,
          genre,
          youtubeVideoId: ytId,
          spotifyArtistId: spotifyId,
          bookUrl: bookUrl,
          isPublic: originalArtist ? originalArtist.isPublic : false,
          generatedLink: `${window.location.origin}${window.location.pathname}#/artist/${slug}`,
          galleryUrls: galleryUrls,
          visitCount: originalArtist ? originalArtist.visitCount : 0,
          visitorCountries: originalArtist ? originalArtist.visitorCountries : [],
          status: originalArtist ? originalArtist.status : 'active',
          stats: {
            spotifyListeners: parseInt(spotifyListeners) || 0,
            youtubeSubscribers: parseInt(youtubeSubs) || 0,
            instagramFollowers: parseInt(instaFollowers) || 0,
            tiktokFollowers: parseInt(tiktokFollowers) || 0
          },
          topSongs: originalArtist ? originalArtist.topSongs : [],
          socialLinks: socials
      };

      setPreviewArtist(tempArtist);
  };

  const handleFinalPublish = async () => {
    if (!previewArtist) return;

    await saveArtist({...previewArtist, isPublic: true});
    const updatedArtists = await getArtists();
    setArtists(updatedArtists);
    
    // Only add to wall if it's a new artist
    if (!editingArtistId) {
        await addToWall({
            id: `wall-${previewArtist.id}`,
            type: 'artist',
            title: previewArtist.name,
            subtitle: previewArtist.genre || 'New Signing',
            imageUrl: previewArtist.photoUrl
        });
    }

    setGeneratedPublicLink(previewArtist.generatedLink || '');
    setPreviewArtist(null); 
    if (editingArtistId) {
        setEditingArtistId(null);
        alert('Artist Profile Updated Successfully');
        setActiveTab('sites');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelPreview = () => {
      setPreviewArtist(null);
  };

  const resetForm = () => {
      setEditingArtistId(null);
      setName('');
      setBio('');
      setGenre('');
      setYtId('');
      setSpotifyId('');
      setBookUrl('');
      setSpotifyListeners('');
      setYoutubeSubs('');
      setInstaFollowers('');
      setTiktokFollowers('');
      setGalleryInput('');
      setPhotoUrl('https://picsum.photos/800/800');
      setSocials({
        youtube: { url: '', isActive: false },
        instagram: { url: '', isActive: false },
        facebook: { url: '', isActive: false },
        twitter: { url: '', isActive: false },
        discord: { url: '', isActive: false },
      });
      setGeneratedPublicLink(null);
      setPreviewArtist(null);
  }

  const handleAddToWall = async () => {
      if (!dropboxLink) return alert("Please provide a Dropbox link");
      const imageUrl = convertDropboxLink(dropboxLink);
      await addToWall({
          id: `wall-drop-${Date.now()}`,
          type: 'single', 
          title: wallTitle || 'Exclusive',
          subtitle: wallSubtitle || 'Universal Orchard',
          imageUrl: imageUrl
      });
      setWallTitle('');
      setWallSubtitle('');
      setDropboxLink('');
      // Refresh list
      const items = await getWallItems();
      setExistingWallItems(items);
      alert("Photo added to the Wall successfully!");
  }

  const handleDeleteWallItem = async (id: string) => {
      if(window.confirm('Remove this photo from the public wall?')) {
          // Optimistic update: Remove from UI immediately for instant feedback
          const previousItems = [...existingWallItems];
          setExistingWallItems(prev => prev.filter(item => item.id !== id));

          const success = await deleteWallItem(id);
          if (!success) {
            // Revert if failed
            setExistingWallItems(previousItems);
            alert("Failed to delete item from database. Please check connection.");
          }
      }
  }

  const handleClearWall = async () => {
      if(window.confirm('NUCLEAR OPTION: This will drop the entire database table and recreate it. This fixes ALL ghost image issues. Are you sure?')) {
          // Optimistic update
          setExistingWallItems([]); 

          const success = await hardResetWall();
          if (success) {
            alert("Wall database has been completely reset. The page will reload.");
            window.location.reload();
          } else {
            alert("Reset failed. Check console.");
          }
      }
  }

  const handlePurgeGhosts = async () => {
      if(window.confirm('Detect and remove all corrupted/empty items from the wall?')) {
          const ghosts = existingWallItems.filter(i => !i.imageUrl || i.imageUrl === '' || !i.title);
          
          if(ghosts.length === 0) {
              return alert("No corrupted items found to purge.");
          }

          let deletedCount = 0;
          for(const g of ghosts) {
              const success = await deleteWallItem(g.id);
              if(success) deletedCount++;
          }
          
          const items = await getWallItems();
          setExistingWallItems(items);
          alert(`Purged ${deletedCount} corrupted ghost items.`);
      }
  }

  const handleSpotifyImport = async () => {
      if (!spotifyPlaylistInput) return alert("Please enter at least one Spotify URL");
      
      const urls = spotifyPlaylistInput.split('\n').map(u => u.trim()).filter(u => u.length > 0);
      if (urls.length === 0) return alert("No valid URLs found");

      setIsImporting(true);
      try {
          let totalAdded = 0;
          
          for (const url of urls) {
              try {
                  const tracks = await extractSpotifyPlaylistData(url);
                  if (tracks.length > 0) {
                      for (const track of tracks) {
                          await addToWall({
                              id: `wall-spotify-${Date.now()}-${Math.random()}`,
                              type: 'single',
                              title: track.title,
                              subtitle: track.artist,
                              imageUrl: track.imageUrl
                          });
                          totalAdded++;
                      }
                  }
              } catch (err) {
                  console.error(`Failed to import from ${url}`, err);
              }
          }

          if (totalAdded > 0) {
            const items = await getWallItems();
            setExistingWallItems(items);
            alert(`Successfully imported ${totalAdded} tracks from ${urls.length} playlist(s)!`);
          } else {
            alert("No tracks were extracted. Check the URLs or try again.");
          }

      } catch (e: any) {
          alert(`Import process failed: ${e.message}`);
      } finally {
          setIsImporting(false);
      }
  }

  // Auto SEO Logic
  const handleAutoSEO = async () => {
      setIsGeneratingSEO(true);
      try {
          // 1. Get all artist names
          const allArtists = await getArtists();
          const artistNames = allArtists.map(a => a.name);

          // 2. Call AI
          const seoData = await generateSiteSEO(artistNames);

          // 3. Update State (Do not save yet, let user review)
          setSeoTitle(seoData.title);
          setSeoDesc(seoData.description);
          setSeoKeywords(seoData.keywords);

          alert("Google SEO Optimization Generated! Please review and save.");
      } catch (e) {
          alert("Failed to generate SEO configuration.");
      } finally {
          setIsGeneratingSEO(false);
      }
  }

  const handleSaveManualSEO = async () => {
      const newSettings: SEOSettings = {
          title: seoTitle,
          description: seoDesc,
          keywords: seoKeywords,
          lastUpdated: new Date().toISOString()
      };
      
      await saveSEOSettings(newSettings);
      setSeoSettings(newSettings);
      alert("SEO Settings Saved Successfully!");
  }

  // Site Management Functions
  const handleDeleteArtist = async (id: string) => {
      if(window.confirm('Are you sure you want to delete this artist page? This cannot be undone.')) {
          await deleteArtist(id);
          const updated = await getArtists();
          setArtists(updated);
      }
  }

  const handleUpdateStatus = async (artist: Artist, newStatus: ArtistStatus) => {
      const updatedArtist = { ...artist, status: newStatus };
      await saveArtist(updatedArtist);
      const updated = await getArtists();
      setArtists(updated);
  }

  const applyEffects = async () => {
      await saveVisualEffects(tempTitleFx, tempWallFx, wallSpeed);
      setCurrentEffects({ title: tempTitleFx, wall: tempWallFx, speed: wallSpeed });
      alert("Visual Effects & Speed Applied to Public Wall");
  }

  // Login Screen
  if (!isAuthenticated) {
      return (
          <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1516280440614-6697288d5d38?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 blur-sm"></div>
              
              <div className="z-10 bg-black/80 backdrop-blur-md border border-white/20 p-8 md:p-12 max-w-md w-full text-center space-y-6 shadow-2xl">
                  <div className="mb-4">
                      <h1 className="text-3xl font-display font-bold text-white mb-2">UNIVERSAL <br/> ORCHARD</h1>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Security Gateway</p>
                  </div>
                  
                  <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest text-gray-500 block text-left">Access Key</label>
                          <div className="relative">
                            <input 
                                type="password" 
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                className={`w-full bg-black border p-4 text-center text-white tracking-[0.5em] outline-none focus:border-white transition-colors ${authError ? 'border-red-500 animate-shake' : 'border-white/20'}`}
                                placeholder="••••••••"
                            />
                            <Lock className="absolute right-4 top-4 text-gray-600" size={16}/>
                          </div>
                      </div>
                      
                      {authError && <p className="text-red-500 text-xs uppercase tracking-widest">Access Denied</p>}
                      
                      <button type="submit" className="w-full bg-white text-black font-bold uppercase tracking-widest py-4 hover:bg-gray-200 transition text-xs">
                          Authenticate
                      </button>
                  </form>

                  <div className="border-t border-white/10 pt-4">
                      <Link to="/" className="text-gray-500 hover:text-white text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition">
                          <ArrowLeft size={12} /> Return to Public Site
                      </Link>
                  </div>
              </div>
          </div>
      )
  }

  const TITLE_EFFECTS = [
      { id: '', name: 'No Effect' },
      { id: 'anim-title-cinema', name: 'Cinema Tracking' },
      { id: 'anim-title-shudder', name: 'Shudder' },
      { id: 'anim-title-gradient-flow', name: 'Gradient Flow' },
      { id: 'anim-title-3d-pop', name: '3D Pop' },
      { id: 'anim-title-blur-out', name: 'Blur Out' },
      { id: 'anim-title-squeeze', name: 'Squeeze' },
      { id: 'anim-title-swing', name: 'Swing' },
      { id: 'anim-title-elevator', name: 'Elevator' },
      { id: 'anim-title-color-cycle', name: 'Color Cycle' },
      { id: 'anim-title-mask-reveal', name: 'Mask Reveal' },
      { id: 'anim-rainbow-text', name: 'Rainbow' },
  ];

  const WALL_EFFECTS = [
      { id: '', name: 'No Effect' },
      { id: 'anim-wall-breathing', name: 'Breathing' },
      { id: 'anim-wall-kenburns', name: 'Ken Burns' },
      { id: 'anim-wall-float', name: 'Float' },
      { id: 'anim-wall-cyber-glitch', name: 'Cyber Glitch' },
      { id: 'anim-wall-sepia-dream', name: 'Sepia Dream' },
      { id: 'anim-wall-neon-border', name: 'Neon Border' },
      { id: 'anim-wall-spin-slow', name: 'Spin Slow' },
      { id: 'anim-wall-perspective-left', name: 'Perspective L' },
      { id: 'anim-wall-perspective-right', name: 'Perspective R' },
      { id: 'anim-wall-pulse-shock', name: 'Shockwave' },
      { id: 'anim-wall-bw-flash', name: 'B&W Flash' },
      { id: 'anim-wall-hue-trip', name: 'LSD Trip' },
      { id: 'anim-wall-mirror-y', name: 'Upside Down' },
      { id: 'anim-wall-shake-hard', name: 'Earthquake' },
      { id: 'anim-wall-lens-flare', name: 'Lens Flare' },
      { id: 'anim-wall-wobble-skew', name: 'Wobble Skew' },
      { id: 'anim-wall-heartbeat', name: 'Heartbeat' },
      { id: 'anim-wall-crt-flicker', name: 'CRT Flicker' },
      { id: 'anim-wall-liquid-morph', name: 'Liquid Morph' },
      { id: 'anim-wall-slide-glitch', name: 'Slide Glitch' },
      { id: 'anim-wall-rotate-3d', name: '3D Rotate' },
      // Legacy that works on walls
      { id: 'anim-pulse-glow', name: 'Pulse Glow' },
      { id: 'anim-glitch', name: 'Glitch' },
      { id: 'anim-liquid-metal', name: 'Liquid Metal' },
      { id: 'anim-invert', name: 'Invert' },
  ];

  // --- RENDER PREVIEW MODE ---
  if (previewArtist) {
      return (
          <div className="relative min-h-screen bg-black">
              {/* Preview Overlay Control Bar */}
              <div className="fixed bottom-0 left-0 w-full bg-white text-black p-4 z-[100] flex justify-between items-center shadow-xl border-t-4 border-black">
                  <div className="flex items-center gap-4">
                      <div className="animate-pulse flex items-center gap-2 text-green-600 font-bold uppercase tracking-widest text-xs">
                          <Eye size={16}/> Preview Mode
                      </div>
                      <div className="text-xs uppercase tracking-widest text-gray-600 hidden md:block">
                          Reviewing: {previewArtist.name}
                      </div>
                  </div>
                  <div className="flex gap-4">
                      <button 
                          onClick={cancelPreview} 
                          className="px-6 py-3 border border-black hover:bg-gray-200 uppercase tracking-widest text-xs font-bold transition"
                      >
                          Back to Edit
                      </button>
                      <button 
                          onClick={handleFinalPublish} 
                          className="px-8 py-3 bg-black text-white hover:bg-gray-800 uppercase tracking-widest text-xs font-bold flex items-center gap-2 transition"
                      >
                          <Globe size={14}/> {editingArtistId ? 'Update Artist' : 'Publish Web Page'}
                      </button>
                  </div>
              </div>
              
              <div className="pb-24"> 
                  <ArtistLandingPage previewData={previewArtist} />
              </div>
          </div>
      );
  }

  // --- RENDER DASHBOARD MODE ---
  return (
    <div className="min-h-screen bg-black text-white flex font-sans selection:bg-white selection:text-black">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 p-6 flex flex-col bg-black h-screen sticky top-0 justify-between">
        <div>
            <h2 className="text-2xl font-display italic font-bold text-white mb-2">UNIVERSAL <br/> ORCHARD</h2>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-12">Official</p>
            
            <nav className="space-y-4">
            <button 
                onClick={() => { setActiveTab('create'); resetForm(); }}
                className={`w-full text-left p-3 rounded-sm flex items-center gap-3 transition-all ${activeTab === 'create' ? 'bg-white text-black font-bold' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
                <Music size={18} /> New Artist Space
            </button>
            
            <button 
                onClick={() => setActiveTab('sites')}
                className={`w-full text-left p-3 rounded-sm flex items-center gap-3 transition-all ${activeTab === 'sites' ? 'bg-white text-black font-bold' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
                <Settings size={18} /> Manage Sites
            </button>

            <button 
                onClick={() => setActiveTab('wall')}
                className={`w-full text-left p-3 rounded-sm flex items-center gap-3 transition-all ${activeTab === 'wall' ? 'bg-white text-black font-bold' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
                <ImageIcon size={18} /> Wall Photos
            </button>
            
            <button 
                onClick={() => setActiveTab('animations')}
                className={`w-full text-left p-3 rounded-sm flex items-center gap-3 transition-all ${activeTab === 'animations' ? 'bg-white text-black font-bold' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
                <Sparkles size={18} /> Visual FX
            </button>

             <button 
                onClick={() => setActiveTab('seo')}
                className={`w-full text-left p-3 rounded-sm flex items-center gap-3 transition-all ${activeTab === 'seo' ? 'bg-white text-black font-bold' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
                <SearchCode size={18} /> Google SEO
            </button>

            <Link to="/" className="w-full text-left p-3 rounded-sm flex items-center gap-3 text-gray-400 hover:text-white hover:bg-white/5 mt-auto">
                <LayoutGrid size={18} /> View Public Wall
            </Link>
            </nav>
        </div>

        <div className="space-y-4">
             {/* DB Status Indicator */}
            <div className="border-t border-white/10 pt-4 space-y-4">
                <div className="flex items-center gap-3 text-xs uppercase tracking-widest">
                    <div className={`w-2 h-2 rounded-full ${dbStatus === 'connected' ? 'bg-green-500 shadow-[0_0_5px_#0f0]' : dbStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'}`}></div>
                    <span className={dbStatus === 'connected' ? 'text-white' : 'text-gray-500'}>
                        {dbStatus === 'connected' ? 'DB Connected' : dbStatus === 'checking' ? 'Checking DB...' : 'DB Offline'}
                    </span>
                </div>
                
                {/* Global Lock Switch */}
                <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-widest text-gray-400 flex items-center gap-2"><Lock size={12}/> Public Lock</span>
                    <button 
                        onClick={toggleSiteLock}
                        className={`w-10 h-5 rounded-full relative transition-colors ${isSiteLocked ? 'bg-red-600' : 'bg-gray-700'}`}
                    >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isSiteLocked ? 'left-6' : 'left-1'}`}></div>
                    </button>
                </div>
            </div>

            <button onClick={() => setIsAuthenticated(false)} className="w-full text-left p-3 rounded-sm flex items-center gap-3 text-red-500 hover:bg-red-500/10">
                <Power size={18}/> Logout
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto h-screen bg-[#050505]">
        
        {/* Manage Sites Tab */}
        {activeTab === 'sites' && (
            <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up">
                <h1 className="text-4xl font-display font-light text-white border-b border-white/10 pb-4">Manage <span className="text-gray-500 italic">Websites</span></h1>
                
                <div className="grid gap-6">
                    {artists.length === 0 ? (
                        <div className="text-gray-500 text-center py-12 uppercase tracking-widest text-xs border border-white/10 border-dashed">No Sites Generated Yet</div>
                    ) : (
                        artists.map(artist => (
                            <div key={artist.id} className="bg-white/5 border border-white/10 p-6 flex flex-col md:flex-row justify-between items-center gap-6 group hover:border-white/30 transition">
                                <div className="flex items-center gap-6 w-full">
                                    <div className="w-16 h-16 bg-gray-900 overflow-hidden rounded-full border border-white/20">
                                        <img src={artist.photoUrl} alt={artist.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition"/>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-xl font-display font-bold text-white">{artist.name}</h3>
                                            <span className={`text-[9px] px-2 py-1 uppercase tracking-widest font-bold border ${
                                                artist.status === 'active' ? 'border-green-500 text-green-500' :
                                                artist.status === 'maintenance' ? 'border-yellow-500 text-yellow-500' :
                                                artist.status === 'updating' ? 'border-blue-500 text-blue-500' :
                                                artist.status === 'suspended' ? 'border-red-500 text-red-500' :
                                                artist.status === 'editing' ? 'border-purple-500 text-purple-500' :
                                                'border-gray-500 text-gray-500'
                                            }`}>
                                                {artist.status || 'Active'}
                                            </span>
                                        </div>
                                        <Link to={`/artist/${artist.slug}`} target="_blank" className="text-xs text-gray-400 hover:text-white flex items-center gap-1">
                                            <LinkIcon size={10}/> /{artist.slug}
                                        </Link>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3 flex-wrap justify-end w-full md:w-auto">
                                    <div className="flex border border-white/10 rounded-sm overflow-hidden bg-black">
                                        <button 
                                            onClick={() => handleUpdateStatus(artist, 'active')}
                                            className={`p-2 hover:bg-white hover:text-black transition ${artist.status === 'active' || !artist.status ? 'bg-white/20 text-white' : 'text-gray-500'}`}
                                            title="Set Active"
                                        >
                                            <CheckCircle size={16}/>
                                        </button>
                                        <button 
                                            onClick={() => handleUpdateStatus(artist, 'maintenance')}
                                            className={`p-2 hover:bg-yellow-500 hover:text-black transition ${artist.status === 'maintenance' ? 'bg-yellow-500/20 text-yellow-500' : 'text-gray-500'}`}
                                            title="Set Maintenance"
                                        >
                                            <AlertTriangle size={16}/>
                                        </button>
                                        <button 
                                            onClick={() => handleUpdateStatus(artist, 'updating')}
                                            className={`p-2 hover:bg-blue-500 hover:text-white transition ${artist.status === 'updating' ? 'bg-blue-500/20 text-blue-500' : 'text-gray-500'}`}
                                            title="Set Updating"
                                        >
                                            <RefreshCw size={16}/>
                                        </button>
                                         <button 
                                            onClick={() => handleUpdateStatus(artist, 'editing')}
                                            className={`p-2 hover:bg-purple-500 hover:text-white transition ${artist.status === 'editing' ? 'bg-purple-500/20 text-purple-500' : 'text-gray-500'}`}
                                            title="Set Editing Mode"
                                        >
                                            <Edit3 size={16}/>
                                        </button>
                                        <button 
                                            onClick={() => handleUpdateStatus(artist, 'suspended')}
                                            className={`p-2 hover:bg-red-500 hover:text-white transition ${artist.status === 'suspended' ? 'bg-red-500/20 text-red-500' : 'text-gray-500'}`}
                                            title="Suspend Site"
                                        >
                                            <XCircle size={16}/>
                                        </button>
                                        <button 
                                            onClick={() => handleUpdateStatus(artist, 'unsigned')}
                                            className={`p-2 hover:bg-gray-500 hover:text-white transition ${artist.status === 'unsigned' ? 'bg-gray-500/50 text-white' : 'text-gray-500'}`}
                                            title="Mark Unsigned"
                                        >
                                            <AlertOctagon size={16}/>
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-2 ml-4">
                                        <button 
                                            onClick={() => handleEditArtist(artist)}
                                            className="bg-white text-black p-2 rounded-sm hover:bg-gray-200 transition"
                                            title="Edit Artist"
                                        >
                                            <Pencil size={16}/>
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteArtist(artist.id)}
                                            className="bg-red-900/20 border border-red-500/30 text-red-500 p-2 rounded-sm hover:bg-red-500 hover:text-white transition"
                                            title="Delete Permanently"
                                        >
                                            <Trash2 size={16}/>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        )}

        {/* Create Artist Tab */}
        {activeTab === 'create' && (
          <div className="max-w-5xl mx-auto space-y-8 animate-fade-in-up">
            
            <div className="flex justify-between items-end border-b border-white/10 pb-4">
                <h1 className="text-4xl font-display font-light text-white">
                    {editingArtistId ? 'Edit' : 'New'} <span className="text-gray-500 italic">{editingArtistId ? 'Artist Profile' : 'Candidate'}</span>
                </h1>
                <div className="flex gap-4">
                    {editingArtistId && (
                        <button onClick={resetForm} className="text-xs uppercase tracking-widest hover:text-white text-red-500">
                            Cancel Edit
                        </button>
                    )}
                    {generatedPublicLink && !editingArtistId && (
                        <button onClick={resetForm} className="text-xs uppercase tracking-widest hover:text-white text-gray-500">
                            + Create Another
                        </button>
                    )}
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              
              {/* Left Column: Core Data (8 Cols) */}
              <div className="lg:col-span-8 space-y-8">
                {/* 1. Identity */}
                <section className="space-y-6">
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                        <span className="w-2 h-2 bg-white rounded-full"></span> Identity
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2 col-span-2">
                            <label className="text-[10px] uppercase tracking-widest text-gray-600">Artist Name</label>
                            <input 
                                className="w-full bg-transparent border-b border-white/20 p-3 focus:border-white outline-none text-white text-3xl font-display placeholder-gray-800 transition-colors"
                                placeholder="ARTIST NAME"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-gray-600">Genre / Style</label>
                            <input className="w-full bg-transparent border-b border-white/20 p-2 text-sm focus:border-white outline-none" placeholder="e.g. Neoflamenco" value={genre} onChange={e => setGenre(e.target.value)} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-gray-600">Biography</label>
                        <div className="relative">
                            <textarea 
                                className="w-full bg-white/5 border border-white/10 p-4 rounded-sm focus:border-white/40 outline-none text-white h-32 text-sm leading-relaxed"
                                placeholder="Artist bio..."
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                            />
                            <button 
                                onClick={handleSearchBio}
                                disabled={isGeneratingBio}
                                className="absolute bottom-4 right-4 text-[10px] bg-white text-black px-3 py-1 rounded-sm flex items-center gap-2 hover:bg-gray-200 transition uppercase tracking-wider font-bold"
                            >
                                {isGeneratingBio ? <Loader2 className="animate-spin" size={10}/> : <Search size={10}/>} 
                                AI Auto-Bio
                            </button>
                        </div>
                    </div>
                </section>
                {/* ...Rest of create sections... */}
                 <section className="bg-white/5 border border-white/10 p-6 space-y-6">
                     <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white flex items-center gap-2">
                        <Disc size={14} className="text-green-500 animate-spin-slow"/> Discography & Media
                    </h3>
                    
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                <Music size={12}/> Spotify Artist Profile URL
                            </label>
                            <div className="relative">
                                <input 
                                    className="w-full bg-black border border-white/20 p-3 text-white focus:border-green-500 outline-none transition-colors pr-24"
                                    placeholder="https://open.spotify.com/artist/..."
                                    onChange={(e) => handleSpotifyUrlChange(e.target.value)}
                                    defaultValue={spotifyId ? `https://open.spotify.com/artist/${spotifyId}` : ''}
                                />
                                {spotifyId && <span className="absolute right-3 top-3 text-[10px] text-green-500 font-bold uppercase tracking-wider flex items-center gap-1"><Check size={10}/> Linked</span>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                <FileText size={12}/> Official Book (PDF) - Dropbox Link
                            </label>
                            <input 
                                className="w-full bg-black border border-white/20 p-3 text-sm focus:border-white outline-none text-white" 
                                placeholder="https://dropbox.com/s/..." 
                                value={bookUrl} 
                                onChange={e => setBookUrl(e.target.value)} 
                            />
                        </div>

                         <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-gray-600 flex items-center gap-2">
                                <Youtube size={12}/> Featured YouTube Video ID
                            </label>
                            <input 
                                className="w-full bg-black border border-white/20 p-3 text-sm focus:border-red-500 outline-none text-white" 
                                placeholder="Video ID (e.g. dQw4w9WgXcQ)" 
                                value={ytId} 
                                onChange={e => setYtId(e.target.value)} 
                            />
                        </div>
                    </div>
                </section>
                
                <section className="bg-white/5 border border-white/10 p-6 space-y-6">
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white flex items-center gap-2">
                        <Globe size={14} className="text-blue-500"/> Social Media Hub
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { id: 'youtube', icon: Youtube, label: 'YouTube' },
                            { id: 'instagram', icon: Instagram, label: 'Instagram' },
                            { id: 'facebook', icon: Facebook, label: 'Facebook' },
                            { id: 'twitter', icon: Twitter, label: 'X (Twitter)' },
                            { id: 'discord', icon: MessageCircle, label: 'Discord' },
                        ].map((platform) => {
                            const pKey = platform.id as keyof SocialLinks;
                            return (
                                <div key={platform.id} className="bg-black border border-white/10 p-3 flex items-center gap-3">
                                    <platform.icon size={16} className="text-gray-400"/>
                                    <div className="flex-1">
                                        <input 
                                            className="w-full bg-transparent text-xs text-white outline-none placeholder-gray-700"
                                            placeholder={`${platform.label} URL`}
                                            value={socials[pKey]?.url || ''}
                                            onChange={(e) => handleSocialChange(pKey, 'url', e.target.value)}
                                        />
                                    </div>
                                    <div className="border-l border-white/10 pl-3">
                                        <input 
                                            type="checkbox"
                                            checked={socials[pKey]?.isActive || false}
                                            onChange={(e) => handleSocialChange(pKey, 'isActive', e.target.checked)}
                                            className="w-4 h-4 accent-green-500 cursor-pointer"
                                            title="Show on profile"
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </section>

                <section className="bg-white/5 border border-white/10 p-6 space-y-6">
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white flex items-center gap-2">
                        <BarChart3 size={14} className="text-white"/> Real-Time Analytics Input
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-gray-500 flex items-center gap-2"><Music size={10}/> Spotify Monthly Listeners</label>
                            <input 
                                type="number"
                                className="w-full bg-black border border-white/20 p-3 text-white focus:border-green-500 outline-none font-mono"
                                placeholder="0"
                                value={spotifyListeners}
                                onChange={(e) => setSpotifyListeners(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-gray-500 flex items-center gap-2"><Youtube size={10}/> YouTube Subscribers</label>
                            <input 
                                type="number"
                                className="w-full bg-black border border-white/20 p-3 text-white focus:border-red-500 outline-none font-mono"
                                placeholder="0"
                                value={youtubeSubs}
                                onChange={(e) => setYoutubeSubs(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-gray-500 flex items-center gap-2"><Instagram size={10}/> Instagram Followers</label>
                            <input 
                                type="number"
                                className="w-full bg-black border border-white/20 p-3 text-white focus:border-pink-500 outline-none font-mono"
                                placeholder="0"
                                value={instaFollowers}
                                onChange={(e) => setInstaFollowers(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-gray-500 flex items-center gap-2"><Music size={10} className="rotate-45"/> TikTok Followers</label>
                            <input 
                                type="number"
                                className="w-full bg-black border border-white/20 p-3 text-white focus:border-blue-500 outline-none font-mono"
                                placeholder="0"
                                value={tiktokFollowers}
                                onChange={(e) => setTiktokFollowers(e.target.value)}
                            />
                        </div>
                    </div>
                </section>
              </div>

              {/* Right Column: Visuals (4 Cols) */}
              <div className="lg:col-span-4 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-gray-500">Official Press Shot</label>
                  <div className="relative group aspect-[3/4] bg-gray-900 overflow-hidden border border-white/10">
                    <img src={photoUrl} alt="Preview" className="w-full h-full object-cover grayscale" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <button onClick={() => fileInputRef.current?.click()} className="bg-white text-black px-6 py-3 font-bold flex items-center gap-2 hover:scale-105 transition uppercase text-xs tracking-wider">
                            <Camera size={14} /> Upload RAW
                        </button>
                    </div>
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleImageUpload} accept="image/*" />
                  
                  <div className="mt-4 space-y-2">
                      <label className="text-[10px] uppercase text-gray-600 block">Dropbox Asset Link (Main)</label>
                      <input 
                        className="w-full bg-black border border-white/10 p-2 text-xs focus:border-white outline-none text-white" 
                        placeholder="https://dropbox.com/..."
                        onChange={(e) => handleDropboxImageForArtist(e.target.value)}
                        value={photoUrl.includes('dropbox') ? photoUrl : ''}
                      />
                  </div>
                </div>

                {/* Gallery / Book Section Input */}
                <div className="bg-white/5 p-6 border border-white/10 space-y-4">
                    <div className="flex items-center gap-2 text-white">
                        <Images size={14} />
                        <span className="font-bold text-xs uppercase tracking-wider">Book Gallery (Dropbox)</span>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[9px] text-gray-500 uppercase tracking-widest">Paste one Link per line</label>
                        <textarea 
                            className="w-full bg-black border border-white/20 p-3 text-xs focus:border-white outline-none font-mono h-24"
                            placeholder={"https://dropbox.com/photo1.jpg\nhttps://dropbox.com/photo2.jpg"}
                            value={galleryInput}
                            onChange={(e) => setGalleryInput(e.target.value)}
                        />
                    </div>
                </div>

                <div className="bg-white/5 p-6 border border-white/10 space-y-4">
                    <div className="flex items-center gap-2 text-white">
                        <Wand2 size={14} />
                        <span className="font-bold text-xs uppercase tracking-wider">Gemini Image FX</span>
                    </div>
                    <div className="flex flex-col gap-2">
                        <input 
                            className="w-full bg-black border border-white/20 p-3 text-xs focus:border-white outline-none"
                            placeholder="Prompt: 'Cyberpunk style'..."
                            value={editPrompt}
                            onChange={(e) => setEditPrompt(e.target.value)}
                        />
                        <button 
                            onClick={handleAiImageEdit}
                            disabled={isEditingImage}
                            className="w-full bg-white text-black p-3 font-bold hover:bg-gray-200 disabled:opacity-50 uppercase tracking-wider text-[10px]"
                        >
                            {isEditingImage ? <Loader2 className="animate-spin mx-auto" size={14} /> : 'Process Vibe'}
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-4 mt-8">
                     <button onClick={handlePreviewArtist} className="w-full bg-white text-black text-lg py-5 font-bold hover:bg-gray-200 transition uppercase tracking-widest flex items-center justify-center gap-2">
                        <Eye size={20}/> {editingArtistId ? 'Update & Preview' : 'Preview Profile'}
                    </button>
                    <button onClick={resetForm} className="w-full bg-transparent border border-white/20 text-gray-500 py-3 text-xs hover:text-white hover:border-white transition uppercase tracking-widest">
                        Clear Form
                    </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SEO AUTO ENGINE */}
        {activeTab === 'seo' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
                 <h1 className="text-4xl font-display font-light text-white border-b border-white/10 pb-4">Search <span className="text-gray-500 italic">Engine Optimization</span></h1>
                 
                 {/* 1. Generator Control */}
                 <div className="bg-green-900/10 border border-green-500/20 p-8 space-y-6 relative overflow-hidden">
                     <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                        <div>
                             <h3 className="text-lg font-bold uppercase tracking-widest text-green-400 flex items-center gap-2">
                                <SearchCode size={20}/> Automatic Indexing Engine
                             </h3>
                             <p className="text-xs text-gray-400 mt-2 max-w-lg">
                                This tool uses AI to analyze your entire artist roster and generate the perfect metadata. Click generate to populate the fields below, then review and save.
                             </p>
                        </div>
                        <button 
                            onClick={handleAutoSEO}
                            disabled={isGeneratingSEO}
                            className="bg-green-600 hover:bg-green-500 text-white px-8 py-4 font-bold uppercase tracking-widest text-xs flex items-center gap-2 disabled:opacity-50 transition shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                        >
                            {isGeneratingSEO ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16}/>}
                            {isGeneratingSEO ? 'AI IS OPTIMIZING...' : 'GENERATE AUTO-SEO'}
                        </button>
                     </div>
                 </div>

                 {/* 2. Manual Editing Form */}
                 <div className="bg-white/5 border border-white/10 p-8 space-y-6">
                     <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                         <h3 className="text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2">
                             <MousePointerClick size={14}/> Site Metadata Control
                         </h3>
                         {seoSettings?.lastUpdated && (
                             <span className="text-[10px] text-gray-500 uppercase tracking-widest">Last Updated: {new Date(seoSettings.lastUpdated).toLocaleDateString()}</span>
                         )}
                     </div>

                     <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-gray-500">Page Title (Browser Tab)</label>
                            <input 
                                className="w-full bg-black border border-white/20 p-3 text-white focus:border-green-500 outline-none transition-colors"
                                value={seoTitle}
                                onChange={(e) => setSeoTitle(e.target.value)}
                                placeholder="e.g. Universal Orchard Music | Global Icons"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-gray-500">Meta Description (Google Snippet)</label>
                            <textarea 
                                className="w-full bg-black border border-white/20 p-3 text-white focus:border-green-500 outline-none h-24"
                                value={seoDesc}
                                onChange={(e) => setSeoDesc(e.target.value)}
                                placeholder="A brief description of the label and roster..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-gray-500">Meta Keywords (Comma Separated)</label>
                            <textarea 
                                className="w-full bg-black border border-white/20 p-3 text-white focus:border-green-500 outline-none h-24 font-mono text-xs"
                                value={seoKeywords}
                                onChange={(e) => setSeoKeywords(e.target.value)}
                                placeholder="music, latin, pop, flamenco, urban..."
                            />
                        </div>

                        <button 
                            onClick={handleSaveManualSEO}
                            className="w-full bg-white text-black p-4 font-bold uppercase tracking-widest hover:bg-gray-200 transition flex justify-center items-center gap-2"
                        >
                            <Save size={16}/> Save SEO Configuration
                        </button>
                     </div>
                 </div>
            </div>
        )}

        {/* Wall Photos Tab */}
        {activeTab === 'wall' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
                <div className="flex flex-col md:flex-row justify-between items-end border-b border-white/10 pb-4 gap-4">
                     <div>
                        <h1 className="text-4xl font-display font-light text-white">Wall <span className="text-gray-500 italic">Visuals</span></h1>
                        <p className="text-xs text-gray-500 mt-2">Manage the infinite scroll wall content.</p>
                     </div>
                     
                     <div className="flex items-center gap-3">
                         <button 
                            onClick={handlePurgeGhosts} 
                            className="bg-orange-500/10 border border-orange-500/50 text-orange-500 hover:bg-orange-500 hover:text-white px-4 py-2 text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all"
                        >
                            <Ghost size={14}/> Purge Broken
                        </button>
                        <button 
                            onClick={handleClearWall} 
                            className="bg-red-600 text-white hover:bg-red-700 px-6 py-2 text-[10px] uppercase tracking-widest font-bold flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(220,38,38,0.5)]"
                        >
                            <Trash2 size={14}/> ERASE ALL IMAGES
                        </button>
                     </div>
                </div>
                
                {/* AI Import Section - NEW */}
                <div className="bg-green-900/20 border border-green-500/30 p-8 space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Music size={100} /></div>
                    
                    <div className="flex items-start justify-between relative z-10">
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-widest text-green-400 flex items-center gap-2 relative z-10">
                                <Sparkles size={14}/> AI Spotify Batch Importer
                            </h3>
                            <p className="text-[10px] text-gray-400 max-w-md mt-1">
                                Paste multiple Spotify Playlist URLs (one per line). The AI will extract tracklists and find high-quality covers.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 relative z-10 mt-4">
                         <div className="flex-1 space-y-2">
                            <label className="text-[9px] uppercase tracking-widest text-gray-500 flex items-center gap-2"><ListPlus size={10}/> Playlist URLs (One per line)</label>
                            <textarea 
                                className="w-full bg-black border border-green-500/30 p-3 text-white text-xs focus:border-green-500 outline-none h-32 font-mono leading-relaxed"
                                value={spotifyPlaylistInput}
                                onChange={(e) => setSpotifyPlaylistInput(e.target.value)}
                                placeholder="https://open.spotify.com/playlist/..."
                            />
                         </div>
                         <button 
                            onClick={handleSpotifyImport}
                            disabled={isImporting}
                            className="bg-green-600 text-white p-4 font-bold uppercase tracking-widest hover:bg-green-500 transition text-xs flex items-center justify-center gap-2 disabled:opacity-50 w-full"
                         >
                             {isImporting ? <Loader2 className="animate-spin" size={14}/> : <Radio size={14}/>}
                             {isImporting ? 'Processing Batch Import...' : 'Run Batch Import'}
                         </button>
                    </div>
                </div>

                {/* Add New Manual Section */}
                <div className="bg-white/5 p-8 border border-white/10 space-y-6">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2">
                         <Upload size={14}/> Add Manual Item
                    </h3>
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-gray-500 flex items-center gap-2">
                            <LinkIcon size={14}/> Dropbox Image Link
                        </label>
                        <input 
                            className="w-full bg-black border border-white/20 p-4 text-white focus:border-white outline-none transition-colors"
                            placeholder="https://www.dropbox.com/s/xyz/photo.jpg?dl=0"
                            value={dropboxLink}
                            onChange={(e) => setDropboxLink(e.target.value)}
                        />
                        <p className="text-[10px] text-gray-500">Link will be automatically converted for direct viewing.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest text-gray-500">Title / Artist</label>
                            <input 
                                className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none"
                                placeholder="e.g. Backstage"
                                value={wallTitle}
                                onChange={(e) => setWallTitle(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest text-gray-500">Subtitle</label>
                            <input 
                                className="w-full bg-black border border-white/20 p-3 text-white focus:border-white outline-none"
                                placeholder="e.g. Latin Grammy 2024"
                                value={wallSubtitle}
                                onChange={(e) => setWallSubtitle(e.target.value)}
                            />
                        </div>
                    </div>

                    <button 
                        onClick={handleAddToWall}
                        className="w-full bg-white text-black p-4 font-bold uppercase tracking-widest hover:bg-gray-200 transition mt-4"
                    >
                        Upload to Infinite Wall
                    </button>
                </div>

                {/* Manage Existing Section */}
                <div className="pt-8">
                     <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
                         <Monitor size={14}/> Manage Active Wall ({existingWallItems.length} items)
                     </h3>
                     
                     {existingWallItems.length === 0 ? (
                         <div className="border border-white/10 border-dashed p-8 text-center text-gray-500 uppercase tracking-widest text-xs">
                             Wall is currently empty. Upload images via Spotify Import or Manually.
                         </div>
                     ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {existingWallItems.map(item => (
                                <div key={item.id} className="group relative border border-white/10 bg-black aspect-square overflow-hidden hover:border-red-500/50 transition-colors">
                                    {item.imageUrl ? (
                                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition duration-500"/>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-red-500 p-4 text-center bg-red-900/10">
                                            <AlertTriangle size={24} className="mb-2"/>
                                            <span className="text-[9px] uppercase tracking-widest font-bold">Corrupted Data</span>
                                        </div>
                                    )}
                                    
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex flex-col justify-end p-3 pointer-events-none">
                                        <p className="text-xs font-bold truncate text-white">{item.title || 'Untitled'}</p>
                                        <p className="text-[9px] text-gray-400 uppercase tracking-widest truncate">{item.subtitle}</p>
                                    </div>

                                    <button 
                                        onClick={(e) => { 
                                            e.preventDefault(); 
                                            e.stopPropagation(); 
                                            handleDeleteWallItem(item.id); 
                                        }}
                                        className={`absolute top-2 right-2 z-50 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition transform hover:scale-110 cursor-pointer shadow-xl ${item.imageUrl ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}
                                        title="Delete Image"
                                    >
                                        <Trash2 size={14}/>
                                    </button>
                                </div>
                            ))}
                        </div>
                     )}
                </div>
            </div>
        )}

        {/* FX Tab */}
        {activeTab === 'animations' && (
             <div className="max-w-6xl mx-auto space-y-12 animate-fade-in-up">
                 <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <h1 className="text-4xl font-display font-light text-white">Visual <span className="text-gray-500 italic">FX</span></h1>
                    <button onClick={applyEffects} className="bg-white text-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition flex items-center gap-2"><Play size={14} fill="black" /> Apply To Live Site</button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Title FX Section */}
                    <div className="space-y-6">
                        <div className="flex justify-between items-center border-b border-white/10 pb-2">
                             <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Global Title Animation</h3>
                             <span className="text-[9px] uppercase tracking-widest text-green-500 flex items-center gap-1"><Zap size={10}/> Active: {TITLE_EFFECTS.find(e => e.id === currentEffects.title)?.name || 'None'}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {TITLE_EFFECTS.map(fx => (
                                <button
                                    key={fx.id}
                                    onClick={() => setTempTitleFx(fx.id)}
                                    className={`p-4 text-xs font-bold uppercase tracking-wider border transition-all relative overflow-hidden group text-left flex items-center justify-between ${
                                        tempTitleFx === fx.id 
                                        ? 'bg-white text-black border-white' 
                                        : 'bg-black text-gray-400 border-white/10 hover:border-white/50'
                                    }`}
                                >
                                    <span className="relative z-10">{fx.name}</span>
                                    {tempTitleFx === fx.id && <Check size={12}/>}
                                </button>
                            ))}
                        </div>
                        <div className="mt-8 bg-black border border-white/20 p-8 text-center min-h-[150px] flex items-center justify-center relative overflow-hidden">
                            <div className="absolute top-2 left-2 text-[9px] text-gray-600 uppercase tracking-widest">Preview Window</div>
                            <div>
                                <h1 className={`text-4xl font-display font-bold ${tempTitleFx}`}>
                                    UNIVERSAL <br/> <span className="italic font-light">ORCHARD</span>
                                </h1>
                            </div>
                        </div>
                    </div>

                    {/* Wall FX Section */}
                    <div className="space-y-6">
                        <div className="flex justify-between items-center border-b border-white/10 pb-2">
                             <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Infinite Wall Animation</h3>
                             <span className="text-[9px] uppercase tracking-widest text-green-500 flex items-center gap-1"><Zap size={10}/> Active: {WALL_EFFECTS.find(e => e.id === currentEffects.wall)?.name || 'None'}</span>
                        </div>

                        {/* Speed Control */}
                        <div className="bg-white/5 border border-white/10 p-6 space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2"><Gauge size={14}/> Scroll Speed</label>
                                <span className="text-xs font-mono text-white">{wallSpeed}s (Loop Duration)</span>
                            </div>
                            <input 
                                type="range" 
                                min="10" 
                                max="120" 
                                step="5"
                                value={wallSpeed}
                                onChange={(e) => setWallSpeed(parseInt(e.target.value))}
                                className="w-full accent-white cursor-pointer h-1 bg-gray-700 rounded-lg appearance-none"
                            />
                            <div className="flex justify-between text-[9px] text-gray-500 uppercase tracking-widest">
                                <span>Fast (10s)</span>
                                <span>Slow (120s)</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
                            {WALL_EFFECTS.map(fx => (
                                <button
                                    key={fx.id}
                                    onClick={() => setTempWallFx(fx.id)}
                                     className={`p-4 text-xs font-bold uppercase tracking-wider border transition-all text-left flex items-center justify-between ${
                                        tempWallFx === fx.id 
                                        ? 'bg-white text-black border-white' 
                                        : 'bg-black text-gray-400 border-white/10 hover:border-white/50'
                                    }`}
                                >
                                    {fx.name}
                                    {tempWallFx === fx.id && <Check size={12}/>}
                                </button>
                            ))}
                        </div>
                        <div className="mt-8 bg-black border border-white/20 p-4 min-h-[250px] relative overflow-hidden flex items-center justify-center">
                             <div className="absolute top-2 left-2 text-[9px] text-gray-600 uppercase tracking-widest z-10">Preview Window</div>
                             <div className="w-48 h-64 bg-gray-900 relative">
                                 <img 
                                    src="https://picsum.photos/400/500?grayscale" 
                                    className={`w-full h-full object-cover ${tempWallFx}`}
                                    alt="Preview"
                                 />
                                 <div className="absolute bottom-0 left-0 w-full p-2 bg-black/50 backdrop-blur-sm text-center">
                                     <span className="text-[10px] text-white uppercase tracking-widest">Effect: {WALL_EFFECTS.find(e => e.id === tempWallFx)?.name}</span>
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>
             </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;