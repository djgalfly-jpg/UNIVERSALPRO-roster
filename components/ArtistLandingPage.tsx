import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { getArtistById, trackArtistVisit, getLiveAnalytics } from '../services/store';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, YAxis } from 'recharts';
import { Instagram, Youtube, Twitter, Facebook, Music, Share2, Check, Download, Users, Globe, FileText, AlertTriangle, Hammer, RefreshCcw, Lock, Edit3, MessageCircle, Activity, Server, Zap, Signal } from 'lucide-react';
import { Artist, BlockType } from '../types';

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

// --- ISOLATED TRAFFIC COMPONENT (Prevents Page Re-renders) ---
const TrafficSection: React.FC<{ activeUsers: number, visitCount: number, activeCountries: string[] }> = React.memo(({ activeUsers, visitCount, activeCountries }) => {
    // Local state for simulation only
    const [trafficPulse, setTrafficPulse] = useState<number[]>([]);
    const [serverLoad, setServerLoad] = useState(12);
    const [bandwidth, setBandwidth] = useState(850);

    // Initialize random data based on real users once
    useEffect(() => {
         const points = Array.from({ length: 15 }, () => Math.floor(Math.random() * (Math.max(activeUsers, 1) + 20)) + 10);
         setTrafficPulse(points);
    }, [activeUsers]);

    // Simulation Loop - Runs locally in this component
    useEffect(() => {
        const interval = setInterval(() => {
            setServerLoad(prev => {
                const flux = Math.floor(Math.random() * 5) - 2; 
                return Math.min(Math.max(prev + flux, 10), 45);
            }); 
            
            setBandwidth(prev => {
                const flux = Math.floor(Math.random() * 100) - 50; 
                return Math.max(prev + flux, 500);
            });

            setTrafficPulse(prev => {
                if (prev.length === 0) return prev;
                const last = prev[prev.length - 1];
                const next = Math.max(5, last + (Math.floor(Math.random() * 20) - 10)); 
                return [...prev.slice(1), next];
            });
        }, 2000); // 2s smooth update
        
        return () => clearInterval(interval);
    }, []);

    const trafficData = useMemo(() => {
        return trafficPulse.map((val, i) => ({ name: `${i}s`, value: val }));
    }, [trafficPulse]);

    return (
        <section className="bg-[#0a0a0a] border-b border-white/10 w-full">
            <div className="max-w-[1920px] mx-auto p-4 md:p-8">
                 <h2 className="text-[10px] md:text-xs font-bold mb-6 uppercase tracking-[0.3em] md:tracking-[0.4em] text-white/40 flex items-center gap-2">
                    <Activity size={14} className="text-green-500"/> System Diagnostics & Traffic
                 </h2>
                 
                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                     {/* 1. Live Users */}
                     <div className="col-span-2 md:col-span-1 bg-black border border-white/10 p-4 md:p-6 flex flex-col justify-between h-40 relative overflow-hidden group">
                         <span className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-2 z-10 relative">
                             <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]"></span>
                             Active Users
                         </span>
                         
                         {/* Live Chart Background */}
                         <div className="absolute bottom-0 left-0 w-full h-20 opacity-30 group-hover:opacity-50 transition">
                             <ResponsiveContainer width="100%" height="100%">
                                 <BarChart data={trafficData}>
                                     <Bar dataKey="value" fill="#22c55e" />
                                 </BarChart>
                             </ResponsiveContainer>
                         </div>

                         <div className="z-10 relative">
                             <span className="text-3xl md:text-4xl font-display font-bold text-white block">
                                 {activeUsers}
                             </span>
                             <span className="text-[9px] text-green-500 font-mono tracking-widest">REAL-TIME NODES</span>
                         </div>
                     </div>

                     {/* 2. Total Visits */}
                     <div className="bg-black border border-white/10 p-4 md:p-6 flex flex-col justify-between h-40">
                         <div className="flex justify-between items-start">
                             <span className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-widest">Lifetime Hits</span>
                             <Globe size={14} className="text-gray-700"/>
                         </div>
                         <div>
                            <span className="text-2xl md:text-3xl font-display font-bold text-white block">
                                <CountUp end={visitCount || 0} />
                            </span>
                            <span className="text-[9px] text-gray-500 font-mono tracking-widest">UNIQUE SESSIONS</span>
                         </div>
                     </div>

                     {/* 3. Server Load */}
                     <div className="bg-black border border-white/10 p-4 md:p-6 flex flex-col justify-between h-40">
                         <div className="flex justify-between items-start">
                             <span className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-widest">Server Load</span>
                             <Server size={14} className="text-gray-700"/>
                         </div>
                         <div>
                            <span className="text-2xl md:text-3xl font-display font-bold text-white block flex items-end gap-2">
                                {serverLoad}% <span className="text-[10px] text-gray-600 mb-1">CPU</span>
                            </span>
                            <div className="w-full h-1 bg-gray-800 mt-2">
                                <div className="h-full bg-blue-500 transition-all duration-500" style={{width: `${serverLoad}%`}}></div>
                            </div>
                            <span className="text-[9px] text-blue-500 font-mono tracking-widest mt-1 block">OPTIMAL</span>
                         </div>
                     </div>

                     {/* 4. Bandwidth */}
                     <div className="bg-black border border-white/10 p-4 md:p-6 flex flex-col justify-between h-40">
                         <div className="flex justify-between items-start">
                             <span className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-widest">Bandwidth</span>
                             <Signal size={14} className="text-gray-700"/>
                         </div>
                         <div>
                            <span className="text-2xl md:text-3xl font-display font-bold text-white block">
                                {bandwidth} <span className="text-sm text-gray-500">Mbps</span>
                            </span>
                            <span className="text-[9px] text-purple-500 font-mono tracking-widest flex items-center gap-1">
                                <Zap size={8}/> HIGH SPEED UPLINK
                            </span>
                         </div>
                     </div>
                 </div>

                 {/* Active Regions Strip */}
                 <div className="mt-4 flex flex-wrap gap-2 items-center">
                    <span className="text-[9px] text-gray-600 uppercase tracking-widest mr-2">Detected Regions:</span>
                    {activeCountries.length > 0 ? (
                        activeCountries.slice(0, 8).map((country, idx) => (
                            <span key={idx} className="text-[9px] border border-white/10 bg-white/5 px-2 py-1 text-gray-400 uppercase">{country}</span>
                        ))
                    ) : (
                        <span className="text-[10px] text-gray-600">Global Coverage</span>
                    )}
                 </div>
            </div>
      </section>
    );
});

const BioSection: React.FC<{ artist: Artist }> = React.memo(({ artist }) => (
    <div className="border-b border-white/10 w-full grid grid-cols-1 md:grid-cols-2">
        <div className="p-6 md:p-16 border-r border-white/10">
            <h2 className="text-[10px] md:text-xs font-bold mb-6 md:mb-8 uppercase tracking-[0.3em] md:tracking-[0.4em] text-white/40">About The Artist</h2>
            <div className="space-y-6">
                <p className="text-sm leading-loose text-gray-400 font-light">
                    {artist.bio}
                </p>
                <div className="text-xs space-y-4 text-gray-500 font-mono">
                    <div className="flex justify-between border-b border-white/10 pb-2">
                        <span>GENRE</span>
                        <span className="text-white text-right">{artist.genre}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-2">
                        <span>ORIGIN</span>
                        <span className="text-white text-right">{artist.visitorCountries?.[0] || 'International'}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-2">
                        <span>LABEL</span>
                        <span className="text-white text-right">Universal Orchard</span>
                    </div>
                </div>
            </div>
        </div>
        <div className="relative h-64 md:h-auto min-h-[300px]">
             {/* Large Portrait on right side of bio */}
             <img src={artist.photoUrl} className="w-full h-full object-cover grayscale opacity-50 hover:opacity-100 transition duration-700" alt="Bio Portrait"/>
        </div>
    </div>
));

const VideoSection: React.FC<{ artist: Artist }> = React.memo(({ artist }) => artist.youtubeVideoId ? (
    <div className="w-full aspect-video border-b border-white/10 grayscale hover:grayscale-0 transition duration-1000 bg-black relative group">
        <div className="absolute top-4 left-4 md:top-6 md:left-6 z-10 bg-red-600 text-white text-[9px] md:text-[10px] font-bold px-3 py-1 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition pointer-events-none">Latest Visual</div>
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
) : null);

const MusicSection: React.FC<{ artist: Artist }> = React.memo(({ artist }) => (
    <div id="discography" className="w-full grid grid-cols-1 md:grid-cols-2 border-b border-white/10">
        {/* Spotify Embed */}
        {artist.spotifyArtistId && (
            <div className="p-6 md:p-16 border-r border-white/10 border-b md:border-b-0 bg-[#080808]">
                <h2 className="text-[10px] md:text-xs font-bold mb-6 md:mb-8 uppercase tracking-[0.3em] md:tracking-[0.4em] text-white/40">Discography</h2>
                <div className="w-full">
                    <iframe 
                        style={{borderRadius: '12px'}} 
                        src={`https://open.spotify.com/embed/artist/${artist.spotifyArtistId}?utm_source=generator`} 
                        width="100%" 
                        height="400" 
                        frameBorder="0" 
                        allowFullScreen 
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                        title="Spotify Player"
                    ></iframe>
                </div>
            </div>
        )}
        
        {/* Visual Gallery / Book */}
        <div className="p-6 md:p-16 bg-[#080808]">
            <h2 className="text-[10px] md:text-xs font-bold mb-6 md:mb-8 uppercase tracking-[0.3em] md:tracking-[0.4em] text-white/40">Press Visuals</h2>
            <div className="grid grid-cols-2 gap-2">
                {/* Main Image */}
                <div className="col-span-2 group overflow-hidden relative aspect-video border border-white/10">
                        <img src={artist.photoUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition duration-700" alt="Main Press Shot" />
                        <div className="absolute bottom-4 left-4 text-[9px] uppercase tracking-widest text-white/50 group-hover:text-white transition">Official Asset 01</div>
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
                        className="col-span-1 w-full aspect-square bg-white/5 flex flex-col items-center justify-center text-center p-4 gap-2 text-[9px] md:text-[10px] uppercase tracking-widest text-gray-500 hover:bg-white hover:text-black transition cursor-pointer border border-white/10 hover:border-white group"
                    >
                        <FileText size={20} className="mb-2 opacity-50 group-hover:opacity-100"/>
                        Download Book (PDF)
                    </a>
                ) : (
                        <div className="col-span-1 w-full aspect-square bg-white/5 flex flex-col items-center justify-center text-center p-4 gap-2 text-[9px] md:text-[10px] uppercase tracking-widest text-gray-500 border border-white/10 opacity-50 cursor-not-allowed">
                        <FileText size={20} className="mb-2"/>
                        Book Not Available
                    </div>
                )}
            </div>
        </div>
    </div>
));

const StatsSection: React.FC<{ artist: Artist }> = React.memo(({ artist }) => {
  const statData = [
    { name: 'Spotify', value: artist.stats.spotifyListeners },
    { name: 'YouTube', value: artist.stats.youtubeSubscribers },
    { name: 'Insta', value: artist.stats.instagramFollowers },
    { name: 'TikTok', value: artist.stats.tiktokFollowers },
  ];

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 border-b border-white/10">
         <div className="p-6 md:p-16 border-r border-white/10 bg-[#050505]">
            <h2 className="text-[10px] md:text-xs font-bold mb-8 md:mb-12 uppercase tracking-[0.3em] md:tracking-[0.4em] text-white/40 border-b border-white/10 pb-4">Performance Metrics</h2>
            
            <div className="h-48 md:h-64 w-full mb-8 md:mb-12">
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
                <div className="bg-white/5 p-4 md:p-6 flex justify-between items-center group hover:bg-white/10 transition">
                    <div className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-widest group-hover:text-white transition">Monthly Listeners</div>
                    <div className="text-xl md:text-2xl font-display font-bold">
                        <CountUp end={artist.stats.spotifyListeners} />
                    </div>
                </div>
                <div className="bg-white/5 p-4 md:p-6 flex justify-between items-center group hover:bg-white/10 transition">
                    <div className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-widest group-hover:text-white transition">YouTube Subs</div>
                    <div className="text-xl md:text-2xl font-display font-bold">
                        <CountUp end={artist.stats.youtubeSubscribers} />
                    </div>
                </div>
                <div className="bg-white/5 p-4 md:p-6 flex justify-between items-center group hover:bg-white/10 transition">
                    <div className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-widest group-hover:text-white transition">Instagram Followers</div>
                    <div className="text-xl md:text-2xl font-display font-bold">
                        <CountUp end={artist.stats.instagramFollowers} />
                    </div>
                </div>
                <div className="bg-white/5 p-4 md:p-6 flex justify-between items-center group hover:bg-white/10 transition">
                    <div className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-widest group-hover:text-white transition">TikTok Community</div>
                    <div className="text-xl md:text-2xl font-display font-bold">
                        <CountUp end={artist.stats.tiktokFollowers} />
                    </div>
                </div>
            </div>
         </div>

         <div className="p-6 md:p-16 bg-[#050505]">
             <h2 className="text-[10px] md:text-xs font-bold mb-6 md:mb-8 uppercase tracking-[0.3em] md:tracking-[0.4em] text-white/40 border-b border-white/10 pb-4">Social Network</h2>
             <div className="grid grid-cols-4 gap-4">
                {artist.socialLinks?.instagram?.isActive && (
                    <a href={artist.socialLinks!.instagram!.url} target="_blank" className="aspect-square border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition duration-500 hover:scale-105"><Instagram size={20} strokeWidth={1.5}/></a>
                )}
                {artist.socialLinks?.twitter?.isActive && (
                    <a href={artist.socialLinks!.twitter!.url} target="_blank" className="aspect-square border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition duration-500 hover:scale-105"><Twitter size={20} strokeWidth={1.5}/></a>
                )}
                {artist.socialLinks?.youtube?.isActive && (
                    <a href={artist.socialLinks!.youtube!.url} target="_blank" className="aspect-square border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition duration-500 hover:scale-105"><Youtube size={20} strokeWidth={1.5}/></a>
                )}
                {artist.socialLinks?.facebook?.isActive && (
                    <a href={artist.socialLinks!.facebook!.url} target="_blank" className="aspect-square border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition duration-500 hover:scale-105"><Facebook size={20} strokeWidth={1.5}/></a>
                )}
                 {artist.socialLinks?.discord?.isActive && (
                    <a href={artist.socialLinks!.discord!.url} target="_blank" className="aspect-square border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition duration-500 hover:scale-105"><MessageCircle size={20} strokeWidth={1.5}/></a>
                )}
             </div>
             
             {/* Large Visit Count Display Inside Social Block */}
             <div className="mt-12 pt-8 border-t border-white/10">
                 <h2 className="text-[10px] md:text-xs font-bold mb-4 uppercase tracking-[0.3em] md:tracking-[0.4em] text-white/40">Total Page Impressions</h2>
                 <div className="text-4xl font-display font-bold text-white flex items-center gap-4">
                     <Users size={32} className="text-gray-600"/>
                     <CountUp end={artist.visitCount || 0} />
                 </div>
             </div>
         </div>
    </div>
  );
});


const ArtistLandingPage: React.FC<Props> = ({ previewData }) => {
  const { id } = useParams<{ id: string }>();
  
  // State for data
  const [artist, setArtist] = useState<Artist | null>(previewData || null);
  const [copied, setCopied] = useState(false);
  
  // Real-time analytics state (fetched once)
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

  // 1. Fetch Real Live Data ONCE on Mount
  useEffect(() => {
      const fetchInitialData = async () => {
          const data = await getLiveAnalytics();
          // Ensure at least 1 user (me) is shown
          const baseUsers = Math.max(data.activeUsers, 1);
          
          setActiveUsers(baseUsers);
          setActiveCountries(data.countries.length > 0 ? data.countries : ['Global']);
      };

      fetchInitialData();
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
                   <h1 className={`text-3xl md:text-5xl font-display font-bold mb-4 uppercase tracking-widest ${colorClass}`}>
                       {title}
                   </h1>
                   <div className="w-24 h-1 bg-white/20 mb-8"></div>
                   <p className="text-white text-base md:text-lg font-light mb-8 max-w-md leading-relaxed">
                       {message}
                   </p>
                   <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em]">
                       Universal Orchard Music Group
                   </p>
               </div>
          </div>
      )
  }

  const handleShare = () => {
      // If in preview mode, we might not have a real URL yet, but we use the generatedLink
      const url = previewData ? artist.generatedLink : window.location.href;
      navigator.clipboard.writeText(url || window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  }

  const getLayout = (): BlockType[] => {
      return artist?.layoutOrder || ['traffic', 'bio', 'video', 'music', 'stats'];
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black overflow-x-hidden flex flex-col">
      {/* Navigation / Top Bar */}
      <div className="fixed top-0 left-0 w-full z-50 p-4 md:p-6 flex justify-between items-center mix-blend-difference">
         <div className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] md:tracking-[0.3em]">Universal Orchard Music</div>
         <button onClick={handleShare} className="flex items-center gap-2 text-[9px] md:text-[10px] uppercase tracking-widest border border-white/50 px-3 py-2 md:px-4 hover:bg-white hover:text-black transition">
            {copied ? <Check size={10}/> : <Share2 size={10}/>}
            {copied ? 'Copied' : 'Share'}
         </button>
      </div>

      {/* Hero Section - 100dvh for mobile browsers */}
      <header className="relative h-[100dvh] w-full overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 grayscale contrast-125">
          {/* Object-top ensures faces aren't cut off on mobile */}
          <img 
            src={artist.photoUrl} 
            alt={artist.name} 
            className="w-full h-full object-cover object-top animate-scale" 
            style={{animationDuration: '20s'}} 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent opacity-60 md:opacity-100"></div>
        </div>
        
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-24 flex flex-col items-start animate-fade-in-up z-10 pb-20 md:pb-24">
          <span className="text-white/60 text-[10px] md:text-xs uppercase tracking-[0.3em] md:tracking-[0.4em] mb-2 md:mb-4 pl-1">{artist.genre}</span>
          {/* Responsive Font Size for long names */}
          <h1 className="text-5xl sm:text-7xl md:text-[8rem] lg:text-[10rem] font-display font-bold uppercase tracking-tighter leading-[0.9] mb-6 md:mb-8 text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 break-words max-w-full">
            {artist.name}
          </h1>
          
          <div className="flex flex-col lg:flex-row gap-8 md:gap-12 items-start max-w-5xl w-full">
              <p className="text-base md:text-xl font-light text-gray-300 font-display italic leading-relaxed border-l-2 border-white pl-4 md:pl-6 lg:w-2/3 line-clamp-4 md:line-clamp-none">
                {artist.bio}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto mt-4 lg:mt-0">
                <button 
                    onClick={() => document.getElementById('discography')?.scrollIntoView({behavior: 'smooth'})}
                    className="bg-white text-black px-8 md:px-12 py-3 md:py-4 font-bold uppercase tracking-[0.2em] hover:bg-gray-200 transition text-[10px] md:text-xs w-full sm:w-auto text-center"
                >
                  Stream Latest
                </button>
                {artist.bookUrl && (
                    <a 
                        href={artist.bookUrl} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border border-white/30 text-white px-8 md:px-12 py-3 md:py-4 font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-black transition text-[10px] md:text-xs w-full sm:w-auto text-center flex items-center justify-center gap-2"
                    >
                        <FileText size={14}/> View Book
                    </a>
                )}
              </div>
          </div>
        </div>
      </header>

      {/* Stats Ticker */}
      <div className="border-y border-white/10 bg-black overflow-hidden py-3 md:py-4 flex-shrink-0">
          <div className="flex animate-scroll-left whitespace-nowrap gap-12 md:gap-24 text-gray-500 uppercase text-[10px] md:text-xs tracking-[0.2em]">
             {[1,2,3,4,5,6].map(i => (
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

      {/* DYNAMIC SQUARED LAYOUT CONTENT */}
      <main className="flex-grow w-full max-w-[1920px] mx-auto border-x border-white/10">
          {getLayout().map(block => (
              <React.Fragment key={block}>
                  {block === 'traffic' && <TrafficSection activeUsers={activeUsers} visitCount={artist.visitCount || 0} activeCountries={activeCountries} />}
                  {block === 'bio' && <BioSection artist={artist} />}
                  {block === 'video' && <VideoSection artist={artist} />}
                  {block === 'music' && <MusicSection artist={artist} />}
                  {block === 'stats' && <StatsSection artist={artist} />}
              </React.Fragment>
          ))}
      </main>
      
      {/* PERFECTLY PLACED FOOTER */}
      <footer className="mt-auto py-12 md:py-24 pb-safe text-center text-gray-700 text-[8px] md:text-[9px] uppercase tracking-[0.2em] md:tracking-[0.3em] border-t border-white/10 px-6 md:px-8 bg-black w-full flex-shrink-0">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
            <p className="mb-4">Global Icons & Emerging Talent</p>
            <p className="leading-relaxed">All rights reserved, Universal Music Publishing, and its producers, Latin Grammy members, GalFly, and KRYLIN.</p>
        </div>
      </footer>
    </div>
  );
};

export default ArtistLandingPage;