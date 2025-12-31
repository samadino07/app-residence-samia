
import React, { useState } from 'react';
import { authService } from '../services/authService';
import { User, UserRole } from '../types';

const LOGO_URL = "https://i.ibb.co/XZZBLSSW/Chat-GPT-Image-Dec-31-2025-02-10-28-AM.png";

const ROLES: UserRole[] = ['Boss', 'Gérant', 'Chef de Cuisine', 'Magasinier', 'Caissier', 'Réceptionniste'];

interface AuthViewProps {
  onLogin: (user: User) => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Gérant');
  const [stayConnected, setStayConnected] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const getPlaceholder = () => {
    switch(role) {
      case 'Boss': return 'ID: 1';
      case 'Gérant': return 'ID Gérant';
      default: return 'ID';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = authService.login(email, password, role, stayConnected);
      onLogin(user);
    } catch (err: any) {
      setError(err.message || 'Accès refusé');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-[#070101] overflow-y-auto">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-rose-950/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-rose-900/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative w-full max-w-[340px] animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="bg-[#120303]/90 backdrop-blur-3xl rounded-[2.5rem] p-6 shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/5 relative overflow-hidden">
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-3">
              <div className="absolute inset-0 bg-rose-900/20 blur-xl rounded-full scale-125 animate-pulse"></div>
              <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-2xl border border-white/10 p-1 bg-[#1a0505] relative z-10">
                <img src={LOGO_URL} alt="Logo" className="w-full h-full object-cover rounded-xl opacity-90" />
              </div>
            </div>
            
            <div className="text-center">
              <h1 className="text-xl font-black text-white tracking-tighter uppercase italic">Samia <span className="text-rose-700">Suite</span></h1>
              <p className="text-[7px] font-black text-rose-500/60 uppercase tracking-[0.4em] mt-0.5">System Hub v4.2</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-500 uppercase ml-2 tracking-widest">Poste</label>
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:border-rose-800 outline-none transition-all text-slate-200 font-bold text-[11px] appearance-none"
                >
                  {ROLES.map(r => <option key={r} value={r} className="bg-[#1a0505]">{r}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600">
                  <i className="fas fa-chevron-down text-[8px]"></i>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-500 uppercase ml-2 tracking-widest">Identifiant</label>
              <input
                type="text"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:border-rose-800 outline-none transition-all text-white font-bold text-[11px] placeholder:text-slate-700"
                placeholder={getPlaceholder()}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-500 uppercase ml-2 tracking-widest">Pass</label>
              <input
                type="password"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:border-rose-800 outline-none transition-all text-white font-bold text-[11px] placeholder:text-slate-700"
                placeholder="••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="flex items-center px-1 pt-1">
              <label className="flex items-center cursor-pointer group">
                <input type="checkbox" checked={stayConnected} onChange={(e) => setStayConnected(e.target.checked)} className="sr-only" />
                <div className={`w-3.5 h-3.5 border rounded-md transition-all flex items-center justify-center ${stayConnected ? 'bg-rose-700 border-rose-700' : 'bg-transparent border-white/10'}`}>
                  {stayConnected && <i className="fas fa-check text-white text-[7px]"></i>}
                </div>
                <span className="ml-2 text-[9px] font-bold text-slate-500 uppercase tracking-tight">Maintenir session</span>
              </label>
            </div>
            {error && (
              <div className="bg-rose-950/20 text-rose-500 text-[8px] font-black uppercase tracking-widest text-center py-2 rounded-lg animate-shake">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-rose-900 to-rose-800 text-white font-black py-3.5 rounded-2xl transition-all shadow-xl active:scale-95 flex items-center justify-center space-x-2 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <span className="text-[9px] uppercase tracking-[0.3em]">{loading ? 'Verification...' : 'Accès Système'}</span>
              {!loading && <i className="fas fa-arrow-right text-[8px]"></i>}
            </button>
          </form>
          <div className="mt-8 pt-4 border-t border-white/5 text-center">
            <p className="text-[7px] font-bold text-slate-600 uppercase tracking-[0.4em]">Propriété Résidence Samia</p>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.3s ease-in-out; }
      `}</style>
    </div>
  );
};

export default AuthView;
