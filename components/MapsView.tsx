
import React, { useState, useEffect } from 'react';
import { findNearbyPlaces } from '../services/geminiService';
import { HotelSite } from '../types';

interface MapsViewProps {
  site: HotelSite;
}

const SITE_COORDS: Record<string, { lat: number, lng: number }> = {
  'Fnideq': { lat: 35.8504, lng: -5.3533 },
  'M\'diq': { lat: 35.6858, lng: -5.3253 },
  'Al Hoceima': { lat: 35.2472, lng: -3.9322 }
};

const MapsView: React.FC<MapsViewProps> = ({ site }) => {
  const [query, setQuery] = useState('Pharmacies de garde à proximité');
  const [results, setResults] = useState<{ text: string, sources: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!query.trim() || isLoading) return;
    setIsLoading(true);
    setError('');
    try {
      const coords = SITE_COORDS[site] || { lat: 35.8504, lng: -5.3533 };
      const res = await findNearbyPlaces(`${query} à ${site}, Maroc`, coords);
      setResults(res);
    } catch (err) {
      setError('Erreur de recherche.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setResults(null);
  }, [site]);

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-y-auto">
      <div className="p-4 md:p-8 space-y-8 max-w-4xl mx-auto w-full">
        <div className="text-center space-y-3">
          <div className="inline-block px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black text-blue-400 uppercase tracking-widest">
            Service Conciergerie • {site}
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Lieux & Services</h2>
          <p className="text-slate-400 text-sm">Aidez nos clients à trouver ce qu'ils cherchent autour de la résidence.</p>
        </div>

        <div className="space-y-4">
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <i className="fas fa-map-pin absolute left-4 top-1/2 -translate-y-1/2 text-blue-500"></i>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Ex: Restaurants de poissons, banques..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
              />
            </div>
            <button onClick={handleSearch} disabled={isLoading} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold transition-all disabled:opacity-50">
              {isLoading ? <i className="fas fa-spinner animate-spin"></i> : 'Chercher'}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {['Banques', 'Pharmacies', 'Supermarchés', 'Restaurants'].map(tag => (
              <button key={tag} onClick={() => { setQuery(tag); handleSearch(); }} className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-400 hover:bg-white/10 hover:text-white transition-all">
                {tag}
              </button>
            ))}
          </div>
        </div>

        {results && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="glass-panel rounded-2xl p-6 border border-white/10">
              <p className="text-slate-200 leading-relaxed text-sm whitespace-pre-wrap">{results.text}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.sources.map((src, idx) => (
                <a key={idx} href={src.uri} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-blue-600/10 transition-colors group">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all"><i className="fas fa-directions"></i></div>
                  <div className="flex-1 min-w-0"><p className="font-bold text-white truncate text-sm">{src.title}</p><p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Voir l'itinéraire</p></div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapsView;
