import React, { useEffect, useState } from 'react';

interface LoadingScreenProps {
  onComplete: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [percent, setPercent] = useState(0);
  const [text, setText] = useState("INITIALIZING SYSTEM");

  useEffect(() => {
    let interval: number;
    let currentPercent = 0;

    const runLoader = () => {
      // Non-linear increment
      const increment = Math.random() * 2 + 0.5;
      currentPercent += increment;

      if (currentPercent >= 100) {
        currentPercent = 100;
        setPercent(100);
        setText("SYSTEM READY");
        clearInterval(interval);
        setTimeout(onComplete, 800); // Slight delay at 100%
      } else {
        setPercent(Math.min(100, currentPercent));
        
        // Update text based on progress
        if (currentPercent > 20 && currentPercent < 40) setText("CONNECTING ORCHARD DB");
        else if (currentPercent > 40 && currentPercent < 60) setText("LOADING GLOBAL ROSTER");
        else if (currentPercent > 60 && currentPercent < 80) setText("SYNCHRONIZING VISUALS");
        else if (currentPercent > 80 && currentPercent < 99) setText("FINALIZING ASSETS");
      }
    };

    interval = window.setInterval(runLoader, 30); // Fast ticks

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black text-white flex flex-col items-center justify-center cursor-none">
      <div className="relative w-full max-w-lg px-8">
        {/* Large Percentage */}
        <div className="text-[12rem] leading-none font-display font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-800 text-center tracking-tighter">
          {Math.floor(percent)}
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-1 bg-gray-900 mt-8 relative overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-white transition-all duration-100 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Status Text */}
        <div className="flex justify-between items-end mt-4">
            <div className="text-xs uppercase tracking-[0.2em] font-mono text-gray-500 animate-pulse">
                {text}...
            </div>
            <div className="text-[10px] uppercase tracking-widest text-gray-600">
                v2.4.0-RC
            </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/50"></div>
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/50"></div>
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/50"></div>
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/50"></div>
      </div>
    </div>
  );
};

export default LoadingScreen;