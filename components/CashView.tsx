
import React, { useState, useEffect } from 'react';
import { HotelSite, CashTransaction } from '../types';
import { authService } from '../services/authService';

interface CashViewProps { site: HotelSite; }

const CashView: React.FC<CashViewProps> = ({ site }) => {
  const currentUser = authService.getCurrentUser();
  const isBoss = currentUser?.role === 'Boss';
  const isGerant = currentUser?.role === 'Gérant';

  const STORAGE_KEY = `samia_cash_${site}`;
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [isAdding, setIsAdding] = useState<'Entrée' | 'Sortie' | null>(null);
  const [formData, setFormData] = useState({ amount: '', description: '', category: 'Autre' });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setTransactions(JSON.parse(saved).map((t: any) => ({ ...t, timestamp: new Date(t.timestamp) })));
  }, [site]);

  const saveTransactions = (data: CashTransaction[]) => {
    setTransactions(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.description || !isAdding) return;
    const newTx: CashTransaction = { id: Date.now().toString(), type: isAdding, amount: parseFloat(formData.amount), description: formData.description, timestamp: new Date(), category: formData.category };
    saveTransactions([newTx, ...transactions]);
    setIsAdding(null);
    setFormData({ amount: '', description: '', category: 'Autre' });
  };

  const totalEntries = transactions.filter(t => t.type === 'Entrée').reduce((acc, t) => acc + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'Sortie').reduce((acc, t) => acc + t.amount, 0);
  const balance = totalEntries - totalExpenses;

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 bg-transparent pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-white italic uppercase tracking-tight">Trésorerie</h2>
        <div className="flex gap-1">
          {isBoss && <button onClick={() => { setIsAdding('Entrée'); setFormData({...formData, category: 'Fond'}) }} className="px-2 py-1.5 bg-rose-900 text-white rounded-lg text-[7px] font-black uppercase">Fond</button>}
          {isGerant && <button onClick={() => setIsAdding('Sortie')} className="px-2 py-1.5 bg-white/5 border border-white/10 text-slate-500 rounded-lg text-[7px] font-black uppercase">Dépense</button>}
        </div>
      </div>

      <div className="bg-[#120303]/60 backdrop-blur-md p-5 rounded-3xl border border-white/5 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-rose-900/10 blur-[40px] rounded-full"></div>
        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Solde de Caisse</p>
        <p className="text-3xl font-black text-white">{balance.toLocaleString()} <span className="text-xs text-rose-700">DH</span></p>
      </div>

      <div className="space-y-2">
        <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic ml-2">Mouvements Récents</h3>
        {transactions.map(t => (
          <div key={t.id} className="bg-[#120303]/60 backdrop-blur-md p-3 rounded-2xl border border-white/5 flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0">
               <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] ${t.type === 'Entrée' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                 <i className={`fas ${t.type === 'Entrée' ? 'fa-arrow-down' : 'fa-gas-pump'}`}></i>
               </div>
               <div className="min-w-0">
                 <p className="text-[10px] font-bold text-white truncate leading-none">{t.description}</p>
                 <p className="text-[6px] text-slate-600 font-black uppercase mt-1">{t.category}</p>
               </div>
            </div>
            <p className={`text-[11px] font-black ${t.type === 'Entrée' ? 'text-emerald-500' : 'text-rose-500'}`}>
               {t.type === 'Entrée' ? '+' : '-'}{t.amount.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#1a0505] w-full max-w-[280px] rounded-3xl p-6 border border-white/10 shadow-2xl space-y-4">
             <h3 className="text-white font-black uppercase text-xs italic tracking-widest">{isAdding === 'Entrée' ? 'Nouveau Fond' : 'Dépense'}</h3>
             <form onSubmit={handleAdd} className="space-y-3">
                <input required type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center text-2xl font-black text-white outline-none" placeholder="0.00" />
                <input required type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-[10px]" placeholder="Détails" />
                <div className="flex gap-2">
                   <button type="button" onClick={() => setIsAdding(null)} className="flex-1 py-2 text-slate-600 text-[8px] font-black uppercase">Fermer</button>
                   <button type="submit" className={`flex-[2] py-2 rounded-xl text-[8px] font-black uppercase ${isAdding === 'Entrée' ? 'bg-rose-900 text-white' : 'bg-white/10 text-slate-400'}`}>Enregistrer</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashView;
