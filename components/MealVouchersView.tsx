
import React, { useState, useEffect } from 'react';
import { HotelSite, MealCategory, MealVoucher, Apartment } from '../types';
import { authService } from '../services/authService';

interface MealVouchersViewProps { site: HotelSite; }

const MEAL_CATEGORIES: MealCategory[] = ['Petit-Déjeuner', 'Déjeuner', 'Goûter', 'Dîner'];
const BEVERAGES = ['Café noir', 'Café', 'Thé', 'Jus', 'Eau', 'Soda'];

const MealVouchersView: React.FC<MealVouchersViewProps> = ({ site }) => {
  const currentUser = authService.getCurrentUser();
  const isCaissierStrict = currentUser?.role === 'Caissier';
  const isChef = currentUser?.role === 'Chef de Cuisine' || currentUser?.role === 'Boss';
  const isBossOrGerant = currentUser?.role === 'Boss' || currentUser?.role === 'Gérant';

  const VOUCHERS_KEY = `samia_vouchers_${site}`;
  const APARTMENTS_KEY = `samia_apartments_${site}`;

  const [vouchers, setVouchers] = useState<MealVoucher[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [isCreating, setIsCreating] = useState<'Repas' | 'Boisson' | null>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<MealVoucher | null>(null);

  const [form, setForm] = useState({ aptId: '', mealType: MEAL_CATEGORIES[0], selectedBeverages: [] as string[] });

  useEffect(() => {
    const savedVouchers = localStorage.getItem(VOUCHERS_KEY);
    const savedApts = localStorage.getItem(APARTMENTS_KEY);
    if (savedVouchers) setVouchers(JSON.parse(savedVouchers));
    if (savedApts) setApartments(JSON.parse(savedApts));
  }, [site]);

  const saveVouchers = (data: MealVoucher[]) => {
    setVouchers(data);
    localStorage.setItem(VOUCHERS_KEY, JSON.stringify(data));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCreating || !isCaissierStrict) return;
    const apt = apartments.find(a => a.id === form.aptId);
    if (!apt || !apt.currentClient) return;
    const newVoucher: MealVoucher = { id: `${isCreating === 'Repas' ? 'R' : 'B'}${Date.now().toString().slice(-6)}`, type: isCreating, clientName: apt.currentClient, apartmentNumber: `${apt.block}${apt.number}`, mealType: isCreating === 'Repas' ? form.mealType : undefined, beverages: form.selectedBeverages, status: 'Valide', date: new Date().toLocaleDateString('fr-FR'), timestamp: new Date().toISOString() };
    saveVouchers([newVoucher, ...vouchers]);
    setIsCreating(null);
    setForm({ aptId: '', mealType: MEAL_CATEGORIES[0], selectedBeverages: [] });
  };

  const markConsumed = (id: string) => {
    saveVouchers(vouchers.map(v => v.id === id ? { ...v, status: 'Consommé' as const } : v));
  };

  const toggleBeverage = (bev: string) => {
    setForm(prev => ({ ...prev, selectedBeverages: prev.selectedBeverages.includes(bev) ? prev.selectedBeverages.filter(b => b !== bev) : [...prev.selectedBeverages, bev] }));
  };

  const today = new Date().toLocaleDateString('fr-FR');
  const dailyVouchers = vouchers.filter(v => v.date === today);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 bg-transparent pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-white italic uppercase tracking-tight">Bons Hub</h2>
        <div className="flex gap-1">
          {isCaissierStrict && (
            <>
              <button onClick={() => setIsCreating('Repas')} className="px-2.5 py-1.5 bg-rose-900 text-white rounded-lg text-[7px] font-black uppercase">Repas</button>
              <button onClick={() => setIsCreating('Boisson')} className="px-2.5 py-1.5 bg-white/10 text-white rounded-lg text-[7px] font-black uppercase border border-white/5">Boisson</button>
            </>
          )}
        </div>
      </div>

      {isBossOrGerant && (
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-[#120303]/60 backdrop-blur-md p-3 rounded-2xl border border-white/5">
            <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Total Jour</p>
            <p className="text-sm font-black text-white">{dailyVouchers.length}</p>
          </div>
          <div className="bg-[#120303]/60 backdrop-blur-md p-3 rounded-2xl border border-white/5">
            <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Valides</p>
            <p className="text-sm font-black text-emerald-500">{dailyVouchers.filter(v => v.status === 'Valide').length}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        {vouchers.map(v => (
          <div key={v.id} className={`bg-[#120303]/60 backdrop-blur-md p-3 rounded-2xl border transition-all relative overflow-hidden ${v.status === 'Consommé' ? 'opacity-40 grayscale border-white/5' : 'border-rose-900/20 shadow-lg'}`}>
            <div className="flex justify-between items-start mb-1">
              <span className="text-[8px] font-black text-rose-500 uppercase">Suite {v.apartmentNumber}</span>
              <span className="text-[6px] text-slate-600 font-black">{v.id}</span>
            </div>
            <p className="text-[9px] font-black text-white truncate leading-none mb-2">{v.clientName}</p>
            <div className="bg-white/5 p-1.5 rounded-lg mb-2">
               <p className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter truncate">{v.mealType || 'Boissons'}</p>
            </div>
            <div className="flex gap-1 mt-auto">
               <button onClick={() => setSelectedVoucher(v)} className="flex-1 py-1.5 bg-white/5 text-slate-500 rounded-md text-[7px] font-black uppercase">Ticket</button>
               {v.status === 'Valide' && (isChef || isCaissierStrict) && (
                 <button onClick={() => markConsumed(v.id)} className="flex-1 py-1.5 bg-rose-950 text-emerald-500 rounded-md text-[7px] font-black uppercase">OK</button>
               )}
            </div>
          </div>
        ))}
      </div>

      {isCreating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#1a0505] w-full max-w-[280px] rounded-3xl p-6 border border-white/10 shadow-2xl space-y-4">
            <h3 className="text-white font-black uppercase text-xs">Bon {isCreating}</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <select value={form.aptId} onChange={e => setForm({...form, aptId: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-[10px] outline-none appearance-none">
                <option value="">Suite...</option>
                {apartments.filter(a => a.status === 'Occupé').map(apt => <option key={apt.id} value={apt.id}>{apt.block}{apt.number} - {apt.currentClient}</option>)}
              </select>
              {isCreating === 'Repas' && (
                <div className="grid grid-cols-2 gap-1.5">
                  {MEAL_CATEGORIES.map(cat => <button key={cat} type="button" onClick={() => setForm({...form, mealType: cat})} className={`py-1.5 rounded-lg text-[7px] font-black uppercase border ${form.mealType === cat ? 'bg-rose-900 border-rose-900 text-white' : 'bg-white/5 border-white/10 text-slate-600'}`}>{cat}</button>)}
                </div>
              )}
              <div className="flex gap-2">
                <button type="button" onClick={() => setIsCreating(null)} className="flex-1 py-2 text-slate-600 text-[8px] font-black uppercase">Fermer</button>
                <button type="submit" className="flex-[2] py-2 bg-rose-900 text-white rounded-xl text-[8px] font-black uppercase">Générer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedVoucher && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/95">
           <div className="w-full max-w-xs flex flex-col items-center">
              <div id="print-area" className="bg-white text-black p-6 w-full font-mono shadow-2xl" style={{ minHeight: '350px' }}>
                 <div className="text-center border-b-2 border-black pb-2 mb-4">
                    <h2 className="text-sm font-black uppercase">SAMIA SUITE</h2>
                    <p className="text-[9px]">{site} - BON {selectedVoucher.id}</p>
                 </div>
                 <div className="space-y-2 mb-6 text-[10px]">
                    <p><b>DATE:</b> {selectedVoucher.date}</p>
                    <p><b>SUITE:</b> {selectedVoucher.apartmentNumber}</p>
                    <p><b>CLIENT:</b> {selectedVoucher.clientName}</p>
                    <div className="border-2 border-black p-2 text-center mt-4">
                       <p className="text-sm font-black uppercase">{selectedVoucher.mealType || 'BOISSON'}</p>
                    </div>
                 </div>
                 <div className="mt-auto pt-10 flex justify-between">
                    <div className="text-center w-1/2 border-t border-black"><p className="text-[7px] uppercase pt-1">Caisse</p></div>
                    <div className="text-center w-1/2 border-t border-black ml-4"><p className="text-[7px] uppercase pt-1">Client</p></div>
                 </div>
              </div>
              <div className="mt-8 flex gap-3">
                 <button onClick={() => setSelectedVoucher(null)} className="px-6 py-2 bg-white/10 text-white rounded-xl text-[8px] font-black uppercase">Fermer</button>
                 <button onClick={() => window.print()} className="px-6 py-2 bg-rose-900 text-white rounded-xl text-[8px] font-black uppercase"><i className="fas fa-print mr-2"></i>Imprimer</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default MealVouchersView;
