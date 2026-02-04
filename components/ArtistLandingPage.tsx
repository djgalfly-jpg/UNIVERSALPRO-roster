import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getArtistById, trackArtistVisit, getLiveAnalytics } from '../services/store';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Instagram, Youtube, Twitter, Facebook, Music, Share2, Check, Download, Users, Globe, FileText, AlertTriangle, Hammer, RefreshCcw, Lock, Edit3, MessageCircle } from 'lucide-react';
import { Artist } from '../types';

interface Props {
    previewData?: Artist;
}

// Helper for counting up numbers
const CountUp: React.FC<{ end: number, duration?: number }> = ({ end, duration = 2000 }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime: number | null = null;
        const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            
            // Ease out quart
            const ease = 1 - Math.pow(1 - progress, 4);
            
            setCount(Math.floor(ease * end));

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    }, [end, duration]);

    return <span>{count.toLocaleString()}</span>;
};

const ArtistLandingPage: React.FC<Props> = ({ previewData }) => {
  const { id } = useParams<{ id: string }>();
  
  // State for data
  const [artist, setArtist] = useState<Artist | null>(previewData || null);
  const [copied, setCopied] = useState(false);
  
  // Real-time analytics state
  const [activeUsers, setActiveUsers] = useState(0);
  const [activeCountries, setActiveCountries] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(!previewData);

  useEffect(() => {
    const loadArtist = async () => {
        // If not previewing, load and track visit
        if (!previewData && id) {
            // Track visit returns the updated artist object
            const updated = await trackArtistVisit(id);
            if (updated) {
                setArtist(updated);
            } else {
                // Fallback if update fails
                const fetched = await getArtistById(id);
                setArtist(fetched || null);
            }
        } else if (previewData) {
            setArtist(previewData);
        }
        setLoading(false);
    };

    loadArtist();
  }, [id, previewData]);

  // Live Users Polling
  useEffect(() => {
      const fetchLive = async () => {
          const data = await getLiveAnalytics();
          setActiveUsers(data.activeUsers);
          setActiveCountries(data.countries);
      };

      fetchLive(); // Initial
      const interval = setInterval(fetchLive, 5000); // Poll every 5s
      return () => clearInterval(interval);
  }, []);

  if (loading) {
      return <div className="min-h-screen bg-black text-white flex items-center justify-center uppercase tracking-widest animate-pulse">Loading Asset...</div>;
  }

  if (!artist) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center uppercase tracking-widest">Artist Not Found</div>;
  }

  // --- STATUS CHECKS ---
  if (artist.status && artist.status !== 'active') {
      let icon = <AlertTriangle size={64} className="mb-4 text-white"/>;
      let title = "SITE UNAVAILABLE";
      let message = "This page is currently not accessible.";
      let colorClass = "text-gray-500";

      switch(artist.status) {
          case 'maintenance':
              icon = <Hammer size={64} className="mb-6 text-yellow-500 animate-pulse"/>;
              title = "UNDER MAINTENANCE";
              message = "We are currently improving the experience. Please check back shortly.";
              colorClass = "text-yellow-500";
              break;
          case 'updating':
              icon = <RefreshCcw size={64} className="mb-6 text-blue-500 animate-spin-slow"/>;
              title = "SYSTEM UPDATE";
              message = "Updating artist statistics and discography. Syncing new assets.";
              colorClass = "text-blue-500";
              break;
          case 'suspended':
              icon = <Lock size={64} className="mb-6 text-red-600"/>;
              title = "ACCESS SUSPENDED";
              message = "This page has been temporarily suspended by Universal Orchard administration.";
              colorClass = "text-red-600";
              break;
          case 'unsigned':
              icon = <FileText size={64} className="mb-6 text-gray-600"/>;
              title = "ARCHIVED PROFILE";
              message = "This artist is no longer signed with Universal Orchard Music.";
              colorClass = "text-gray-600";
              break;
          case 'editing':
              icon = <Edit3 size={64} className="mb-6 text-purple-600"/>;
              title = "IN EDITING MODE";
              message = "The administration is currently making live edits to this profile.";
              colorClass = "text-purple-600";
              break;
      }

      return (
          <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 relative overflow-hidden">
               {/* Background Image with blur */}
               <div className="absolute inset-0">
                   <img src={artist.photoUrl} className="w-full h-full object-cover opacity-20 blur-xl grayscale"/>
               </div>
               
               <div className="relative z-10 bg-black/80 backdrop-blur-md border border-white/10 p-12 max-w-2xl text-center flex flex-col items-center shadow-2xl">
                   {icon}
                   <h1 className={`text-4xl md:text-5xl font-display font-bold mb-4 uppercase tracking-widest ${colorClass}`}>
                       {title}
                   </h1>
                   <div className="w-24 h-1 bg-white/20 mb-8"></div>
                   <p className="text-white text-lg font-light mb-8 max-w-md leading-relaxed">
                       {message}
                   </p>
                   <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em]">
                       Universal Orchard Music Group
                   </p>
               </div>
          </div>
      )
  }

  const statData = [
    { name: 'Spotify', value: artist.stats.spotifyListeners },
    { name: 'YouTube', value: artist.stats.youtubeSubscribers },
    { name: 'Insta', value: artist.stats.instagramFollowers },
    { name: 'TikTok', value: artist.stats.tiktokFollowers },
  ];

  const handleShare = () => {
      // If in preview mode, we might not have a real URL yet, but we use the generatedLink
      const url = previewData ? artist.generatedLink : window.location.href;
      navigator.clipboard.writeText(url || window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black overflow-x-hidden">
      {/* Navigation / Top Bar */}
      <div className="fixed top-0 left-0 w-full z-50 p-6 flex justify-between items-center mix-blend-difference">
         <div className="text-[10px] font-bold uppercase tracking-[0.3em]">Universal Orchard Music</div>
         <button onClick={handleShare} className="flex items-center gap-2 text-[10px] uppercase tracking-widest border border-white/50 px-4 py-2 hover:bg-white hover:text-black transition">
            {copied ? <Check size={12}/> : <Share2 size={12}/>}
            {copied ? 'Link Copied' : 'Share Profile'}
         </button>
      </div>

      {/* Hero Section */}
      <header className="relative h-screen w-full overflow-hidden">
        <div className="absolute inset-0 grayscale contrast-125">
          <img src={artist.photoUrl} alt={artist.name} className="w-full h-full object-cover animate-scale" style={{animationDuration: '20s'}} />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent"></div>
        </div>
        
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-24 flex flex-col items-start animate-fade-in-up z-10">
          <span className="text-white/60 text-xs uppercase tracking-[0.4em] mb-4 pl-1">{artist.genre}</span>
          <h1 className="text-6xl md:text-[9rem] lg:text-[12rem] font-display font-bold uppercase tracking-tighter leading-[0.85] mb-8 text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500">
            {artist.name}
          </h1>
          
          <div className="flex flex-col md:flex-row gap-12 items-start max-w-5xl">
              <p className="text-lg md:text-xl font-light text-gray-300 font-display italic leading-relaxed border-l-2 border-white pl-6 md:w-2/3">
                {artist.bio}
              </p>
              
              <div className="flex flex-col gap-4 w-full md:w-auto">
                <button 
                    onClick={() => document.getElementById('discography')?.scrollIntoView({behavior: 'smooth'})}
                    className="bg-white text-black px-12 py-4 font-bold uppercase tracking-[0.2em] hover:bg-gray-200 transition text-xs w-full md:w-auto text-center"
                >
                  Stream Latest
                </button>
                {artist.bookUrl && (
                    <a 
                        href={artist.bookUrl} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border border-white/30 text-white px-12 py-4 font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-black transition text-xs w-full md:w-auto text-center flex items-center justify-center gap-2"
                    >
                        <FileText size={14}/> View Book
                    </a>
                )}
              </div>
          </div>
        </div>
      </header>

      {/* Stats Ticker */}
      <div className="border-y border-white/10 bg-black overflow-hidden py-4">
          <div className="flex animate-scroll-left whitespace-nowrap gap-24 text-gray-500 uppercase text-xs tracking-[0.2em]">
             {[1,2,3,4,5].map(i => (
                 <React.Fragment key={i}>
                    <span>Global Impact Analysis</span>
                    <span>•</span>
                    <span>Real-Time Streaming Data</span>
                    <span>•</span>
                    <span>Verified Artist Profile</span>
                    <span>•</span>
                 </React.Fragment>
             ))}
          </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-[1920px] mx-auto grid grid-cols-1 lg:grid-cols-12">
        
        {/* Left: Stats & Socials */}
        <div className="lg:col-span-4 p-8 md:p-16 border-r border-white/10 space-y-20 bg-[#050505]">
          <section>
            <h2 className="text-xs font-bold mb-12 uppercase tracking-[0.4em] text-white/40 border-b border-white/10 pb-4">Performance Metrics</h2>
            
            <div className="h-64 w-full mb-12">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statData} barSize={4}>
                  <XAxis dataKey="name" stroke="#333" fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#666', fontSize: 10, letterSpacing: '0.1em'}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#000', border: '1px solid #333', color: '#fff', fontSize: '10px', textTransform: 'uppercase' }}
                    itemStyle={{ color: '#fff' }}
                    cursor={{fill: '#111'}}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {statData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={'#fff'} fillOpacity={0.6 + (index * 0.1)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 gap-1">
                <div className="bg-white/5 p-6 flex justify-between items-center group hover:bg-white/10 transition">
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest group-hover:text-white transition">Monthly Listeners</div>
                    <div className="text-2xl font-display font-bold">
                        <CountUp end={artist.stats.spotifyListeners} />
                    </div>
                </div>
                <div className="bg-white/5 p-6 flex justify-between items-center group hover:bg-white/10 transition">
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest group-hover:text-white transition">YouTube Subs</div>
                    <div className="text-2xl font-display font-bold">
                        <CountUp end={artist.stats.youtubeSubscribers} />
                    </div>
                </div>
                <div className="bg-white/5 p-6 flex justify-between items-center group hover:bg-white/10 transition">
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest group-hover:text-white transition">Instagram Followers</div>
                    <div className="text-2xl font-display font-bold">
                        <CountUp end={artist.stats.instagramFollowers} />
                    </div>
                </div>
                <div className="bg-white/5 p-6 flex justify-between items-center group hover:bg-white/10 transition">
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest group-hover:text-white transition">TikTok Community</div>
                    <div className="text-2xl font-display font-bold">
                        <CountUp end={artist.stats.tiktokFollowers} />
                    </div>
                </div>
            </div>
          </section>

          <section>
             <h2 className="text-xs font-bold mb-8 uppercase tracking-[0.4em] text-white/40 border-b border-white/10 pb-4">Social Network</h2>
             <div className="grid grid-cols-4 gap-4">
                {artist.socialLinks?.instagram?.isActive && (
                    <a href={artist.socialLinks.instagram.url} target="_blank" className="aspect-square border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition duration-500 hover:scale-105"><Instagram size={20} strokeWidth={1.5}/></a>
                )}
                {artist.socialLinks?.twitter?.isActive && (
                    <a href={artist.socialLinks.twitter.url} target="_blank" className="aspect-square border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition duration-500 hover:scale-105"><Twitter size={20} strokeWidth={1.5}/></a>
                )}
                {artist.socialLinks?.youtube?.isActive && (
                    <a href={artist.socialLinks.youtube.url} target="_blank" className="aspect-square border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition duration-500 hover:scale-105"><Youtube size={20} strokeWidth={1.5}/></a>
                )}
                {artist.socialLinks?.facebook?.isActive && (
                    <a href={artist.socialLinks.facebook.url} target="_blank" className="aspect-square border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition duration-500 hover:scale-105"><Facebook size={20} strokeWidth={1.5}/></a>
                )}
                 {artist.socialLinks?.discord?.isActive && (
                    <a href={artist.socialLinks.discord.url} target="_blank" className="aspect-square border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition duration-500 hover:scale-105"><MessageCircle size={20} strokeWidth={1.5}/></a>
                )}
             </div>
          </section>
        </div>

        {/* Right: Media & Latest */}
        <div className="lg:col-span-8">
            {/* Biography Section */}
            <div className="p-8 md:p-16 border-b border-white/10">
                <h2 className="text-xs font-bold mb-8 uppercase tracking-[0.4em] text-white/40">About The Artist</h2>
                <div className="grid md:grid-cols-2 gap-12">
                    <p className="text-sm leading-loose text-gray-400 font-light">
                        {artist.bio}
                    </p>
                    <div className="text-xs space-y-4 text-gray-500 font-mono">
                        <div className="flex justify-between border-b border-white/10 pb-2">
                            <span>GENRE</span>
                            <span className="text-white">{artist.genre}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/10 pb-2">
                            <span>ORIGIN</span>
                            <span className="text-white">{artist.visitorCountries?.[0] || 'International'}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/10 pb-2">
                            <span>LABEL</span>
                            <span className="text-white">Universal Orchard</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Featured Video */}
            {artist.youtubeVideoId && (
                <div className="w-full aspect-video border-b border-white/10 grayscale hover:grayscale-0 transition duration-1000 bg-black relative group">
                     <div className="absolute top-6 left-6 z-10 bg-red-600 text-white text-[10px] font-bold px-3 py-1 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition">Latest Visual</div>
                     <iframe 
                        width="100%" 
                        height="100%" 
                        src={`https://www.youtube.com/embed/${artist.youtubeVideoId}?modestbranding=1&controls=1&showinfo=0`} 
                        title="YouTube video player" 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                        className="w-full h-full opacity-80 group-hover:opacity-100 transition duration-700"
                    ></iframe>
                </div>
            )}

            <div id="discography" className="grid grid-cols-1 md:grid-cols-2 h-full">
                {/* Spotify Embed */}
                {artist.spotifyArtistId && (
                    <div className="p-8 md:p-16 border-r border-white/10 border-b md:border-b-0 border-white/10 bg-[#080808]">
                        <h2 className="text-xs font-bold mb-8 uppercase tracking-[0.4em] text-white/40">Discography</h2>
                        <div className="w-full">
                            <iframe 
                                style={{borderRadius: '12px'}} 
                                src={`https://open.spotify.com/embed/artist/${artist.spotifyArtistId}?utm_source=generator`} 
                                width="100%" 
                                height="450" 
                                frameBorder="0" 
                                allowFullScreen 
                                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                                title="Spotify Player"
                            ></iframe>
                        </div>
                    </div>
                )}
                
                {/* Visual Gallery / Book */}
                <div className="p-8 md:p-16 bg-[#080808]">
                    <h2 className="text-xs font-bold mb-8 uppercase tracking-[0.4em] text-white/40">Press Visuals</h2>
                    <div className="grid grid-cols-2 gap-2">
                        {/* Main Image */}
                        <div className="col-span-2 group overflow-hidden relative aspect-video border border-white/10">
                             <img src={artist.photoUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition duration-700" alt="Main Press Shot" />
                             <div className="absolute bottom-4 left-4 text-[10px] uppercase tracking-widest text-white/50 group-hover:text-white transition">Official Asset 01</div>
                        </div>
                        
                        {/* Book / Gallery Images from Dropbox */}
                        {artist.galleryUrls && artist.galleryUrls.length > 0 ? (
                            artist.galleryUrls.slice(0, 4).map((url, idx) => (
                                <div key={idx} className="group overflow-hidden relative aspect-square border border-white/10">
                                    <img src={url} className="w-full h-full object-cover grayscale contrast-125 group-hover:grayscale-0 transition duration-700" alt={`Gallery ${idx}`} />
                                </div>
                            ))
                        ) : (
                             // Fallback if no specific gallery images
                             <div className="group overflow-hidden relative aspect-square border border-white/10">
                                <img src={artist.photoUrl} className="w-full h-full object-cover object-top grayscale contrast-125 group-hover:grayscale-0 transition duration-700" alt="Portrait" />
                             </div>
                        )}

                        {/* Download Book Button */}
                        {artist.bookUrl ? (
                            <a 
                                href={artist.bookUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="col-span-1 w-full aspect-square bg-white/5 flex flex-col items-center justify-center text-center p-4 gap-2 text-[10px] uppercase tracking-widest text-gray-500 hover:bg-white hover:text-black transition cursor-pointer border border-white/10 hover:border-white group"
                            >
                                <FileText size={24} className="mb-2 opacity-50 group-hover:opacity-100"/>
                                Download Book (PDF)
                            </a>
                        ) : (
                             <div className="col-span-1 w-full aspect-square bg-white/5 flex flex-col items-center justify-center text-center p-4 gap-2 text-[10px] uppercase tracking-widest text-gray-500 border border-white/10 opacity-50 cursor-not-allowed">
                                <FileText size={24} className="mb-2"/>
                                Book Not Available
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Real-time Visitor Stats */}
            <div className="border-t border-white/10 bg-[#0a0a0a] p-8 md:p-16">
                 <h2 className="text-xs font-bold mb-8 uppercase tracking-[0.4em] text-white/40 flex items-center gap-2">
                    <Globe size={14}/> Live Traffic Analysis
                 </h2>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     <div className="bg-black border border-white/10 p-6 flex flex-col justify-between h-32">
                         <span className="text-[10px] text-gray-500 uppercase tracking-widest">Total Page Visits</span>
                         <span className="text-3xl font-display font-bold text-white">
                             <CountUp end={artist.visitCount || 0} />
                         </span>
                     </div>
                     <div className="bg-black border border-white/10 p-6 flex flex-col justify-between h-32">
                         <span className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-2">
                             <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                             Live Users (10m)
                         </span>
                         <span className="text-3xl font-display font-bold text-white">{activeUsers}</span>
                     </div>
                     <div className="bg-black border border-white/10 p-6 flex flex-col justify-between">
                         <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Active Regions</span>
                         <div className="flex flex-wrap gap-2">
                             {activeCountries.length > 0 ? (
                                 activeCountries.slice(0, 5).map((country, idx) => (
                                     <span key={idx} className="text-[10px] border border-white/20 px-2 py-1 text-gray-400 uppercase">{country}</span>
                                 ))
                             ) : (
                                 <span className="text-[10px] text-gray-600">Global</span>
                             )}
                         </div>
                     </div>
                 </div>
            </div>
        </div>
      </div>
      
      <footer className="py-24 text-center text-gray-700 text-[9px] uppercase tracking-[0.3em] border-t border-white/10 px-8 bg-black">
        <p className="mb-4">Global Icons & Emerging Talent</p>
        <p>All rights reserved, Universal Music Publishing, and its producers, Latin Grammy members, GalFly, and KRYLIN.</p>
      </footer>
    </div>
  );
};

export default ArtistLandingPage;