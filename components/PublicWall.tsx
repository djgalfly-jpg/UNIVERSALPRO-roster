import React, { useEffect, useState, useRef } from 'react';
import { WallItem, ImpactStats } from '../types';
import { getWallItems, getVisualEffects, getSiteLockStatus, getImpactStats } from '../services/store';
import { Link } from 'react-router-dom';
import { Lock, ArrowRight, Shield, X, Trophy, Disc, Mic, Video, Users } from 'lucide-react';

// --- Animated Starfield Background (Mobile Optimized) ---
const StarfieldBackground = React.memo(() => (
    <div className="absolute inset-0 bg-black overflow-hidden z-0 pointer-events-none">
         {/* Layer 1: Small stars - Extremely reduced for mobile stability */}
        <div className="absolute inset-0 animate-pulse" style={{ animationDuration: '4s' }}>
            {Array.from({ length: 15 }).map((_, i) => (
                <div 
                    key={`s1-${i}`}
                    className="absolute bg-white rounded-full opacity-30"
                    style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        width: '1px',
                        height: '1px',
                    }}
                />
            ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black"></div>
    </div>
));

// --- Animated Number Component ---
const AnimatedStat: React.FC<{ value: string }> = ({ value }) => {
    const [displayValue, setDisplayValue] = useState(0);
    const [prefix, setPrefix] = useState('');
    const [suffix, setSuffix] = useState('');

    useEffect(() => {
        const match = value.match(/(\D*)(\d+(\.\d+)?)(\D*)/);
        if (match) {
            setPrefix(match[1]);
            const num = parseFloat(match[2]);
            setSuffix(match[4]);
            
            let startTime = performance.now();
            const duration = 2000;
            const animate = (currentTime: number) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const ease = 1 - Math.pow(1 - progress, 4); // EaseOutQuart
                setDisplayValue(Math.floor(num * ease));

                if (progress < 1) requestAnimationFrame(animate);
                else setDisplayValue(num);
            };
            requestAnimationFrame(animate);
        } else {
            setPrefix(value);
        }
    }, [value]);

    if (!value.match(/\d/)) return <span>{value}</span>;
    return <span>{prefix}{displayValue.toLocaleString()}{suffix}</span>;
};

const ImpactModal: React.FC<{ isOpen: boolean, onClose: () => void, stats: ImpactStats }> = ({ isOpen, onClose, stats }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center animate-fade-in-up">
            <StarfieldBackground />
            <div className="relative z-10 w-full max-w-6xl p-8 flex flex-col h-full md:h-auto justify-center">
                <button onClick={onClose} className="absolute top-8 right-8 text-white hover:text-gray-300 transition hover:rotate-90 duration-300 z-50">
                    <X size={32} />
                </button>
                <div className="text-center mb-12">
                    <h2 className="text-4xl md:text-7xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-white to-gray-400 tracking-tighter mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">GLOBAL IMPACT</h2>
                    <p className="text-[10px] md:text-sm uppercase tracking-[0.3em] text-gray-400">Universal Orchard Music Group Statistics</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 text-center">
                    <div className="bg-white/5 border border-white/10 p-8 backdrop-blur-md rounded-lg group hover:bg-white/10 transition duration-500 transform hover:-translate-y-2">
                        <Disc size={32} className="mx-auto text-gray-400 mb-4 group-hover:text-white transition"/>
                        <div className="text-3xl md:text-4xl font-bold font-display text-white mb-2"><AnimatedStat value={stats.produced} /></div>
                        <div className="text-[9px] uppercase tracking-widest text-gray-500 group-hover:text-gray-300">Artists Produced</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-8 backdrop-blur-md rounded-lg group hover:bg-white/10 transition duration-500 transform hover:-translate-y-2">
                        <Trophy size={32} className="mx-auto text-yellow-500/50 mb-4 group-hover:text-yellow-400 transition"/>
                        <div className="text-3xl md:text-4xl font-bold font-display text-white mb-2"><AnimatedStat value={stats.promoted} /></div>
                        <div className="text-[9px] uppercase tracking-widest text-gray-500 group-hover:text-gray-300">Artists Promoted</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-8 backdrop-blur-md rounded-lg group hover:bg-white/10 transition duration-500 transform hover:-translate-y-2">
                        <Users size={32} className="mx-auto text-blue-500/50 mb-4 group-hover:text-blue-400 transition"/>
                        <div className="text-3xl md:text-4xl font-bold font-display text-white mb-2"><AnimatedStat value={stats.advised} /></div>
                        <div className="text-[9px] uppercase tracking-widest text-gray-500 group-hover:text-gray-300">Artistic Advising</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-8 backdrop-blur-md rounded-lg group hover:bg-white/10 transition duration-500 transform hover:-translate-y-2">
                        <Mic size={32} className="mx-auto text-purple-500/50 mb-4 group-hover:text-purple-400 transition"/>
                        <div className="text-3xl md:text-4xl font-bold font-display text-white mb-2"><AnimatedStat value={stats.lyrics} /></div>
                        <div className="text-[9px] uppercase tracking-widest text-gray-500 group-hover:text-gray-300">Lyrical Participation</div>
                    </div>
                     <div className="bg-white/5 border border-white/10 p-8 backdrop-blur-md rounded-lg group hover:bg-white/10 transition duration-500 transform hover:-translate-y-2">
                        <Video size={32} className="mx-auto text-red-500/50 mb-4 group-hover:text-red-400 transition"/>
                        <div className="text-3xl md:text-4xl font-bold font-display text-white mb-2"><AnimatedStat value={stats.audiovisual} /></div>
                        <div className="text-[9px] uppercase tracking-widest text-gray-500 group-hover:text-gray-300">Audiovisual Arts</div>
                    </div>
                </div>
            </div>
        </div>
    )
}

const PublicWall: React.FC = () => {
  const [columns, setColumns] = useState<WallItem[][]>([]);
  const [activeEffects, setActiveEffects] = useState({ title: '', wall: '', wallMobile: '', speed: 45, speedMobile: 40 });
  const [isLocked, setIsLocked] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Mobile Detection
  const [isMobile, setIsMobile] = useState(false);

  // Stats Modal State
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [impactStats, setImpactStats] = useState<ImpactStats | null>(null);

  // Use refs for stabilization (Typed as any to handle browser/node env mismatch without crashes)
  const resizeTimeoutRef = useRef<any>(null);

  useEffect(() => {
    const init = async () => {
        const mobile = window.innerWidth < 768;
        setIsMobile(mobile);

        // Check Lock Status
        const locked = await getSiteLockStatus();
        const sessionAccess = sessionStorage.getItem('uom_access_granted');
        
        if (locked && !sessionAccess) {
            setIsLocked(true);
        } else {
            loadContent(mobile);
        }
        
        // Load stats for the modal ahead of time
        const stats = await getImpactStats();
        setImpactStats(stats);
        
        setIsLoading(false);
    };
    init();

    // Debounced Responsive listener to prevent crash loops on iOS scroll
    const handleResize = () => {
        if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
        
        resizeTimeoutRef.current = setTimeout(() => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (!isLocked) loadContent(mobile);
        }, 500); // 500ms debounce for stability
    }
    
    window.addEventListener('resize', handleResize);
    return () => {
        window.removeEventListener('resize', handleResize);
        if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
    };
  }, []); 

  const loadContent = async (mobileOverride?: boolean) => {
    const effects = await getVisualEffects();
    setActiveEffects(prev => ({ ...prev, ...effects }));

    const baseItems = await getWallItems();
    
    const width = window.innerWidth;
    const isMob = mobileOverride !== undefined ? mobileOverride : width < 768;

    let colCount = 5;
    if (isMob) colCount = 2;       
    else if (width < 1024) colCount = 3; 
    
    if (baseItems.length > 0) {
        // Distribute base items to columns
        const distributed: WallItem[][] = Array.from({ length: colCount }, () => []);
        baseItems.forEach((item, index) => {
            distributed[index % colCount].push(item);
        });

        // CRITICAL IOS CRASH FIX:
        // We must strictly limit the number of items per column to ensure the 
        // generated layer height remains under ~4000px (approx 12-15 cards).
        // Exceeding this causes iOS WebKit to run out of memory and reload.
        
        const MAX_SAFE_ITEMS_PER_COL = isMob ? 8 : 12; // Mobile limit is stricter

        const finalColumns = distributed.map(col => {
            if (col.length === 0) return [];
            let newCol = [...col];

            // 1. Fill if too short (for smooth loop)
            while (newCol.length < MAX_SAFE_ITEMS_PER_COL) {
                newCol = [...newCol, ...col]; // Repeat content
            }
            
            // 2. Clamp if too long (prevent memory crash)
            if (newCol.length > MAX_SAFE_ITEMS_PER_COL) {
                newCol = newCol.slice(0, MAX_SAFE_ITEMS_PER_COL);
            }
            return newCol;
        });

        setColumns(finalColumns);
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
          loadContent(window.innerWidth < 768);
      } else {
          setError(true);
          setKeyInput('');
      }
  }

  const currentWallEffect = isMobile ? (activeEffects.wallMobile || activeEffects.wall) : activeEffects.wall;
  const currentSpeed = isMobile ? activeEffects.speedMobile : activeEffects.speed;

  if (isLoading) return <div className="h-screen bg-black"></div>;

  if (isLocked) {
      return (
          <div className="h-screen bg-black text-white flex flex-col items-center justify-center p-8 relative overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1516280440614-6697288d5d38?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 blur-md"></div>
               <div className="z-10 bg-black/80 backdrop-blur-md border border-white/20 p-12 max-w-md w-full text-center space-y-8 shadow-2xl relative">
                   <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent"></div>
                   <div className="flex justify-center mb-4"><Shield size={48} className="text-white"/></div>
                   <div>
                       <h1 className="text-3xl font-display font-bold text-white mb-2">UNIVERSAL <br/> ORCHARD</h1>
                       <p className="text-[10px] uppercase tracking-[0.3em] text-red-500 font-bold mt-2">Restricted Access</p>
                   </div>
                   <p className="text-gray-400 text-xs leading-relaxed">This portal is currently locked for members only. Please enter your access key to view the roster.</p>
                   <form onSubmit={handleUnlock} className="space-y-4">
                        <div className="relative">
                            <input type="password" value={keyInput} onChange={(e) => setKeyInput(e.target.value)} className={`w-full bg-black border p-4 text-center text-white tracking-[0.5em] outline-none focus:border-white transition-colors text-sm ${error ? 'border-red-500 animate-shake' : 'border-white/20'}`} placeholder="••••••••" />
                        </div>
                        <button type="submit" className="w-full bg-white text-black font-bold uppercase tracking-widest py-4 hover:bg-gray-200 transition text-xs flex justify-center items-center gap-2">Enter Portal <ArrowRight size={14}/></button>
                   </form>
               </div>
               <div className="absolute bottom-8 text-[9px] text-gray-600 uppercase tracking-widest z-10">System Locked by Administration</div>
          </div>
      )
  }

  return (
    <div className="h-screen bg-black text-white relative overflow-hidden flex flex-col font-sans">
      {/* Header - Removed mix-blend-mode to reduce GPU cost on mobile */}
      <div className="absolute top-0 left-0 w-full p-4 md:p-8 z-50 flex justify-between items-start pointer-events-none">
        <div className="pointer-events-auto drop-shadow-md">
          <div className={activeEffects.title}>
            <h1 className="text-3xl md:text-6xl font-display font-bold tracking-tighter text-white">UNIVERSAL <br/><span className="italic font-light text-uom-white">ORCHARD MUSIC</span></h1>
          </div>
          <div className="flex items-center gap-4 mt-2 md:mt-4">
            <div className="w-8 md:w-12 h-px bg-white"></div>
            <p className="text-[10px] md:text-xs uppercase tracking-[0.2em] font-light">Global Icons & Emerging Talent</p>
          </div>
        </div>
        <Link to="/admin" className="pointer-events-auto px-4 py-2 md:px-6 border border-white/40 hover:bg-white hover:text-black hover:border-white transition-all duration-300 rounded-sm text-[8px] md:text-[10px] uppercase tracking-[0.2em] backdrop-blur-sm bg-black/20">Admin</Link>
      </div>

      {columns.length === 0 || columns[0].length === 0 ? (
          <div className="flex-1 flex items-center justify-center opacity-30"><p className="text-xs uppercase tracking-[0.3em]">No Visuals Loaded</p></div>
      ) : (
        <div className="flex-1 flex gap-2 md:gap-4 -my-10 justify-center min-w-[120%] -ml-[10%] opacity-80 md:opacity-50 md:hover:opacity-90 transition-opacity duration-1000 ease-in-out">
            {columns.map((colItems, colIndex) => (
                <div 
                    key={colIndex} 
                    // Use translateZ to force hardware acceleration without 'will-change' overhead
                    className={`flex flex-col gap-2 md:gap-4 w-full md:w-64 lg:w-80 flex-shrink-0 ${colIndex % 2 === 0 ? 'animate-scroll-up' : 'animate-scroll-down'}`}
                    style={{ 
                        animationDuration: `${currentSpeed + colIndex * 5}s`,
                        transform: 'translateZ(0)',
                        WebkitBackfaceVisibility: 'hidden'
                    }}
                >
                    {/* Render Loop: strictly duplicates valid items for seamless infinite scroll */}
                    {[...colItems, ...colItems].map((item, idx) => (
                        <div key={`${colIndex}-${idx}`} className="relative group overflow-hidden grayscale-0 md:grayscale md:hover:grayscale-0 transition-all duration-700 transform-gpu">
                            <div className={currentWallEffect}>
                                <img 
                                    src={item.imageUrl} 
                                    alt={item.title} 
                                    className="w-full h-auto object-cover aspect-[3/4] md:aspect-square" 
                                    loading="lazy" 
                                    decoding="async"
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
      
       <div className="absolute top-0 left-0 w-full h-32 md:h-48 bg-gradient-to-b from-black via-black/80 to-transparent pointer-events-none z-10"></div>
       <div className="absolute bottom-0 left-0 w-full h-32 md:h-48 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none z-10 flex items-end justify-center pb-8 px-4 text-center">
          <p className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-gray-500 leading-relaxed">All rights reserved, Universal Music Publishing, and its producers, Latin Grammy members, GalFly, and KRYLIN.</p>
       </div>

       {impactStats && (
           <ImpactModal isOpen={isStatsOpen} onClose={() => setIsStatsOpen(false)} stats={impactStats} />
       )}
    </div>
  );
};

export default PublicWall;