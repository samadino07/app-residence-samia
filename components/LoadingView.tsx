
import React, { useState, useEffect } from 'react';

const LOGO_URL = "https://i.ibb.co/XZZBLSSW/Chat-GPT-Image-Dec-31-2025-02-10-28-AM.png";

const SLOGANS = [
  "L'excellence est un voyage, pas une destination.",
  "Chaque détail compte pour offrir l'exceptionnel.",
  "Votre passion est le moteur de notre prestige.",
  "L'art de l'accueil commence par votre sourire.",
  "Ensemble, nous redéfinissons le luxe au quotidien.",
  "La perfection est notre standard, vous êtes nos artistes.",
  "Inspirés par l'histoire, portés par votre talent."
];

const LoadingView: React.FC = () => {
  const [slogan, setSlogan] = useState("");

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * SLOGANS.length);
    setSlogan(SLOGANS[randomIndex]);
  }, []);

  return (
    <div className="fixed inset-0 bg-[#0a0202] flex flex-col items-center justify-center z-[100] overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div 
            key={i}
            className="absolute bg-white/10 rounded-full blur-sm animate-float"
            style={{
              width: Math.random() * 6 + 2 + 'px',
              height: Math.random() * 6 + 2 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animationDuration: Math.random() * 10 + 10 + 's',
              animationDelay: Math.random() * 5 + 's',
              opacity: Math.random() * 0.5
            }}
          />
        ))}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-rose-950/20 rounded-full blur-[150px] animate-pulse"></div>
      </div>
      
      <div className="relative flex flex-col items-center space-y-12 z-10 animate-in fade-in zoom-in duration-1000">
        <div className="relative">
          <div className="absolute inset-0 bg-rose-900/40 rounded-full blur-3xl animate-pulse scale-110"></div>
          <div className="absolute -inset-4 border border-white/5 rounded-[3rem] animate-spin-slow"></div>
          
          <div className="w-40 h-40 md:w-52 md:h-52 rounded-[2.8rem] overflow-hidden shadow-[0_0_50px_rgba(153,27,27,0.4)] border border-white/20 p-1.5 bg-[#1a0505] relative z-10 animate-float">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 -translate-x-full animate-shimmer"></div>
            <img 
              src={LOGO_URL} 
              alt="Logo Samia" 
              className="w-full h-full object-cover rounded-[2.4rem] transition-transform duration-700 hover:scale-105" 
            />
          </div>
        </div>

        <div className="text-center space-y-6 px-12 max-w-xl">
          <div className="space-y-3">
            <h2 className="text-[10px] md:text-xs font-black text-rose-500 uppercase tracking-[0.5em] mb-4 opacity-80 animate-in slide-in-from-top-4 duration-700">
              Executive Center • Samia Hub
            </h2>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter italic uppercase animate-in fade-in duration-1000 delay-300">
              SAMIA <span className="text-rose-700 relative">SUITE<span className="absolute -bottom-1 left-0 w-full h-[3px] bg-rose-900/30"></span></span>
            </h1>
          </div>
          
          <div className="flex items-center justify-center space-x-4 py-2">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-rose-900"></div>
            <div className="w-1.5 h-1.5 bg-rose-900 rounded-full"></div>
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-rose-900"></div>
          </div>
          
          <div className="min-h-[3rem] flex items-center justify-center">
            <p className="text-slate-100 text-sm md:text-lg italic font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
              "{slogan}"
            </p>
          </div>
        </div>

        <div className="pt-10 flex flex-col items-center space-y-6 w-72">
          <div className="relative w-full h-[3px] bg-white/5 rounded-full overflow-hidden border border-white/5">
            <div className="h-full bg-gradient-to-r from-rose-950 via-rose-700 to-white animate-loading-bar shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
          </div>
          
          <div className="flex flex-col items-center space-y-3">
            <div className="flex items-center space-x-3 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">
              <span className="animate-pulse">Initialisation Sécurisée</span>
              <div className="flex space-x-1">
                <span className="w-1 h-1 bg-rose-700 rounded-full animate-bounce"></span>
                <span className="w-1 h-1 bg-rose-700 rounded-full animate-bounce delay-100"></span>
                <span className="w-1 h-1 bg-rose-700 rounded-full animate-bounce delay-200"></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 flex flex-col items-center space-y-2 opacity-30">
        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.4em]">Propriété de Résidence Samia Suit Hotel</p>
        <div className="text-[10px] font-black text-white tracking-widest uppercase">
          HUB OS <span className="text-rose-700">v4.2</span>
        </div>
      </div>

      <style>{`
        @keyframes loading-bar {
          0% { width: 0%; left: 0; }
          100% { width: 100%; left: 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(1deg); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-150%) skewX(-20deg); }
          100% { transform: translateX(150%) skewX(-20deg); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-loading-bar {
          animation: loading-bar 5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 15s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default LoadingView;
