
import React, { useState, useEffect, useMemo } from 'react';
import { 
  HotelSite, 
  StockItem, 
  ChefCommand, 
  LaundryRequest, 
  StaffMember, 
  MealVoucher, 
  DailyPlan, 
  Dish,
  CashTransaction,
  Apartment
} from '../types.ts';

interface DashboardViewProps {
  site: HotelSite;
  isBoss: boolean;
}

const DashboardView: React.FC<DashboardViewProps> = ({ site, isBoss }) => {
  const [data, setData] = useState({
    stock: [] as StockItem[],
    commands: [] as ChefCommand[],
    laundry: [] as LaundryRequest[],
    staff: [] as StaffMember[],
    vouchers: [] as MealVoucher[],
    planning: [] as DailyPlan[],
    dishes: [] as Dish[],
    cash: [] as CashTransaction[],
    apartments: [] as Apartment[]
  });

  useEffect(() => {
    const fetchData = () => {
      setData({
        stock: JSON.parse(localStorage.getItem(`samia_stock_items_${site}`) || '[]'),
        commands: JSON.parse(localStorage.getItem(`samia_stock_commands_${site}`) || '[]'),
        laundry: JSON.parse(localStorage.getItem(`samia_blanchisserie_${site}`) || '[]'),
        staff: JSON.parse(localStorage.getItem(`samia_staff_${site}`) || '[]'),
        vouchers: JSON.parse(localStorage.getItem(`samia_vouchers_${site}`) || '[]'),
        planning: JSON.parse(localStorage.getItem(`samia_planning_${site}`) || '[]'),
        dishes: JSON.parse(localStorage.getItem(`samia_dishes_${site}`) || '[]'),
        cash: JSON.parse(localStorage.getItem(`samia_cash_${site}`) || '[]'),
        apartments: JSON.parse(localStorage.getItem(`samia_apartments_${site}`) || '[]')
      });
    };
    fetchData();
    window.addEventListener('storage', fetchData);
    return () => window.removeEventListener('storage', fetchData);
  }, [site]);

  const today = new Date().toLocaleDateString('fr-FR');
  
  // 1. Total Clients from Occupied Apartments
  const totalClients = useMemo(() => 
    data.apartments.reduce((acc, apt) => acc + (apt.currentOccupantsCount || 0), 0)
  , [data.apartments]);

  // 2. Performance Index: (Clients * 150) - Expenses
  const performance = useMemo(() => {
    const budget = totalClients * 150;
    const expenses = data.cash
      .filter(t => new Date(t.timestamp).toLocaleDateString('fr-FR') === today && t.type === 'Sortie')
      .reduce((acc, t) => acc + t.amount, 0);
    const score = budget - expenses;
    return { budget, expenses, score, status: score > 0 ? 'good' : score === 0 ? 'neutral' : 'bad' };
  }, [totalClients, data.cash, today]);

  // 3. Vouchers Analytics
  const voucherStats = useMemo(() => {
    const daily = data.vouchers.filter(v => v.date === today && v.status === 'Consommé');
    return {
      petitDej: daily.filter(v => v.mealType === 'Petit-Déjeuner').length,
      dejeuner: daily.filter(v => v.mealType === 'Déjeuner').length,
      gouter: daily.filter(v => v.mealType === 'Goûter').length,
      diner: daily.filter(v => v.mealType === 'Dîner').length,
      boissons: daily.filter(v => v.type === 'Boisson').length
    };
  }, [data.vouchers, today]);

  // 4. Staff Presence
  const staffStats = {
    present: data.staff.filter(s => s.attendance.find(a => a.date === today && a.status === 'Présent')).length,
    absent: data.staff.filter(s => s.attendance.find(a => a.date === today && a.status === 'Absent')).length
  };

  // 5. Laundry Status
  const laundryPulse = {
    pending: data.laundry.filter(l => l.status === 'En attente').length,
    inWash: data.laundry.filter(l => l.status === 'En blanchisserie').length,
    ready: data.laundry.filter(l => l.status === 'En réception').length
  };

  // 6. Stock Alerts
  const criticalStock = data.stock.filter(s => s.quantity <= s.minThreshold);
  const pendingCommands = data.commands.filter(c => c.status === 'En attente').length;

  // 7. Today's Menu
  const todayMenu = useMemo(() => {
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const currentDay = days[new Date().getDay()];
    return data.planning.filter(p => p.day === currentDay).map(p => {
      const dish = data.dishes.find(d => d.id === p.mainDishId);
      return { cat: p.category, name: dish ? dish.name : '?' };
    });
  }, [data.planning, data.dishes]);

  const renderCurve = (color: string) => (
    <svg viewBox="0 0 100 30" className="w-full h-10 opacity-30 mt-2">
      <path 
        d="M0 25 Q 15 5, 30 20 T 60 10 T 100 15" 
        fill="none" 
        stroke={color} 
        strokeWidth="3" 
        strokeLinecap="round" 
      />
    </svg>
  );

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6 bg-transparent pb-28">
      {/* Header Section */}
      <div className="flex justify-between items-end">
        <div>
           <div className="flex items-center space-x-2 mb-1">
             <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
             <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em]">Executive Hub Live</span>
           </div>
           <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">Management Center</h2>
        </div>
        <div className="text-right">
           <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">{site}</p>
           <p className="text-[7px] text-slate-700 font-bold uppercase">{today}</p>
        </div>
      </div>

      {/* 1. Main Performance Index (The Core Business Logic) */}
      <div className={`p-6 rounded-[2.5rem] border transition-all duration-700 relative overflow-hidden ${
        performance.status === 'good' ? 'bg-emerald-950/20 border-emerald-500/20' : 
        performance.status === 'neutral' ? 'bg-amber-950/20 border-amber-500/20' : 
        'bg-rose-950/20 border-rose-500/20 shadow-[0_0_50px_rgba(225,29,72,0.1)]'
      }`}>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Indice de Santé Financière</p>
              <h3 className="text-4xl font-black text-white tracking-tighter">
                {performance.score.toLocaleString()} <span className="text-sm text-rose-700 italic">DH</span>
              </h3>
              <div className="flex items-center space-x-2 mt-2">
                <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase ${
                  performance.status === 'good' ? 'bg-emerald-500 text-black' : 
                  performance.status === 'neutral' ? 'bg-amber-500 text-black' : 'bg-rose-600 text-white'
                }`}>
                  {performance.status === 'good' ? 'Surplus Rentrable' : performance.status === 'neutral' ? 'Équilibre' : 'Attention / Alerte'}
                </span>
              </div>
           </div>
           <div className="grid grid-cols-2 gap-8 md:border-l md:border-white/5 md:pl-8">
              <div>
                <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Gains (Clients x 150)</p>
                <p className="text-lg font-black text-white">+{performance.budget.toLocaleString()}</p>
                <p className="text-[6px] text-slate-700 font-bold uppercase">{totalClients} Personnes</p>
              </div>
              <div>
                <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Dépenses Caisse</p>
                <p className="text-lg font-black text-rose-700">-{performance.expenses.toLocaleString()}</p>
                <p className="text-[6px] text-slate-700 font-bold uppercase">Aujourd'hui</p>
              </div>
           </div>
        </div>
        <div className="absolute -bottom-2 -right-2 opacity-[0.03] pointer-events-none">
           <i className="fas fa-chart-line text-[120px]"></i>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Staff Pulse */}
        <div className="bg-[#120303]/60 backdrop-blur-md p-4 rounded-3xl border border-white/5 space-y-3">
           <div className="flex justify-between items-center opacity-40">
             <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Pointage Staff</span>
             <i className="fas fa-user-check text-[10px]"></i>
           </div>
           <div className="flex items-end justify-between">
             <h4 className="text-xl font-black text-white">{staffStats.present}<span className="text-[10px] text-slate-600 ml-1">/ {data.staff.length}</span></h4>
             <span className="text-[7px] font-black text-rose-500 uppercase">{staffStats.absent} Absents</span>
           </div>
           {renderCurve('#e11d48')}
        </div>

        {/* Stock Status */}
        <div className="bg-[#120303]/60 backdrop-blur-md p-4 rounded-3xl border border-white/5 space-y-3">
           <div className="flex justify-between items-center opacity-40">
             <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">État Stock</span>
             <i className="fas fa-boxes-stacked text-[10px]"></i>
           </div>
           <div className="flex items-end justify-between">
             <h4 className="text-xl font-black text-white">{criticalStock.length}</h4>
             <div className="text-right">
                <p className="text-[7px] font-black text-rose-500 uppercase">Alertes</p>
                <p className="text-[6px] text-slate-600 uppercase font-bold">{pendingCommands} Cmd Chef</p>
             </div>
           </div>
           {renderCurve('#f59e0b')}
        </div>

        {/* Laundry Status */}
        <div className="bg-[#120303]/60 backdrop-blur-md p-4 rounded-3xl border border-white/5 space-y-3">
           <div className="flex justify-between items-center opacity-40">
             <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Blanchisserie</span>
             <i className="fas fa-soap text-[10px]"></i>
           </div>
           <div className="grid grid-cols-3 gap-1">
              <div className="text-center"><p className="text-[10px] font-black text-white">{laundryPulse.pending}</p><p className="text-[5px] text-slate-600 uppercase">Wait</p></div>
              <div className="text-center"><p className="text-[10px] font-black text-white">{laundryPulse.inWash}</p><p className="text-[5px] text-slate-600 uppercase">Wash</p></div>
              <div className="text-center"><p className="text-[10px] font-black text-white">{laundryPulse.ready}</p><p className="text-[5px] text-slate-600 uppercase">Prêt</p></div>
           </div>
           {renderCurve('#3b82f6')}
        </div>

        {/* Vouchers Analytics */}
        <div className="bg-[#120303]/60 backdrop-blur-md p-4 rounded-3xl border border-white/5 space-y-3">
           <div className="flex justify-between items-center opacity-40">
             <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Consommation</span>
             <i className="fas fa-receipt text-[10px]"></i>
           </div>
           <div className="flex items-end justify-between">
             <h4 className="text-xl font-black text-white">{voucherStats.petitDej + voucherStats.dejeuner + voucherStats.gouter + voucherStats.diner}</h4>
             <div className="text-right">
                <p className="text-[7px] font-black text-emerald-500 uppercase">{voucherStats.boissons} Boiss</p>
                <p className="text-[6px] text-slate-600 uppercase font-bold">Bons Jour</p>
             </div>
           </div>
           {renderCurve('#10b981')}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Meals Planning */}
        <div className="bg-[#120303]/60 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/5 space-y-5">
           <div className="flex justify-between items-center">
             <h3 className="text-[10px] font-black text-white uppercase italic tracking-[0.2em]">Menu Planifié • {today}</h3>
             <i className="fas fa-utensils text-slate-800 text-xs"></i>
           </div>
           <div className="grid grid-cols-2 gap-3">
             {todayMenu.length > 0 ? todayMenu.map((m, i) => (
               <div key={i} className="p-4 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
                 <p className="text-[7px] font-black text-rose-500 uppercase mb-1.5 opacity-60 group-hover:opacity-100">{m.cat}</p>
                 <p className="text-[11px] font-bold text-slate-200 truncate">{m.name}</p>
               </div>
             )) : (
               <div className="col-span-2 py-6 text-center text-[9px] font-black text-slate-800 uppercase italic">Aucun plat au planning</div>
             )}
           </div>
        </div>

        {/* Quick Vouchers Breakdown */}
        <div className="bg-[#120303]/60 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/5 space-y-5">
           <h3 className="text-[10px] font-black text-white uppercase italic tracking-[0.2em]">Flux des Bons Repas</h3>
           <div className="space-y-3">
             {[
               { label: 'Petit-Déjeuner', count: voucherStats.petitDej, color: 'bg-amber-500' },
               { label: 'Déjeuner', count: voucherStats.dejeuner, color: 'bg-rose-500' },
               { label: 'Goûter', count: voucherStats.gouter, color: 'bg-orange-500' },
               { label: 'Dîner', count: voucherStats.diner, color: 'bg-indigo-500' }
             ].map(cat => {
               const total = Math.max(voucherStats.petitDej + voucherStats.dejeuner + voucherStats.gouter + voucherStats.diner, 1);
               const width = (cat.count / total) * 100;
               return (
                 <div key={cat.label} className="space-y-1">
                   <div className="flex justify-between text-[7px] font-black uppercase">
                     <span className="text-slate-500">{cat.label}</span>
                     <span className="text-white">{cat.count}</span>
                   </div>
                   <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                     <div className={`h-full ${cat.color} transition-all duration-1000`} style={{ width: `${width}%` }}></div>
                   </div>
                 </div>
               );
             })}
           </div>
        </div>
      </div>

      {/* Critical Stock List (Quick view) */}
      {criticalStock.length > 0 && (
        <div className="bg-rose-950/10 border border-rose-900/20 p-5 rounded-[2.5rem] space-y-4">
           <div className="flex items-center space-x-2">
             <i className="fas fa-triangle-exclamation text-rose-600 text-xs"></i>
             <h3 className="text-[10px] font-black text-rose-500 uppercase italic tracking-widest">Urgences Stock</h3>
           </div>
           <div className="flex flex-wrap gap-2">
              {criticalStock.slice(0, 5).map(item => (
                <div key={item.id} className="px-3 py-2 rounded-2xl bg-white/5 border border-white/5 flex items-center space-x-2">
                   <span className="text-[9px] font-bold text-slate-300">{item.name}</span>
                   <span className="text-[8px] font-black text-rose-600 bg-rose-600/10 px-1.5 py-0.5 rounded-md">{item.quantity} {item.unit}</span>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* Global Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
         {[
           { icon: 'fa-file-pdf', label: 'Rapport PDF' },
           { icon: 'fa-microchip', label: 'IA Analyse' },
           { icon: 'fa-fingerprint', label: 'Accès Logs' },
           { icon: 'fa-sync', label: 'Sync Hub' }
         ].map((action, idx) => (
           <button key={idx} className="p-4 rounded-3xl bg-white/5 border border-white/10 hover:bg-rose-900 transition-all flex flex-col items-center gap-2 group">
             <i className={`fas ${action.icon} text-slate-700 group-hover:text-white transition-colors`}></i>
             <span className="text-[8px] font-black text-slate-500 group-hover:text-white uppercase tracking-widest">{action.label}</span>
           </button>
         ))}
      </div>
    </div>
  );
};

export default DashboardView;
