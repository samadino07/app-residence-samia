
import React, { useState, useEffect } from 'react';
import { HotelSite, Apartment, ApartmentHistory } from '../types.ts';
import { authService } from '../services/authService.ts';

interface ApartmentViewProps {
  site: HotelSite;
}

const RESIDENCES_BY_SITE: Record<string, string[]> = {
  'Fnideq': ['Résidence Fnideq', 'Bouzaghlal'],
  'M\'diq': ['Résidence M\'diq'],
  'Al Hoceima': ['Résidence Al Hoceima']
};

const ACCOMMODATION_TYPES = [
  { label: 'Single', value: '1/1 Single', count: 1 },
  { label: 'Double', value: '1/2 Double', count: 2 },
  { label: 'Triple', value: '1/3 Triple', count: 3 },
  { label: 'Quad', value: '1/4 Quadruple', count: 4 },
];

const ApartmentView: React.FC<ApartmentViewProps> = ({ site }) => {
  const currentUser = authService.getCurrentUser();
  const isBoss = currentUser?.role === 'Boss';
  const isReception = currentUser?.role === 'Réceptionniste' || isBoss;

  const STORAGE_KEY = `samia_apartments_${site}`;
  
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [checkingIn, setCheckingIn] = useState<Apartment | null>(null);
  const [viewingHistory, setViewingHistory] = useState<Apartment | null>(null);

  const [newApt, setNewApt] = useState({
    residence: RESIDENCES_BY_SITE[site]?.[0] || 'Standard',
    block: 'A',
    number: '',
    type: 'Suite' as any,
    capacity: 4 as 2 | 4
  });

  const [checkInData, setCheckInData] = useState({
    clientName: '',
    accommodationType: '1/1 Single' as any
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setApartments(JSON.parse(saved));
    else setApartments([]);
  }, [site]);

  const saveToStorage = (updated: Apartment[]) => {
    setApartments(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleAddApartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApt.number) return;
    const apt: Apartment = {
      id: Date.now().toString(),
      residenceName: newApt.residence,
      block: newApt.block,
      number: newApt.number,
      type: newApt.type,
      capacity: newApt.capacity,
      status: 'Libre',
      currentOccupantsCount: 0,
      history: []
    };
    saveToStorage([...apartments, apt]);
    setIsAdding(false);
    setNewApt({ ...newApt, number: '' });
  };

  const handleCheckIn = () => {
    if (!checkingIn || !checkInData.clientName) return;
    const accType = ACCOMMODATION_TYPES.find(t => t.value === checkInData.accommodationType);
    const updated = apartments.map(apt => {
      if (apt.id === checkingIn.id) {
        return {
          ...apt,
          status: 'Occupé' as const,
          currentClient: checkInData.clientName,
          currentOccupantsCount: accType?.count || 1,
          accommodationType: checkInData.accommodationType,
          checkInDate: new Date().toISOString()
        };
      }
      return apt;
    });
    saveToStorage(updated);
    setCheckingIn(null);
    setCheckInData({ clientName: '', accommodationType: '1/1 Single' });
  };

  const handleCheckOut = (aptId: string) => {
    const updated = apartments.map(apt => {
      if (apt.id === aptId && apt.currentClient) {
        const historyItem: ApartmentHistory = {
          id: Date.now().toString(),
          clientName: apt.currentClient,
          checkInDate: apt.checkInDate!,
          checkOutDate: new Date().toISOString(),
          occupantCount: apt.currentOccupantsCount,
          accommodationType: apt.accommodationType || 'N/A'
        };
        return {
          ...apt,
          status: 'Ménage' as const,
          currentClient: undefined,
          currentOccupantsCount: 0,
          checkInDate: undefined,
          accommodationType: undefined,
          history: [historyItem, ...apt.history]
        };
      }
      return apt;
    });
    saveToStorage(updated);
  };

  const setStatus = (aptId: string, status: Apartment['status']) => {
    const updated = apartments.map(apt => apt.id === aptId ? { ...apt, status } : apt);
    saveToStorage(updated);
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 bg-transparent pb-24">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-lg font-black text-white italic uppercase tracking-tight">Suites Center</h2>
          <span className="text-[7px] text-rose-700 font-black uppercase tracking-[0.2em]">{site}</span>
        </div>
        {isBoss && (
          <button onClick={() => setIsAdding(true)} className="w-8 h-8 flex items-center justify-center bg-rose-900/50 text-white rounded-lg border border-rose-800/30">
            <i className="fas fa-plus text-[10px]"></i>
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {apartments.length === 0 ? (
          <div className="col-span-full py-12 border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center opacity-20">
            <i className="fas fa-key text-xl mb-2"></i>
            <p className="text-[8px] font-bold uppercase">Aucune Suite</p>
          </div>
        ) : (
          apartments.map((apt) => (
            <div key={apt.id} className="bg-[#120303]/60 backdrop-blur-md p-3 rounded-2xl border border-white/5 flex flex-col relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col">
                  <span className="text-sm font-black text-white">{apt.block}{apt.number}</span>
                  <span className="text-[6px] text-slate-600 font-black uppercase">{apt.residenceName.split(' ')[1] || apt.residenceName}</span>
                </div>
                <div className={`w-1.5 h-1.5 rounded-full ${
                  apt.status === 'Libre' ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' :
                  apt.status === 'Occupé' ? 'bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.5)]' : 
                  'bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]'
                }`}></div>
              </div>
              
              <div className="flex-1 min-h-[3rem]">
                {apt.status === 'Occupé' ? (
                  <div className="space-y-0.5">
                    <p className="text-[8px] font-black text-slate-300 truncate leading-tight">{apt.currentClient}</p>
                    <p className="text-[6px] text-rose-500 uppercase font-black tracking-tighter opacity-80">{apt.accommodationType}</p>
                  </div>
                ) : (
                  <p className="text-[7px] text-slate-700 uppercase font-bold tracking-widest">{apt.status} • Cap {apt.capacity}</p>
                )}
              </div>

              <div className="mt-2 pt-2 border-t border-white/5 flex gap-1">
                {apt.status === 'Libre' && isReception && (
                  <button onClick={() => setCheckingIn(apt)} className="flex-1 py-1.5 bg-rose-900/30 hover:bg-rose-900/50 text-white rounded-lg text-[7px] font-black uppercase transition-all">Arrivée</button>
                )}
                {apt.status === 'Occupé' && isReception && (
                  <button onClick={() => handleCheckOut(apt.id)} className="flex-1 py-1.5 bg-rose-700/30 hover:bg-rose-700/50 text-white rounded-lg text-[7px] font-black uppercase transition-all">Départ</button>
                )}
                {apt.status === 'Ménage' && isReception && (
                  <button onClick={() => setStatus(apt.id, 'Libre')} className="flex-1 py-1.5 bg-emerald-700/30 hover:bg-emerald-700/50 text-white rounded-lg text-[7px] font-black uppercase transition-all">Prêt</button>
                )}
                <button onClick={() => setViewingHistory(apt)} className="w-6 h-6 rounded-lg bg-white/5 text-slate-700 flex items-center justify-center text-[8px] transition-colors hover:text-white hover:bg-white/10"><i className="fas fa-history"></i></button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL AJOUT (BOSS) */}
      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#1a0505] w-full max-w-[300px] rounded-3xl p-6 border border-white/10 shadow-2xl space-y-4">
            <h3 className="text-white font-black uppercase text-xs italic tracking-widest">Nouvelle Suite</h3>
            <form onSubmit={handleAddApartment} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[7px] text-slate-500 uppercase font-black ml-1">Résidence</label>
                <select value={newApt.residence} onChange={e => setNewApt({...newApt, residence: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-[10px] outline-none appearance-none">
                  {RESIDENCES_BY_SITE[site]?.map(r => <option key={r} value={r} className="bg-[#1a0505]">{r}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[7px] text-slate-500 uppercase font-black ml-1">Bloc</label>
                  <input type="text" value={newApt.block} onChange={e => setNewApt({...newApt, block: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-[10px]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[7px] text-slate-500 uppercase font-black ml-1">Numéro</label>
                  <input required type="text" value={newApt.number} onChange={e => setNewApt({...newApt, number: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-[10px]" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[7px] text-slate-500 uppercase font-black ml-1">Capacité</label>
                <select value={newApt.capacity} onChange={e => setNewApt({...newApt, capacity: parseInt(e.target.value) as 2 | 4})} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-[10px] appearance-none">
                  <option value={2} className="bg-[#1a0505]">2 Personnes</option>
                  <option value={4} className="bg-[#1a0505]">4 Personnes</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-2 text-slate-600 text-[8px] font-black uppercase">Fermer</button>
                <button type="submit" className="flex-[2] py-2 bg-rose-900/80 text-white rounded-xl text-[8px] font-black uppercase">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ARRIVÉE */}
      {checkingIn && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#1a0505] w-full max-w-[300px] rounded-3xl p-6 border border-white/10 shadow-2xl space-y-4">
             <div className="text-center">
                <h3 className="text-white font-black uppercase text-xs">Check-in {checkingIn.block}{checkingIn.number}</h3>
                <p className="text-[6px] text-rose-500 font-bold uppercase tracking-widest mt-1">Nouveau Client</p>
             </div>
             <div className="space-y-3">
                <input autoFocus type="text" value={checkInData.clientName} onChange={e => setCheckInData({...checkInData, clientName: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-[10px] outline-none" placeholder="Nom du client" />
                <div className="grid grid-cols-2 gap-2">
                  {ACCOMMODATION_TYPES.filter(t => t.count <= checkingIn.capacity).map(type => (
                    <button key={type.value} onClick={() => setCheckInData({...checkInData, accommodationType: type.value})} className={`py-2 rounded-lg text-[7px] font-black border transition-all ${checkInData.accommodationType === type.value ? 'bg-rose-700 border-rose-700 text-white' : 'bg-white/5 border-white/10 text-slate-500'}`}>
                      {type.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setCheckingIn(null)} className="flex-1 py-2.5 text-slate-600 text-[8px] font-black uppercase">Annuler</button>
                  <button onClick={handleCheckIn} className="flex-[2] py-2.5 bg-rose-900 text-white rounded-xl text-[8px] font-black uppercase">Valider</button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* MODAL HISTORIQUE */}
      {viewingHistory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#1a0505] w-full max-w-[320px] rounded-3xl p-5 border border-white/10 shadow-2xl flex flex-col max-h-[70vh]">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-[10px] font-black text-white uppercase tracking-widest italic">Histo {viewingHistory.block}{viewingHistory.number}</h3>
               <button onClick={() => setViewingHistory(null)} className="text-slate-600"><i className="fas fa-times"></i></button>
            </div>
            <div className="overflow-y-auto space-y-2 custom-scrollbar">
              {viewingHistory.history.length === 0 ? (
                <p className="text-[8px] text-center opacity-20 py-10 uppercase font-black">Aucun passage enregistré</p>
              ) : (
                viewingHistory.history.map((h) => (
                  <div key={h.id} className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="text-[9px] font-bold text-slate-200 truncate">{h.clientName}</p>
                      <p className="text-[6px] text-slate-600 uppercase font-black mt-0.5">{new Date(h.checkInDate).toLocaleDateString()} > {new Date(h.checkOutDate).toLocaleDateString()}</p>
                    </div>
                    <span className="text-[6px] bg-rose-950/40 text-rose-500 px-1.5 py-0.5 rounded uppercase font-black">{h.accommodationType.split(' ')[0]}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApartmentView;
