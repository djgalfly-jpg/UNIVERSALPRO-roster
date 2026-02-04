import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import PublicWall from './components/PublicWall';
import AdminDashboard from './components/AdminDashboard';
import ArtistLandingPage from './components/ArtistLandingPage';
import LiveAssistant from './components/LiveAssistant';
import LoadingScreen from './components/LoadingScreen';

// Error Boundary Component to catch crashes
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">SYSTEM CRITICAL ERROR</h1>
          <p className="text-gray-400 mb-4">The Universal Orchard system encountered an unexpected issue.</p>
          <pre className="bg-gray-900 p-4 rounded text-xs text-left overflow-auto max-w-lg border border-red-900/50 text-red-200">
            {this.state.error?.toString()}
          </pre>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-8 px-6 py-2 border border-white hover:bg-white hover:text-black uppercase tracking-widest text-xs transition"
          >
            Reboot System
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);

  return (
    <ErrorBoundary>
      <div className="antialiased bg-black min-h-screen text-white">
        {loading ? (
          <LoadingScreen onComplete={() => setLoading(false)} />
        ) : (
          <HashRouter>
            <Routes>
              <Route path="/" element={<PublicWall />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/artist/:id" element={<ArtistLandingPage />} />
            </Routes>
            <LiveAssistant />
          </HashRouter>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;