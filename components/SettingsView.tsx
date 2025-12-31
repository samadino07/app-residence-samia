
import React, { useState, useEffect } from 'react';
import { User, UserRole, HotelSite, ActivityLog } from '../types';
import { authService } from '../services/authService';

const ROLES: UserRole[] = ['Gérant', 'Chef de Cuisine', 'Magasinier', 'Caissier', 'Réceptionniste'];
const SITES: HotelSite[] = ['Fnideq', 'M\'diq', 'Al Hoceima'];

interface SettingsViewProps {
  onBack?: () => void;
}

type UserEntry = [string, { user: User, pass: string }];

const SettingsView: React.FC<SettingsViewProps> = ({ onBack }) => {
  const [users, setUsers] = useState<Record<string, { user: User, pass: string }>>({});
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<'Comptes' | 'Logs'>('Comptes');

  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: ROLES[0],
    site: SITES[0],
    pass: ''
  });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setUsers(authService.getUsers());
    setLogs(authService.getLogs());
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = {
      email: formData.email,
      name: formData.name,
      role: formData.role,
      site: formData.site
    };
    authService.addUser(newUser, formData.pass);
    setIsAdding(false);
    setFormData({ email: '', name: '', role: ROLES[0], site: SITES[0], pass: '' });
    refreshData();
  };

  const handleDelete = (email: string) => {
    if (email === '1') return alert("Impossible de supprimer le compte Boss.");
    if (confirm("Supprimer définitivement l'accès de cet utilisateur ?")) {
      authService.deleteUser(email);
      refreshData();
    }
  };

  const handleUpdatePass = (email: string) => {
    const newPass = prompt("Saisissez le nouveau mot de passe :");
    if (newPass) {
      authService.updatePassword(email, newPass);
      alert("Mot de passe mis à jour !");
      refreshData();
    }
  };

  const userEntries = Object.entries(users) as UserEntry[];

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6 bg-transparent pb-24">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-lg font-black text-white italic uppercase tracking-tight leading-none">Settings System</h2>
            <span className="text-[7px] text-rose-700 font-black uppercase tracking-[0.2em] mt-1">Gouvernance Hub</span>
          </div>
          <div className="flex bg-[#0a0202] p-0.5 rounded-lg border border-white/5">
            <button 
              onClick={() => setActiveTab('Comptes')}
              className={`px-4 py-1.5 rounded-md text-[8px] font-black uppercase transition-all ${activeTab === 'Comptes' ? 'bg-rose-900 text-white' : 'text-slate-600'}`}
            >
              Comptes
            </button>
            <button 
              onClick={() => setActiveTab('Logs')}
              className={`px-4 py-1.5 rounded-md text-[8px] font-black uppercase transition-all ${activeTab === 'Logs' ? 'bg-rose-900 text-white' : 'text-slate-600'}`}
            >
              Activités
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'Comptes' ? (
        <div className="space-y-4 animate-in fade-in duration-500">
          <div className="flex justify-between items-center px-1">
             <h3 className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Utilisateurs enregistrés</h3>
             <button onClick={() => setIsAdding(true)} className="w-8 h-8 flex items-center justify-center bg-rose-900/50 text-white rounded-lg border border-rose-800/30">
               <i className="fas fa-plus text-[10px]"></i>
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {userEntries.map(([email, data]) => (
              <div key={email} className="bg-[#120303]/60 backdrop-blur-md p-4 rounded-3xl border border-white/5 space-y-4 group">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0a0202] border border-white/5 flex items-center justify-center text-rose-700 font-black text-xs">
                      {data.user.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black text-white leading-tight">{data.user.name}</h4>
                      <p className="text-[7px] text-rose-500 font-black uppercase tracking-widest mt-0.5">{data.user.role} • {data.user.site}</p>
                    </div>
                  </div>
                  <span className="text-[7px] font-bold text-slate-700 uppercase tracking-widest">ID: {email}</span>
                </div>

                <div className="pt-3 border-t border-white/5 flex gap-2">
                  <button onClick={() => handleUpdatePass(email)} className="flex-1 py-2 bg-white/5 text-slate-500 text-[8px] font-black uppercase rounded-lg hover:text-white transition-all">
                    Pass
                  </button>
                  {email !== '1' && (
                    <button onClick={() => handleDelete(email)} className="w-10 h-10 flex items-center justify-center bg-rose-950/20 text-rose-700 rounded-lg hover:bg-rose-900 hover:text-white transition-all">
                      <i className="fas fa-trash-alt text-[8px]"></i>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-[#120303]/60 backdrop-blur-md rounded-3xl border border-white/5 overflow-hidden shadow-2xl animate-in slide-in-from-bottom-2 duration-500">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5">
                  <th className="px-4 py-3 text-[8px] font-black text-slate-600 uppercase tracking-widest">User</th>
                  <th className="px-4 py-3 text-[8px] font-black text-slate-600 uppercase tracking-widest">Action</th>
                  <th className="px-4 py-3 text-[8px] font-black text-slate-600 uppercase tracking-widest text-right">Moment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.length === 0 ? (
                  <tr><td colSpan={3} className="p-10 text-center text-slate-800 uppercase font-black text-[8px]">Aucune activité</td></tr>
                ) : (
                  logs.slice(0, 50).map((log) => (
                    <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-4 py-3">
                        <p className="text-[10px] font-bold text-white">{log.userName}</p>
                        <p className="text-[6px] text-slate-600 uppercase font-black">{log.userRole}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-1.5 py-0.5 rounded-md text-[6px] font-black uppercase tracking-widest border ${
                          log.action === 'Connexion' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="text-[9px] font-black text-slate-400 leading-none">{new Date(log.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                        <p className="text-[6px] text-slate-700 font-bold uppercase mt-1">{new Date(log.timestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#1a0505] w-full max-w-[280px] rounded-3xl p-6 border border-white/10 shadow-2xl space-y-4">
            <h3 className="text-white font-black uppercase text-xs italic">Nouveau Accès</h3>
            <form onSubmit={handleAdd} className="space-y-3">
              <input required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-[10px]" placeholder="Identifiant" />
              <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-[10px]" placeholder="Nom Complet" />
              <div className="grid grid-cols-2 gap-2">
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-[10px] outline-none">
                  {ROLES.map(r => <option key={r} value={r} className="bg-[#1a0505]">{r}</option>)}
                </select>
                <select value={formData.site} onChange={e => setFormData({...formData, site: e.target.value as HotelSite})} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-[10px] outline-none">
                  {SITES.map(s => <option key={s} value={s} className="bg-[#1a0505]">{s}</option>)}
                </select>
              </div>
              <input required type="password" value={formData.pass} onChange={e => setFormData({...formData, pass: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-[10px]" placeholder="Pass" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-2 text-slate-600 text-[8px] font-black uppercase">Annuler</button>
                <button type="submit" className="flex-[2] py-2 bg-rose-900 text-white rounded-xl text-[8px] font-black uppercase">Valider</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
