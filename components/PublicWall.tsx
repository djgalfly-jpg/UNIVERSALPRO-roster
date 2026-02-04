import React, { useEffect, useState } from 'react';
import { WallItem, ImpactStats } from '../types';
import { getWallItems, getVisualEffects, getSiteLockStatus, getImpactStats } from '../services/store';
import { Link } from 'react-router-dom';
import { Lock, ArrowRight, Shield, X, Trophy, Disc, Mic, Video, Users } from 'lucide-react';

// --- Animated Starfield Background ---
const StarfieldBackground = () => (
    <div className="absolute inset-0 bg-black overflow-hidden z-0">
         {/* Layer 1: Small stars, slow */}
        <div className="absolute inset-0 animate-pulse" style={{ animationDuration: '4s' }}>
            {Array.from({ length: 50 }).map((_, i) => (
                <div 
                    key={`s1-${i}`}
                    className="absolute bg-white rounded-full opacity-40"
                    style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        width: '1px',
                        height: '1px',
                    }}
                />
            ))}
        </div>
        {/* Layer 2: Medium stars, medium speed parallax simulation via movement */}
         <div className="absolute inset-0 animate-pulse" style={{ animationDuration: '3s' }}>
            {Array.from({ length: 30 }).map((_, i) => (
                <div 
                    key={`s2-${i}`}
                    className="absolute bg-blue-100 rounded-full opacity-60"
                    style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        width: '2px',
                        height: '2px',
                        boxShadow: '0 0 2px white'
                    }}
                />
            ))}
        </div>
         {/* Layer 3: Large stars, slow drift */}
         <div className="absolute inset-0">
            {Array.from({ length: 15 }).map((_, i) => (
                <div 
                    key={`s3-${i}`}
                    className="absolute bg-white rounded-full opacity-80 animate-pulse"
                    style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        width: '3px',
                        height: '3px',
                        boxShadow: '0 0 4px white',
                        animationDelay: `${Math.random() * 2}s`
                    }}
                />
            ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black"></div>
    </div>
);

// --- Animated Number Component ---
// Parses strings like "500+" or "1.2K" and animates the numeric part
const AnimatedStat: React.FC<{ value: string }> = ({ value }) => {
    const [displayValue, setDisplayValue] = useState(0);
    const [suffix, setSuffix] = useState('');
    const [prefix, setPrefix] = useState('');

    useEffect(() => {
        // Simple parsing: Find the first number sequence
        const match = value.match(/(\D*)(\d+(\.\d+)?)(\D*)/);
        
        if (match) {
            const pre = match[1];
            const num = parseFloat(match[2]);
            const suf = match[4];
            
            setPrefix(pre);
            setSuffix(suf);

            let start = 0;
            const duration = 2000;
            const startTime = performance.now();

            const animate = (currentTime: number) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                // EaseOutQuart
                const ease = 1 - Math.pow(1 - progress, 4);
                
                setDisplayValue(Math.floor(num * ease));

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    setDisplayValue(num); // Ensure final value is exact
                }
            };
            requestAnimationFrame(animate);
        } else {
            // Fallback for non-numeric strings
            setPrefix(value);
        }
    }, [value]);

    if (!value.match(/\d/)) return <span>{value}</span>;

    return (
        <span>
            {prefix}{displayValue.toLocaleString()}{suffix}
        </span>
    );
};

const ImpactModal: React.FC<{ isOpen: boolean, onClose: () => void, stats: ImpactStats }> = ({ isOpen, onClose, stats }) => {
    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center animate-fade-in-up">
            <StarfieldBackground />

            <div className="relative z-10 w-full max-w-6xl p-8 flex flex-col h-full md:h-auto justify-center">
                <button 
                    onClick={onClose}
                    className="absolute top-8 right-8 text-white hover:text-gray-300 transition hover:rotate-90 duration-300 z-50"
                >
                    <X size={32} />
                </button>

                <div className="text-center mb-12">
                    <h2 className="text-4xl md:text-7xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-white to-gray-400 tracking-tighter mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                        GLOBAL IMPACT
                    </h2>
                    <p className="text-[10px] md:text-sm uppercase tracking-[0.3em] text-gray-400">
                        Universal Orchard Music Group Statistics
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 text-center">
                    <div className="bg-white/5 border border-white/10 p-8 backdrop-blur-md rounded-lg group hover:bg-white/10 transition duration-500 transform hover:-translate-y-2">
                        <Disc size={32} className="mx-auto text-gray-400 mb-4 group-hover:text-white transition"/>
                        <div className="text-3xl md:text-4xl font-bold font-display text-white mb-2">
                            <AnimatedStat value={stats.produced} />
                        </div>
                        <div className="text-[9px] uppercase tracking-widest text-gray-500 group-hover:text-gray-300">Artists Produced</div>
                    </div>
                    
                    <div className="bg-white/5 border border-white/10 p-8 backdrop-blur-md rounded-lg group hover:bg-white/10 transition duration-500 transform hover:-translate-y-2">
                        <Trophy size={32} className="mx-auto text-yellow-500/50 mb-4 group-hover:text-yellow-400 transition"/>
                        <div className="text-3xl md:text-4xl font-bold font-display text-white mb-2">
                            <AnimatedStat value={stats.promoted} />
                        </div>
                        <div className="text-[9px] uppercase tracking-widest text-gray-500 group-hover:text-gray-300">Artists Promoted</div>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-8 backdrop-blur-md rounded-lg group hover:bg-white/10 transition duration-500 transform hover:-translate-y-2">
                        <Users size={32} className="mx-auto text-blue-500/50 mb-4 group-hover:text-blue-400 transition"/>
                        <div className="text-3xl md:text-4xl font-bold font-display text-white mb-2">
                             <AnimatedStat value={stats.advised} />
                        </div>
                        <div className="text-[9px] uppercase tracking-widest text-gray-500 group-hover:text-gray-300">Artistic Advising</div>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-8 backdrop-blur-md rounded-lg group hover:bg-white/10 transition duration-500 transform hover:-translate-y-2">
                        <Mic size={32} className="mx-auto text-purple-500/50 mb-4 group-hover:text-purple-400 transition"/>
                        <div className="text-3xl md:text-4xl font-bold font-display text-white mb-2">
                             <AnimatedStat value={stats.lyrics} />
                        </div>
                        <div className="text-[9px] uppercase tracking-widest text-gray-500 group-hover:text-gray-300">Lyrical Participation</div>
                    </div>

                     <div className="bg-white/5 border border-white/10 p-8 backdrop-blur-md rounded-lg group hover:bg-white/10 transition duration-500 transform hover:-translate-y-2">
                        <Video size={32} className="mx-auto text-red-500/50 mb-4 group-hover:text-red-400 transition"/>
                        <div className="text-3xl md:text-4xl font-bold font-display text-white mb-2">
                             <AnimatedStat value={stats.audiovisual} />
                        </div>
                        <div className="text-[9px] uppercase tracking-widest text-gray-500 group-hover:text-gray-300">Audiovisual Arts</div>
                    </div>
                </div>
            </div>
        </div>
    )
}

const PublicWall: React.FC = () => {
  const [columns, setColumns] = useState<WallItem[][]>([]);
  const [activeEffects, setActiveEffects] = useState({ title: '', wall: '', speed: 45 });
  const [isLocked, setIsLocked] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Stats Modal State
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [impactStats, setImpactStats] = useState<ImpactStats | null>(null);

  useEffect(() => {
    const init = async () => {
        // Check Lock Status
        const locked = await getSiteLockStatus();
        const sessionAccess = sessionStorage.getItem('uom_access_granted');
        
        if (locked && !sessionAccess) {
            setIsLocked(true);
        } else {
            loadContent();
        }
        
        // Load stats for the modal ahead of time
        const stats = await getImpactStats();
        setImpactStats(stats);
        
        setIsLoading(false);
    };
    init();

    // Responsive listener
    const handleResize = () => {
        if (!isLocked) loadContent();
    }
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Re-run if locked changes, but locked is state not prop.

  const loadContent = async () => {
    // Load visual effects
    const effects = await getVisualEffects();
    setActiveEffects(effects);

    // Prepare items for infinite scrolling columns
    const baseItems = await getWallItems();
    
    // Determine column count based on width
    const width = window.innerWidth;
    let colCount = 5;
    if (width < 768) colCount = 2;       // Mobile
    else if (width < 1024) colCount = 3; // Tablet
    
    // Initialize columns
    const distributed: WallItem[][] = Array.from({ length: colCount }, () => []);

    // Only process if we have items
    if (baseItems.length > 0) {
        // Create duplicates for scrolling
        const fullList = [...baseItems, ...baseItems, ...baseItems, ...baseItems, ...baseItems];
        fullList.forEach((item, index) => {
            distributed[index % colCount].push(item);
        });
        setColumns(distributed);
    } else {
        setColumns(Array.from({ length: colCount }, () => []));
    }
  };

  const handleUnlock = (e: React.FormEvent) => {
      e.preventDefault();
      if (keyInput === '8069987Pt') {
          sessionStorage.setItem('uom_access_granted', 'true');
          setIsLocked(false);
          setHasAccess(true);
          loadContent();
      } else {
          setError(true);
          setKeyInput('');
      }
  }

  // Helper to determine button placement class
  const getButtonPositionClass = () => {
      const pos = impactStats?.buttonPosition || 'center';
      switch(pos) {
          case 'left': return 'left-8';
          case 'right': return 'right-8';
          case 'center': default: return 'left-1/2 -translate-x-1/2';
      }
  }

  // Loading State
  if (isLoading) return <div className="h-screen bg-black"></div>;

  // Lock Screen
  if (isLocked) {
      return (
          <div className="h-screen bg-black text-white flex flex-col items-center justify-center p-8 relative overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1516280440614-6697288d5d38?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 blur-md"></div>
               
               <div className="z-10 bg-black/80 backdrop-blur-md border border-white/20 p-12 max-w-md w-full text-center space-y-8 shadow-2xl relative">
                   <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent"></div>
                   
                   <div className="flex justify-center mb-4">
                       <Shield size={48} className="text-white"/>
                   </div>
                   
                   <div>
                       <h1 className="text-3xl font-display font-bold text-white mb-2">UNIVERSAL <br/> ORCHARD</h1>
                       <p className="text-[10px] uppercase tracking-[0.3em] text-red-500 font-bold mt-2">Restricted Access</p>
                   </div>
                   
                   <p className="text-gray-400 text-xs leading-relaxed">
                       This portal is currently locked for members only. Please enter your access key to view the roster.
                   </p>

                   <form onSubmit={handleUnlock} className="space-y-4">
                        <div className="relative">
                            <input 
                                type="password"
                                value={keyInput}
                                onChange={(e) => setKeyInput(e.target.value)}
                                className={`w-full bg-black border p-4 text-center text-white tracking-[0.5em] outline-none focus:border-white transition-colors text-sm ${error ? 'border-red-500 animate-shake' : 'border-white/20'}`}
                                placeholder="••••••••"
                            />
                        </div>
                        <button type="submit" className="w-full bg-white text-black font-bold uppercase tracking-widest py-4 hover:bg-gray-200 transition text-xs flex justify-center items-center gap-2">
                             Enter Portal <ArrowRight size={14}/>
                        </button>
                   </form>
               </div>
               
               <div className="absolute bottom-8 text-[9px] text-gray-600 uppercase tracking-widest z-10">
                   System Locked by Administration
               </div>
          </div>
      )
  }

  return (
    <div className="h-screen bg-black text-white relative overflow-hidden flex flex-col font-sans">
      {/* Elegant Header - Mobile Adjusted Padding/Size */}
      <div className="absolute top-0 left-0 w-full p-4 md:p-8 z-50 flex justify-between items-start pointer-events-none mix-blend-difference">
        <div className="pointer-events-auto">
          {/* Apply Title Effect Here */}
          <div className={activeEffects.title}>
            <h1 className="text-3xl md:text-6xl font-display font-bold tracking-tighter text-white">
                UNIVERSAL <br/>
                <span className="italic font-light text-uom-white">ORCHARD MUSIC</span>
            </h1>
          </div>
          <div className="flex items-center gap-4 mt-2 md:mt-4">
            <div className="w-8 md:w-12 h-px bg-white"></div>
            <p className="text-[10px] md:text-xs uppercase tracking-[0.2em] font-light">Global Icons & Emerging Talent</p>
          </div>
        </div>
        <Link 
            to="/admin" 
            className="pointer-events-auto px-4 py-2 md:px-6 border border-white/40 hover:bg-white hover:text-black hover:border-white transition-all duration-300 rounded-sm text-[8px] md:text-[10px] uppercase tracking-[0.2em] backdrop-blur-sm"
        >
          Admin
        </Link>
      </div>

      {/* Infinite Animated Wall */}
      {columns.length === 0 || columns[0].length === 0 ? (
          <div className="flex-1 flex items-center justify-center opacity-30">
               <p className="text-xs uppercase tracking-[0.3em]">No Visuals Loaded</p>
          </div>
      ) : (
        // Mobile Optimization: Opacity 80% default (md:50%), no hover need on mobile.
        <div className="flex-1 flex gap-2 md:gap-4 -my-10 justify-center min-w-[120%] -ml-[10%] opacity-80 md:opacity-50 md:hover:opacity-90 transition-opacity duration-1000 ease-in-out">
            {columns.map((colItems, colIndex) => (
                <div 
                    key={colIndex} 
                    // Mobile Optimization: will-change-transform for GPU acceleration
                    className={`flex flex-col gap-2 md:gap-4 w-full md:w-64 lg:w-80 flex-shrink-0 ${colIndex % 2 === 0 ? 'animate-scroll-up' : 'animate-scroll-down'}`}
                    style={{ 
                        animationDuration: `${activeEffects.speed + colIndex * 5}s`,
                        willChange: 'transform' 
                    }}
                >
                    {/* Render items twice within the column to allow seamless looping if CSS translateY -50% is used */}
                    {[...colItems, ...colItems].map((item, idx) => (
                        <div key={`${colIndex}-${idx}`} className="relative group overflow-hidden grayscale-0 md:grayscale md:hover:grayscale-0 transition-all duration-700">
                            {/* Apply Wall Effect Here */}
                            <div className={activeEffects.wall}>
                                <img 
                                    src={item.imageUrl} 
                                    alt={item.title} 
                                    className="w-full h-auto object-cover aspect-[3/4] md:aspect-square"
                                    loading="lazy"
                                />
                            </div>
                            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center text-center p-4">
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] border-b border-white mb-2 pb-1">{item.type}</span>
                                <h3 className="text-2xl font-display italic text-white">{item.title}</h3>
                                <p className="text-xs text-gray-400 mt-2 uppercase tracking-widest">{item.subtitle}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ))}
        </div>
      )}
      
      {/* Vignetts & Credits */}
       <div className="absolute top-0 left-0 w-full h-32 md:h-48 bg-gradient-to-b from-black via-black/80 to-transparent pointer-events-none z-10"></div>
       <div className="absolute bottom-0 left-0 w-full h-32 md:h-48 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none z-10 flex items-end justify-center pb-8 px-4 text-center">
          <p className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-gray-500 leading-relaxed">
            All rights reserved, Universal Music Publishing, and its producers, Latin Grammy members, GalFly, and KRYLIN.
          </p>
       </div>

       {/* SPATIAL STATS MODAL - Kept for future use, trigger removed */}
       {impactStats && (
           <ImpactModal 
                isOpen={isStatsOpen} 
                onClose={() => setIsStatsOpen(false)} 
                stats={impactStats}
           />
       )}
    </div>
  );
};

export default PublicWall;