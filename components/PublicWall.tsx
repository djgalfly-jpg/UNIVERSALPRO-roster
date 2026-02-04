import React, { useEffect, useState } from 'react';
import { WallItem } from '../types';
import { getWallItems, getVisualEffects } from '../services/store';
import { Link } from 'react-router-dom';

const PublicWall: React.FC = () => {
  const [columns, setColumns] = useState<WallItem[][]>([[], [], [], [], []]);
  const [activeEffects, setActiveEffects] = useState({ title: '', wall: '' });

  useEffect(() => {
    const fetchData = async () => {
        // Load initial visual effects
        const effects = await getVisualEffects();
        setActiveEffects(effects);

        // Prepare items for infinite scrolling columns
        const baseItems = await getWallItems();
        
        // Create enough duplicates to ensure smooth scrolling loop
        const distributed: WallItem[][] = [[], [], [], [], []];
        
        // Fill 5 columns
        const fullList = [...baseItems, ...baseItems, ...baseItems, ...baseItems, ...baseItems]; // 5x duplication
        
        fullList.forEach((item, index) => {
            distributed[index % 5].push(item);
        });

        setColumns(distributed);
    };

    fetchData();

    // Listen for changes from other tabs (Admin Panel) via custom event
    const handleStorageChange = (e: Event) => {
        // Custom event from same window
        if (e.type === 'storage_fx_update') {
             fetchData();
        }
    };
    
    // Also listen to storage event for cross-tab updates (less reliable with DB but still good practice for events)
    const handleStorageEvent = (e: StorageEvent) => {
        if (e.key === 'uom_fx_title' || e.key === 'uom_fx_wall') {
             fetchData();
        }
    }

    window.addEventListener('storage_fx_update', handleStorageChange);
    window.addEventListener('storage', handleStorageEvent);


    return () => {
        window.removeEventListener('storage_fx_update', handleStorageChange);
        window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

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
      <div className="flex-1 flex gap-4 -my-10 justify-center min-w-[120%] -ml-[10%] opacity-50 hover:opacity-90 transition-opacity duration-1000 ease-in-out">
        {columns.map((colItems, colIndex) => (
            <div 
                key={colIndex} 
                className={`flex flex-col gap-4 w-64 md:w-80 flex-shrink-0 ${colIndex % 2 === 0 ? 'animate-scroll-up' : 'animate-scroll-down'}`}
                style={{ animationDuration: `${40 + colIndex * 5}s` }} // Varied speeds
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