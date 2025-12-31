
import React, { useState, useEffect } from 'react';
import { HotelSite, LaundryRequest, Apartment, LaundryStatus } from '../types.ts';
import { authService } from '../services/authService.ts';

interface LaundryViewProps { site: HotelSite; }

const STATUS_FLOW: LaundryStatus[] = ['En attente', 'En blanchisserie', 'En réception', 'Livré'];

const LaundryView: React.FC<LaundryViewProps> = ({ site }) => {
  const currentUser = authService.getCurrentUser();
  const isReception = currentUser?.role === 'Réceptionniste' || currentUser?.role === 'Boss';
  const isBossOrGerant = currentUser?.role === 'Boss' || currentUser?.role === 'Gérant';

  const LAUNDRY_KEY = `samia_blanchisserie_${site}`;
  const APARTMENTS_KEY = `samia_apartments_${site}`;

  const [requests, setRequests] = useState<LaundryRequest[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newRequest, setNewRequest] = useState({ aptId: '', items: '' });

  useEffect(() => {
    const savedLaundry = localStorage.getItem(LAUNDRY_KEY);
    const savedApts = localStorage.getItem(APARTMENTS_KEY);
    if (savedLaundry) setRequests(JSON.parse(savedLaundry));
    if (savedApts) setApartments(JSON.parse(savedApts));
  }, [site]);

  const saveToStorage = (updated: LaundryRequest[]) => {
    setRequests(updated);
    localStorage.setItem(LAUNDRY_KEY, JSON.stringify(updated));
  };

  const handleAddRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequest.aptId || !newRequest.items) return;
    const apt = apartments.find(a => a.id === newRequest.aptId);
    if (!apt) return;
    const req: LaundryRequest = { id: Date.now().toString(), clientName: apt.currentClient!, apartmentId: apt.id, apartmentNumber: `${apt.block}${apt.number}`, items: newRequest.items, status: 'En attente', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    saveToStorage([req, ...requests]);
    setIsAdding(false);
    setNewRequest({ aptId: '', items: '' });
  };

  const updateStatus = (id: string, status: LaundryStatus) => {
    saveToStorage(requests.map(r => r.id === id ? { ...r, status, updatedAt: new Date().toISOString() } : r));
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 bg-transparent pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-white italic uppercase tracking-tight">Blanchisserie Hub</h2>
        {isReception && (
          <button onClick={() => setIsAdding(true)} className="w-8 h-8 flex items-center justify-center bg-rose-900/50 text-white rounded-lg border border-rose-800/30">
            <i className="fas fa-plus text-[10px]"></i>
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {requests.map((req) => (
          <div key={req.id} className="bg-[#120303]/60 backdrop-blur-md p-3 rounded-2xl border border-white/5 flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-start mb-1">
               <span className="text-[7px] font-black text-rose-500 uppercase">Apt {req.apartmentNumber}</span>
               <div className={`w-1.5 h-1.5 rounded-full ${req.status === 'Livré' ? 'bg-slate-700' : 'bg-rose-500'}`}></div>
            </div>
            <p className="text-[9px] font-black text-white truncate leading-none mb-2">{req.clientName}</p>
            <div className="flex-1 bg-white/5 p-2 rounded-lg mb-2">
               <p className="text-[7px] text-slate-500 italic leading-tight line-clamp-2">"{req.items}"</p>
            </div>
            <div className="flex flex-col gap-1.5">
               <span className="text-[6px] text-slate-600 font-bold uppercase text-center">{req.status}</span>
               {isReception && req.status !== 'Livré' && (
                 <button onClick={() => {
                   const nextIdx = STATUS_FLOW.indexOf(req.status) + 1;
                   if (nextIdx < STATUS_FLOW.length) updateStatus(req.id, STATUS_FLOW[nextIdx]);
                 }} className="w-full py-1.5 bg-rose-900/40 text-white rounded-md text-[7px] font-black uppercase">Suivant</button>
               )}
            </div>
          </div>
        ))}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#1a0505] w-full max-w-[280px] rounded-3xl p-6 border border-white/10 shadow-2xl space-y-4">
             <h3 className="text-white font-black uppercase text-xs">Nouveau Dépôt</h3>
             <form onSubmit={handleAddRequest} className="space-y-3">
                <select required value={newRequest.aptId} onChange={e => setNewRequest({...newRequest, aptId: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-[10px] outline-none appearance-none">
                  <option value="">Suite...</option>
                  {apartments.filter(a => a.status === 'Occupé').map(apt => <option key={apt.id} value={apt.id}>{apt.block}{apt.number} - {apt.currentClient}</option>)}
                </select>
                <textarea required value={newRequest.items} onChange={e => setNewRequest({...newRequest, items: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-[10px] resize-none" placeholder="Détails linge..." rows={3} />
                <div className="flex gap-2">
                   <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-2 text-slate-600 text-[8px] font-black uppercase">Fermer</button>
                   <button type="submit" className="flex-[2] py-2 bg-rose-900 text-white rounded-xl text-[8px] font-black uppercase">Enregistrer</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LaundryView;
