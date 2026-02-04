import React, { useEffect, useState } from 'react';
import { WallItem } from '../types';
import { getWallItems, getVisualEffects, getSiteLockStatus } from '../services/store';
import { Link } from 'react-router-dom';
import { Lock, ArrowRight, Shield } from 'lucide-react';

const PublicWall: React.FC = () => {
  const [columns, setColumns] = useState<WallItem[][]>([[], [], [], [], []]);
  const [activeEffects, setActiveEffects] = useState({ title: '', wall: '', speed: 45 });
  const [isLocked, setIsLocked] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
        setIsLoading(false);
    };
    init();
  }, []);

  const loadContent = async () => {
    // Load visual effects
    const effects = await getVisualEffects();
    setActiveEffects(effects);

    // Prepare items for infinite scrolling columns
    const baseItems = await getWallItems();
    
    // Only process if we have items
    if (baseItems.length > 0) {
        // Create duplicates for scrolling
        const distributed: WallItem[][] = [[], [], [], [], []];
        const fullList = [...baseItems, ...baseItems, ...baseItems, ...baseItems, ...baseItems];
        fullList.forEach((item, index) => {
            distributed[index % 5].push(item);
        });
        setColumns(distributed);
    } else {
        setColumns([[],[],[],[],[]]);
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
      {/* Elegant Header */}
      <div className="absolute top-0 left-0 w-full p-8 z-50 flex justify-between items-start pointer-events-none mix-blend-difference">
        <div className="pointer-events-auto">
          {/* Apply Title Effect Here */}
          <div className={activeEffects.title}>
            <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tighter text-white">
                UNIVERSAL <br/>
                <span className="italic font-light text-uom-white">ORCHARD MUSIC</span>
            </h1>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <div className="w-12 h-px bg-white"></div>
            <p className="text-xs uppercase tracking-[0.2em] font-light">Global Icons & Emerging Talent</p>
          </div>
        </div>
        <Link 
            to="/admin" 
            className="pointer-events-auto px-6 py-2 border border-white/40 hover:bg-white hover:text-black hover:border-white transition-all duration-300 rounded-sm text-[10px] uppercase tracking-[0.2em] backdrop-blur-sm"
        >
          Admin
        </Link>
      </div>

      {/* Infinite Animated Wall */}
      {columns[0].length === 0 ? (
          <div className="flex-1 flex items-center justify-center opacity-30">
               <p className="text-xs uppercase tracking-[0.3em]">No Visuals Loaded</p>
          </div>
      ) : (
        <div className="flex-1 flex gap-4 -my-10 justify-center min-w-[120%] -ml-[10%] opacity-50 hover:opacity-90 transition-opacity duration-1000 ease-in-out">
            {columns.map((colItems, colIndex) => (
                <div 
                    key={colIndex} 
                    className={`flex flex-col gap-4 w-64 md:w-80 flex-shrink-0 ${colIndex % 2 === 0 ? 'animate-scroll-up' : 'animate-scroll-down'}`}
                    style={{ animationDuration: `${activeEffects.speed + colIndex * 5}s` }}
                >
                    {/* Render items twice within the column to allow seamless looping if CSS translateY -50% is used */}
                    {[...colItems, ...colItems].map((item, idx) => (
                        <div key={`${colIndex}-${idx}`} className="relative group overflow-hidden grayscale hover:grayscale-0 transition-all duration-700">
                            {/* Apply Wall Effect Here */}
                            <div className={activeEffects.wall}>
                                <img 
                                    src={item.imageUrl} 
                                    alt={item.title} 
                                    className="w-full h-auto object-cover aspect-[3/4] md:aspect-square"
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
       <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-black via-black/80 to-transparent pointer-events-none z-10"></div>
       <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none z-10 flex items-end justify-center pb-8 px-4 text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 leading-relaxed">
            All rights reserved, Universal Music Publishing, and its producers, Latin Grammy members, GalFly, and KRYLIN.
          </p>
       </div>
    </div>
  );
};

export default PublicWall;