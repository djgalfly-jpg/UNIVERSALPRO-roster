import React, { useState, useRef, useEffect } from 'react';
import { Artist, WallItem } from '../types';
import { getArtists, saveArtist, addToWall, convertDropboxLink, getVisualEffects, saveVisualEffects } from '../services/store';
import { searchArtistBio, editArtistImage } from '../services/geminiService';
import { Link } from 'react-router-dom';
import { Camera, Wand2, Search, Link as LinkIcon, Upload, Music, Loader2, Sparkles, LayoutGrid, Image as ImageIcon, CheckCircle, BarChart3, Youtube, Instagram, Twitter, Copy, Check, Eye, Globe, Images, Monitor, Type, Save, Disc, FileText } from 'lucide-react';
import ArtistLandingPage from './ArtistLandingPage';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'wall' | 'animations'>('create');
  const [artists, setArtists] = useState<Artist[]>(getArtists());
  
  // FX State
  const [currentEffects, setCurrentEffects] = useState(getVisualEffects());
  const [targetFx, setTargetFx] = useState<'title' | 'wall'>('title'); // Which one are we editing?
  const [tempTitleFx, setTempTitleFx] = useState(currentEffects.title);
  const [tempWallFx, setTempWallFx] = useState(currentEffects.wall);
  
  // Artist Form State
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [photoUrl, setPhotoUrl] = useState('https://picsum.photos/800/800');
  const [genre, setGenre] = useState('');
  const [ytId, setYtId] = useState('');
  const [spotifyId, setSpotifyId] = useState('');
  const [bookUrl, setBookUrl] = useState('');
  
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
  
  // AI States
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
      // Allow artists to also use dropbox links
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

  // Helper to extract Spotify ID from full URL
  const handleSpotifyUrlChange = (val: string) => {
      let extractedId = val.trim();
      
      try {
          // Handle standard URL: https://open.spotify.com/artist/7ltDVBr6mKbRvohxheJ9h1?si=...
          // Also handles international URLs like https://open.spotify.com/intl-es/artist/...
          if (extractedId.includes('/artist/')) {
              const parts = extractedId.split('/artist/');
              if (parts.length > 1) {
                  // Take everything after /artist/ and split by ? (query params) or / (trailing slash or subpaths)
                  extractedId = parts[1].split(/[?\/]/)[0];
              }
          }
          // Handle URI: spotify:artist:7ltDVBr6mKbRvohxheJ9h1
          else if (extractedId.includes('spotify:artist:')) {
              extractedId = extractedId.split(':')[2];
          }
      } catch (e) {
          console.error("Error parsing Spotify URL", e);
          // Fallback: If parsing fails, leave it as is, though it likely won't work in iframe if it's a full URL
      }
      
      setSpotifyId(extractedId);
  }

  // Helper to generate friendly slug
  const generateSlug = (artistName: string) => {
      return artistName
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
  };

  const handlePreviewArtist = () => {
      if (!name) return alert("Artist Name is required");
      
      const newId = Date.now().toString();
      const slug = generateSlug(name);
      
      // Parse Gallery Input
      const galleryUrls = galleryInput
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0)
        .map(url => convertDropboxLink(url));

      // Temporary object for preview
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
          isPublic: false,
          generatedLink: `${window.location.origin}${window.location.pathname}#/artist/${slug}`,
          galleryUrls: galleryUrls,
          visitCount: 0,
          visitorCountries: [],
          stats: {
            spotifyListeners: parseInt(spotifyListeners) || 0,
            youtubeSubscribers: parseInt(youtubeSubs) || 0,
            instagramFollowers: parseInt(instaFollowers) || 0,
            tiktokFollowers: parseInt(tiktokFollowers) || 0
          },
          topSongs: []
      };

      setPreviewArtist(tempArtist);
  };

  const handleFinalPublish = () => {
    if (!previewArtist) return;

    // Save to store
    saveArtist({...previewArtist, isPublic: true});
    setArtists(getArtists());
    
    // Add to Wall
    addToWall({
        id: `wall-${previewArtist.id}`,
        type: 'artist',
        title: previewArtist.name,
        subtitle: previewArtist.genre || 'New Signing',
        imageUrl: previewArtist.photoUrl
    });

    // Show Success & Link
    setGeneratedPublicLink(previewArtist.generatedLink || '');
    setPreviewArtist(null); // Exit preview mode
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelPreview = () => {
      setPreviewArtist(null);
  };

  const copyToClipboard = () => {
      if (generatedPublicLink) {
          navigator.clipboard.writeText(generatedPublicLink);
          setJustCopied(true);
          setTimeout(() => setJustCopied(false), 2000);
      }
  }

  const resetForm = () => {
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
      setGeneratedPublicLink(null);
      setPreviewArtist(null);
  }

  const handleAddToWall = () => {
      if (!dropboxLink) return alert("Please provide a Dropbox link");
      
      const imageUrl = convertDropboxLink(dropboxLink);
      
      addToWall({
          id: `wall-drop-${Date.now()}`,
          type: 'single', // Generic type for wall upload
          title: wallTitle || 'Exclusive',
          subtitle: wallSubtitle || 'Universal Orchard',
          imageUrl: imageUrl
      });
      
      setWallTitle('');
      setWallSubtitle('');
      setDropboxLink('');
      alert("Photo added to the Wall successfully!");
  }

  // FX Management
  const selectEffect = (effectClass: string) => {
      if (targetFx === 'title') {
          setTempTitleFx(effectClass);
      } else {
          setTempWallFx(effectClass);
      }
  }

  const applyEffects = () => {
      saveVisualEffects(tempTitleFx, tempWallFx);
      setCurrentEffects({ title: tempTitleFx, wall: tempWallFx });
      alert("Visual Effects Applied to Public Wall");
  }

  const FX_LIST = [
      { id: '', name: 'None' },
      // Original List
      { id: 'anim-pulse-glow', name: 'Pulse Glow' },
      { id: 'anim-glitch', name: 'Glitch' },
      { id: 'anim-neon', name: 'Neon Flicker' },
      { id: 'anim-rainbow-text', name: 'Rainbow' },
      { id: 'anim-liquid-metal', name: 'Liquid Metal' },
      { id: 'anim-wobble', name: 'Wobble' },
      { id: 'anim-hue-cycle', name: 'Hue Cycle' },
      { id: 'anim-blur-in', name: 'Blur Pulse' },
      { id: 'anim-scanline', name: 'Scanline' },
      { id: 'anim-border-flash', name: 'Flash Border' },
      { id: 'anim-mirror', name: 'Mirror' },
      { id: 'anim-invert', name: 'Invert' },
      { id: 'anim-sepia', name: 'Sepia Old' },
      { id: 'anim-ghost', name: 'Ghosting' },
      { id: 'anim-jiggle', name: 'Jiggle' },
      
      // New Title Effects
      { id: 'anim-title-cinema', name: 'Title: Cinema' },
      { id: 'anim-title-shudder', name: 'Title: Shudder' },
      { id: 'anim-title-gradient-flow', name: 'Title: Flow' },
      { id: 'anim-title-3d-pop', name: 'Title: 3D Pop' },
      { id: 'anim-title-blur-out', name: 'Title: Blur Out' },
      { id: 'anim-title-squeeze', name: 'Title: Squeeze' },
      { id: 'anim-title-swing', name: 'Title: Swing' },
      { id: 'anim-title-elevator', name: 'Title: Elevator' },
      { id: 'anim-title-color-cycle', name: 'Title: Colors' },
      { id: 'anim-title-mask-reveal', name: 'Title: Reveal' },

      // New Wall Effects
      { id: 'anim-wall-breathing', name: 'Wall: Breathing' },
      { id: 'anim-wall-kenburns', name: 'Wall: Ken Burns' },
      { id: 'anim-wall-float', name: 'Wall: Float' },
      { id: 'anim-wall-cyber-glitch', name: 'Wall: Cyber' },
      { id: 'anim-wall-sepia-dream', name: 'Wall: Sepia' },
      { id: 'anim-wall-neon-border', name: 'Wall: Neon' },
      { id: 'anim-wall-spin-slow', name: 'Wall: Spin' },
      { id: 'anim-wall-perspective-left', name: 'Wall: 3D Left' },
      { id: 'anim-wall-perspective-right', name: 'Wall: 3D Right' },
      { id: 'anim-wall-pulse-shock', name: 'Wall: Shockwave' },
      { id: 'anim-wall-bw-flash', name: 'Wall: Flash B&W' },
      { id: 'anim-wall-hue-trip', name: 'Wall: LSD' },
      { id: 'anim-wall-mirror-y', name: 'Wall: Upside Down' },
      { id: 'anim-wall-shake-hard', name: 'Wall: Quake' },
      { id: 'anim-wall-lens-flare', name: 'Wall: Flare' },
      { id: 'anim-wall-wobble-skew', name: 'Wall: Skew' },
      { id: 'anim-wall-heartbeat', name: 'Wall: Heartbeat' },
      { id: 'anim-wall-crt-flicker', name: 'Wall: CRT' },
      { id: 'anim-wall-liquid-morph', name: 'Wall: Liquid' },
      { id: 'anim-wall-slide-glitch', name: 'Wall: Slider' },
      { id: 'anim-wall-rotate-3d', name: 'Wall: 3D Spin' },
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
                          <Globe size={14}/> Publish Web Page
                      </button>
                  </div>
              </div>
              
              {/* The Actual Landing Page Component */}
              <div className="pb-24"> {/* Padding for control bar */}
                  <ArtistLandingPage previewData={previewArtist} />
              </div>
          </div>
      );
  }

  // --- RENDER DASHBOARD MODE ---
  return (
    <div className="min-h-screen bg-black text-white flex font-sans selection:bg-white selection:text-black">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 p-6 flex flex-col bg-black h-screen sticky top-0">
        <h2 className="text-2xl font-display italic font-bold text-white mb-2">UNIVERSAL <br/> ORCHARD</h2>
        <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-12">Official</p>
        
        <nav className="space-y-4">
          <button 
            onClick={() => setActiveTab('create')}
            className={`w-full text-left p-3 rounded-sm flex items-center gap-3 transition-all ${activeTab === 'create' ? 'bg-white text-black font-bold' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <Music size={18} /> Roster Manager
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

          <Link to="/" className="w-full text-left p-3 rounded-sm flex items-center gap-3 text-gray-400 hover:text-white hover:bg-white/5 mt-auto">
             <LayoutGrid size={18} /> View Public Wall
          </Link>
        </nav>
        
        <div className="mt-8 pt-8 border-t border-white/10 text-[10px] text-gray-600 uppercase tracking-widest leading-relaxed">
            All rights reserved, Universal Music Publishing, and its producers, Latin Grammy members, GalFly, and KRYLIN.
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto h-screen bg-[#050505]">
        
        {/* Create Artist Tab */}
        {activeTab === 'create' && (
          <div className="max-w-5xl mx-auto space-y-8 animate-fade-in-up">
            
            <div className="flex justify-between items-end border-b border-white/10 pb-4">
                <h1 className="text-4xl font-display font-light text-white">New <span className="text-gray-500 italic">Candidate</span></h1>
                {generatedPublicLink && (
                    <button onClick={resetForm} className="text-xs uppercase tracking-widest hover:text-white text-gray-500">
                        + Create Another
                    </button>
                )}
            </div>

            {/* Success / Link Generation Modal Area */}
            {generatedPublicLink && (
                <div className="bg-green-500/10 border border-green-500/50 p-6 rounded-sm flex flex-col md:flex-row items-center justify-between gap-6 animate-pulse-glow">
                    <div className="space-y-1">
                        <h3 className="text-green-400 font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                            <CheckCircle size={16}/> Landing Page Created Successfully
                        </h3>
                        <p className="text-xs text-gray-400">The artist has been added to the public roster.</p>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <input 
                            readOnly 
                            value={generatedPublicLink} 
                            className="bg-black border border-white/10 p-3 text-xs text-gray-300 w-full md:w-80 outline-none select-all font-mono"
                        />
                        <button 
                            onClick={copyToClipboard}
                            className="bg-white text-black p-3 hover:bg-gray-200 transition flex items-center gap-2 uppercase font-bold text-xs whitespace-nowrap"
                        >
                            {justCopied ? <Check size={14}/> : <Copy size={14}/>}
                            {justCopied ? 'Copied' : 'Copy Link'}
                        </button>
                    </div>
                    <Link to={generatedPublicLink.replace(window.location.origin + window.location.pathname + '#', '')} target="_blank" className="text-xs uppercase underline hover:text-white text-gray-400">
                        Preview Page
                    </Link>
                </div>
            )}
            
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

                {/* 2. Discography & Media - NEW SECTION */}
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
                                />
                                {spotifyId && <span className="absolute right-3 top-3 text-[10px] text-green-500 font-bold uppercase tracking-wider flex items-center gap-1"><Check size={10}/> Linked</span>}
                            </div>
                            <p className="text-[9px] text-gray-500">Paste the full Spotify Artist URL. We will automatically index their full discography.</p>
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
                            <p className="text-[9px] text-gray-500">Provide the Dropbox link for the artist's PDF Book/Presentation.</p>
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
                            <p className="text-[9px] text-gray-500">The video ID from the YouTube watch URL.</p>
                        </div>
                    </div>
                </section>

                {/* 3. Live Analytics */}
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

                <button onClick={handlePreviewArtist} className="w-full bg-white text-black text-lg py-5 font-bold hover:bg-gray-200 transition uppercase tracking-widest mt-8 flex items-center justify-center gap-2">
                   <Eye size={20}/> Publish to Go (Preview)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Wall Photos Tab */}
        {activeTab === 'wall' && (
            <div className="max-w-2xl mx-auto space-y-8 animate-fade-in-up">
                <h1 className="text-4xl font-display font-light text-white border-b border-white/10 pb-4">Add Wall <span className="text-gray-500 italic">Visuals</span></h1>
                
                <div className="bg-white/5 p-8 border border-white/10 space-y-6">
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
            </div>
        )}
        
        {/* Animations Tab - UPDATED */}
        {activeTab === 'animations' && (
          <div className="max-w-6xl mx-auto animate-fade-in-up relative h-full flex flex-col">
             <div className="flex justify-between items-end border-b border-white/10 pb-4 mb-8">
                 <div>
                    <h1 className="text-4xl font-display font-light text-white">Visual FX <span className="text-gray-500 italic">Engine</span></h1>
                    <p className="text-gray-500 text-sm mt-2">Configure separate effects for the main title and the wall visuals.</p>
                 </div>
                 <button 
                    onClick={applyEffects}
                    className="bg-white text-black px-8 py-3 font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-green-400 hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                 >
                    <Save size={18}/> Apply All Effects
                 </button>
             </div>
             
             {/* Target Selector */}
             <div className="flex gap-4 mb-8">
                <button 
                    onClick={() => setTargetFx('title')}
                    className={`flex-1 p-6 border flex items-center justify-between transition-all group ${targetFx === 'title' ? 'bg-white text-black border-white' : 'bg-black text-gray-400 border-white/10 hover:border-white/50'}`}
                >
                    <div className="flex items-center gap-4">
                        <Type size={24} />
                        <div className="text-left">
                            <div className="text-xs uppercase tracking-widest font-bold">Edit Title FX</div>
                            <div className="text-sm opacity-60">Main Header Text</div>
                        </div>
                    </div>
                    <div className="text-xs font-mono uppercase border px-2 py-1 rounded-sm border-current opacity-70">
                        {tempTitleFx ? tempTitleFx.replace('anim-', '') : 'None'}
                    </div>
                </button>

                <button 
                    onClick={() => setTargetFx('wall')}
                    className={`flex-1 p-6 border flex items-center justify-between transition-all group ${targetFx === 'wall' ? 'bg-white text-black border-white' : 'bg-black text-gray-400 border-white/10 hover:border-white/50'}`}
                >
                     <div className="flex items-center gap-4">
                        <Monitor size={24} />
                        <div className="text-left">
                            <div className="text-xs uppercase tracking-widest font-bold">Edit Wall Photos FX</div>
                            <div className="text-sm opacity-60">Infinite Grid Images</div>
                        </div>
                    </div>
                    <div className="text-xs font-mono uppercase border px-2 py-1 rounded-sm border-current opacity-70">
                        {tempWallFx ? tempWallFx.replace('anim-', '') : 'None'}
                    </div>
                </button>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 overflow-y-auto pb-12">
                {FX_LIST.map((fx) => {
                    const isSelected = targetFx === 'title' ? tempTitleFx === fx.id : tempWallFx === fx.id;
                    
                    return (
                        <div 
                            key={fx.id}
                            onClick={() => selectEffect(fx.id)} 
                            className={`aspect-square bg-gray-900 border cursor-pointer hover:bg-gray-800 transition flex flex-col items-center justify-center p-4 gap-4 relative overflow-hidden group ${isSelected ? 'border-white ring-2 ring-white/50 ring-offset-2 ring-offset-black' : 'border-white/10'}`}
                        >
                            {/* Visual Preview of Effect */}
                            {fx.id !== '' && (
                                <div className={`text-2xl font-display font-bold text-white/80 ${fx.id}`}>
                                    Aa
                                </div>
                            )}
                            
                            <div className="flex items-center gap-2 z-10">
                                <span className="text-xs text-gray-500 uppercase tracking-widest group-hover:text-white transition text-center">{fx.name}</span>
                            </div>
                            
                            {isSelected && (
                                <div className="absolute top-2 right-2 text-green-500">
                                    <CheckCircle size={16} />
                                </div>
                            )}
                        </div>
                    );
                })}
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;