
import React, { useState } from 'react';
import { generateImage } from '../services/geminiService';
import { GeneratedImage } from '../types';

const ImageGenView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    try {
      const url = await generateImage(prompt);
      if (url) {
        setImages(prev => [{ id: Date.now().toString(), url, prompt, timestamp: new Date() }, ...prev]);
        setPrompt('');
      }
    } catch (err) {
      console.error('Erreur de génération:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <h2 className="text-3xl font-bold text-white tracking-tight">Studio Vision</h2>
          <p className="text-slate-400">Donnez vie à vos idées grâce à la génération d'images haute qualité par IA.</p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="relative group">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Décrivez précisément l'image que vous souhaitez créer..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 pr-24 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all text-white min-h-[120px] resize-none"
            />
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg"
            >
              {isGenerating ? <i className="fas fa-circle-notch animate-spin"></i> : 'Créer'}
            </button>
          </div>
        </div>

        {images.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((img) => (
              <div key={img.id} className="glass-panel rounded-2xl overflow-hidden border border-white/10 group">
                <div className="aspect-square relative overflow-hidden bg-white/5">
                  <img src={img.url} alt={img.prompt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                </div>
                <div className="p-4 space-y-2">
                  <p className="text-sm text-slate-300 line-clamp-2">{img.prompt}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                    {img.timestamp.toLocaleDateString()} {img.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {images.length === 0 && !isGenerating && (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500 space-y-4">
            <i className="fas fa-magic text-4xl opacity-20"></i>
            <p className="text-sm">Aucune image générée. Commencez à créer !</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageGenView;
