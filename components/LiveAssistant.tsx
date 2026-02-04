import React, { useState, useEffect } from 'react';
import { Mic, MicOff, X, Loader2 } from 'lucide-react';
import { LiveClient } from '../services/geminiService';

const LiveAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [client, setClient] = useState<LiveClient | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (client) client.disconnect();
    };
  }, [client]);

  const toggleSession = async () => {
    if (status === 'connected' || status === 'connecting') {
      if (client) client.disconnect();
      setStatus('disconnected');
      setClient(null);
    } else {
      const newClient = new LiveClient((s: any) => setStatus(s));
      setClient(newClient);
      await newClient.connect();
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-white text-black p-4 rounded-full shadow-lg hover:scale-110 transition-transform z-50 flex items-center gap-2 font-bold uppercase tracking-wider text-xs border border-gray-200"
      >
        <Mic size={18} />
        <span className="hidden md:inline">Voice Assistant</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 bg-gray-900 border border-white/20 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col">
      <div className="bg-white text-black p-3 flex justify-between items-center">
        <h3 className="font-bold flex items-center gap-2 uppercase tracking-widest text-xs"><Mic size={14}/> Lucía - AI A&R</h3>
        <button onClick={() => { 
            if(status === 'connected' && client) client.disconnect();
            setIsOpen(false); 
        }} className="hover:bg-black/10 p-1 rounded"><X size={18}/></button>
      </div>
      
      <div className="p-6 flex flex-col items-center justify-center min-h-[200px] space-y-4">
        {status === 'connecting' && <Loader2 className="animate-spin text-white" size={48} />}
        
        {status === 'disconnected' && (
           <p className="text-center text-gray-400 text-xs">Tap to chat with Lucía. Real-time artist data & talent scouting.</p>
        )}

        {status === 'connected' && (
             <div className="relative">
                 <div className="absolute inset-0 bg-white blur-xl opacity-20 animate-pulse rounded-full"></div>
                 <Mic size={48} className="text-white relative z-10" />
             </div>
        )}

        {status === 'error' && <p className="text-red-500 text-xs">Connection failed.</p>}
        
        <button 
            onClick={toggleSession}
            className={`px-6 py-2 rounded-full font-bold transition-all uppercase tracking-widest text-xs ${
                status === 'connected' 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-white text-black hover:bg-gray-200'
            }`}
        >
            {status === 'connecting' ? 'Connecting...' : status === 'connected' ? 'End Chat' : 'Start Chat'}
        </button>
        
        <div className="text-[9px] text-gray-600 text-center uppercase tracking-wider pt-2 border-t border-white/10 w-full">
            Official: Universalorchardmusicgroup.pro
        </div>
      </div>
    </div>
  );
};

export default LiveAssistant;