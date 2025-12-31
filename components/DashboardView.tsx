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

// -- UTILS DE SÉCURITÉ --

// 1. Parser JSON sans crasher
const safeJSONParse = (key: string, fallback: any) => {
  try {
    const item = localStorage.getItem(key);
    if (!item || item === "undefined" || item === "null") return fallback;
    return JSON.parse(item);
  } catch (e) {
    console.warn(`Resetting corrupted key: ${key}`);
    return fallback;
  }
};

// 2. Nettoyer les tableaux (enlever les nulls/undefined)
function cleanArray<T>(arr: any[]): T[] {
  if (!Array.isArray(arr)) return [];
  return arr.filter(item => item !== null && item !== undefined);
}

// 3. Comparer les dates sans crasher (Invalid Date Fix)
const isSameDay = (dateInput: string | Date | undefined, targetDateStr: string): boolean => {
  if (!dateInput) return false;
  try {
    const d = new Date(dateInput);
    // Vérifier si la date est valide (getTime() renvoie NaN si invalide)
    if (isNaN(d.getTime())) return false; 
    return d.toLocaleDateString('fr-FR') === targetDateStr;
  } catch (e) {
    return false;
  }
};

const DashboardView: React.FC<DashboardViewProps> = ({ site, isBoss }) => {
  // Initialisation avec des tableaux vides pour éviter le crash au premier render
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
      // Chargement sécurisé
      const rawStaff = safeJSONParse(`samia_staff_${site}`, []);
      
      // Assurer que staff.attendance est toujours un tableau
      const sanitizedStaff = cleanArray<StaffMember>(rawStaff).map(s => ({
        ...s,
        attendance: Array.isArray(s.attendance) ? s.attendance : []
      }));

      setData({
        stock: cleanArray<StockItem>(safeJSONParse(`samia_stock_items_${site}`, [])),
        commands: cleanArray<ChefCommand>(safeJSONParse(`samia_stock_commands_${site}`, [])),
        laundry: cleanArray<LaundryRequest>(safeJSONParse(`samia_blanchisserie_${site}`, [])),
        staff: sanitizedStaff,
        vouchers: cleanArray<MealVoucher>(safeJSONParse(`samia_vouchers_${site}`, [])),
        planning: cleanArray<DailyPlan>(safeJSONParse(`samia_planning_${site}`, [])),
        dishes: cleanArray<Dish>(safeJSONParse(`samia_dishes_${site}`, [])),
        cash: cleanArray<CashTransaction>(safeJSONParse(`samia_cash_${site}`, [])),
        apartments: cleanArray<Apartment>(safeJSONParse(`samia_apartments_${site}`, []))
      });
    };

    fetchData();
    window.addEventListener('storage', fetchData);
    return () => window.removeEventListener('storage', fetchData);
  }, [site]);

  const today = new Date().toLocaleDateString('fr-FR');
  
  // -- CALCULS SÉCURISÉS (TRY/CATCH INTEGRES) --

  const totalClients = useMemo(() => 
    data.apartments.reduce((acc, apt) => {
      const count = Number(apt?.currentOccupantsCount);
      return acc + (isNaN(count) ? 0 : count);
    }, 0)
  , [data.apartments]);

  const staffPresent = useMemo(() => 
    data.staff.filter(s => s.attendance.some(a => isSameDay(a.date, today) && a.status === 'Présent')).length
  , [data.staff, today]);

  const staffAbsent = useMemo(() => 
    data.staff.filter(s => s.attendance.some(a => isSameDay(a.date, today) && a.status === 'Absent')).length
  , [data.staff, today]);
  
  const dailyVouchers = useMemo(() => 
    data.vouchers.filter(v => isSameDay(v.date, today) || isSameDay(v.timestamp, today))
  , [data.vouchers, today]);
  
  const mealsCount = dailyVouchers.filter(v => v?.type === 'Repas').length;
  const drinksCount = dailyVouchers.filter(v => v?.type === 'Boisson').length;

  const laundryStats = useMemo(() => ({
    pending: data.laundry.filter(r => r && (r.status === 'En attente' || r.status === 'En blanchisserie')).length,
    inReception: data.laundry.filter(r => r && r.status === 'En réception').length
  }), [data.laundry]);

  const criticalStock = useMemo(() => 
    data.stock.filter(s => s && (s.quantity <= (s.minThreshold || 0)))
  , [data.stock]);
  
  const activeCommands = useMemo(() => 
    data.commands.filter(c => c && c.status === 'En attente')
  , [data.commands]);

  const todayMenu = useMemo(() => {
    try {
      const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      const currentDay = days[new Date().getDay()];
      return data.planning
        .filter(p => p && p.day === currentDay)
        .map(p => {
          const dish = data.dishes.find(d => d && d.id === p.mainDishId);
          return { cat: p.category, name: dish ? dish.name : 'Non planifié' };
        });
    } catch (e) { return []; }
  }, [data.planning, data.dishes]);

  // Financial Health avec protection Date
  const healthData = useMemo(() => {
    const clientBudget = totalClients * 150;
    
    const todayExpenses = data.cash
      .filter(t => {
        return t && t.type === 'Sortie' && isSameDay(t.timestamp, today);
      })
      .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    
    const score = clientBudget - todayExpenses;
    
    return {
      budget: clientBudget,
      expenses: todayExpenses,
      score: score,
      status: score > 0 ? 'good' : score === 0 ? 'warning' : 'danger'
    };
  }, [totalClients, data.cash, today]);

  const renderSparkline = (color: string) => (
    <svg viewBox="0 0 100 25" className="w-full h-8 opacity-40">
      <path 
        d="M0 20 Q 20 5, 40 18 T 70 10 T 100 15" 
        fill="none" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round"
      />
    </svg>
  );

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6 bg-transparent relative z-10 pb-28">
      {/* Top Breadcrumb */}
      <div className="flex flex-col">
        <div className="flex items-center space-x-2 mb-1">
           <div className="px-2 py-0.5 rounded-md bg-rose-950/40 text-[7px] font-black text-rose-500 uppercase border border-rose-900/20">Executive Console</div>
           <div className="px-2 py-0.5 rounded-md bg-white/5 text-[7px] font-black text-slate-500 uppercase border border-white/5 tracking-widest">{site}</div>
        </div>
        <h2 className="text-2xl font-black text-white tracking-tighter italic uppercase leading-none">System Overview</h2>
      </div>

      {/* Main Performance Index Card */}
      <div className={`p-6 rounded-[2.8rem] border transition-all duration-700 relative overflow-hidden ${
        healthData.status === 'good' ? 'bg-emerald-950/20 border-emerald-500/20' : 
        healthData.status === 'warning' ? 'bg-amber-950/20 border-amber-500/20' : 
        'bg-rose-950/20 border-rose-500/20 shadow-[0_0_40px_rgba(225,29,72,0.1)]'
      }`}>
        <div className="absolute top-0 right-0 p-10 opacity-[0.03]">
           <i className="fas fa-chart-pie text-9xl"></i>
        </div>
        
        <div className="relative z-10 space-y-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mb-1.5">Indice de Performance</p>
              <h3 className="text-4xl font-black text-white tracking-tighter">
                {healthData.score.toLocaleString()} <span className="text-[14px] text-rose-700 italic">DH</span>
              </h3>
            </div>
            <div className={`w-14 h-14 rounded-3xl flex items-center justify-center border transition-all ${
              healthData.status === 'good' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 
              healthData.status === 'warning' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 
              'bg-rose-500/10 border-rose-500/30 text-rose-500 animate-pulse'
            }`}>
              <i className={`fas ${healthData.status === 'good' ? 'fa-chart-line' : healthData.status === 'warning' ? 'fa-minus' : 'fa-triangle-exclamation'} text-xl`}></i>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-6 pt-2 border-t border-white/5">
            <div>
              <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Clients (x150)</p>
              <p className="text-sm font-black text-white">+{healthData.budget.toLocaleString()}</p>
              <p className="text-[6px] text-slate-700 mt-1 uppercase font-bold">{totalClients} Personnes</p>
            </div>
            <div>
              <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Dépenses Jour</p>
              <p className="text-sm font-black text-rose-600">-{healthData.expenses.toLocaleString()}</p>
              <p className="text-[6px] text-slate-700 mt-1 uppercase font-bold">Caisse Sorties</p>
            </div>
            <div className="text-right">
              <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest">État</p>
              <p className={`text-[9px] font-black uppercase mt-1 tracking-widest ${healthData.status === 'good' ? 'text-emerald-500' : healthData.status === 'warning' ? 'text-amber-500' : 'text-rose-500'}`}>
                {healthData.status === 'good' ? 'Optimisé' : healthData.status === 'warning' ? 'Équilibre' : 'Alerte Rouge'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Pulse Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Staff Card */}
        <div className="bg-[#120303]/60 backdrop-blur-md p-4 rounded-[2rem] border border-white/5 space-y-3">
          <div className="flex justify-between items-center opacity-40">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Personnel</span>
            <i className="fas fa-user-check text-[10px]"></i>
          </div>
          <div className="flex items-end justify-between">
            <h4 className="text-xl font-black text-white">{staffPresent}<span className="text-[10px] text-slate-600 ml-1">/ {data.staff.length}</span></h4>
            <span className="text-[7px] font-black text-emerald-500 uppercase">{staffAbsent} Abs</span>
          </div>
          {renderSparkline('#10b981')}
        </div>

        {/* Stock Alert Card */}
        <div className="bg-[#120303]/60 backdrop-blur-md p-4 rounded-[2rem] border border-white/5 space-y-3">
          <div className="flex justify-between items-center opacity-40">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Stock Critique</span>
            <i className="fas fa-boxes-stacked text-[10px]"></i>
          </div>
          <div className="flex items-end justify-between">
            <h4 className="text-xl font-black text-white">{criticalStock.length}</h4>
            <span className="text-[7px] font-black text-rose-500 uppercase">{activeCommands.length} Cmd</span>
          </div>
          {renderSparkline('#f43f5e')}
        </div>

        {/* Laundry Card */}
        <div className="bg-[#120303]/60 backdrop-blur-md p-4 rounded-[2rem] border border-white/5 space-y-3">
          <div className="flex justify-between items-center opacity-40">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Blanchisserie</span>
            <i className="fas fa-soap text-[10px]"></i>
          </div>
          <div className="flex items-end justify-between">
            <h4 className="text-xl font-black text-white">{laundryStats.pending}</h4>
            <div className="text-right">
              <p className="text-[7px] font-black text-slate-500 uppercase">{laundryStats.inReception} Prêt</p>
            </div>
          </div>
          {renderSparkline('#3b82f6')}
        </div>

        {/* Consumption Card */}
        <div className="bg-[#120303]/60 backdrop-blur-md p-4 rounded-[2rem] border border-white/5 space-y-3">
          <div className="flex justify-between items-center opacity-40">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Vouchers</span>
            <i className="fas fa-receipt text-[10px]"></i>
          </div>
          <div className="flex items-end justify-between">
            <h4 className="text-xl font-black text-white">{mealsCount + drinksCount}</h4>
            <div className="text-right">
              <p className="text-[7px] font-black text-slate-500 uppercase">{mealsCount} Repas</p>
              <p className="text-[7px] font-black text-slate-500 uppercase">{drinksCount} Boiss</p>
            </div>
          </div>
          {renderSparkline('#fbbf24')}
        </div>
      </div>

      {/* Contextual Bottom Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Today's Planning */}
        <div className="bg-[#120303]/60 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/5 space-y-5">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] font-black text-white uppercase italic tracking-[0.2em]">Menu du Jour • {today}</h3>
            <div className="w-2 h-2 rounded-full bg-rose-700 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {todayMenu.length > 0 ? todayMenu.map((m, i) => (
              <div key={i} className="p-4 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-default group">
                <p className="text-[7px] font-black text-rose-500 uppercase mb-1.5 opacity-60 group-hover:opacity-100">{m.cat}</p>
                <p className="text-[11px] font-bold text-slate-200 truncate">{m.name}</p>
              </div>
            )) : (
              <div className="col-span-2 py-8 text-center text-[9px] font-black text-slate-800 uppercase tracking-widest italic">Aucun plat configuré</div>
            )}
          </div>
        </div>

        {/* Detailed Alerts (Stock & Laundry) */}
        <div className="bg-[#120303]/60 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/5 space-y-5">
          <h3 className="text-[10px] font-black text-white uppercase italic tracking-[0.2em]">Flux d'Urgences</h3>
          <div className="space-y-2.5">
            {criticalStock.slice(0, 2).map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl bg-rose-950/10 border border-rose-900/20">
                <div className="flex items-center space-x-3">
                   <div className="w-8 h-8 rounded-xl bg-rose-900/20 flex items-center justify-center text-rose-500 text-[10px]">
                      <i className="fas fa-box"></i>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-200 leading-none">{item.name}</span>
                      <span className="text-[7px] text-rose-700 font-black uppercase mt-1 tracking-tighter">Seuil critique atteint</span>
                   </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-rose-500">{item.quantity}</span>
                  <p className="text-[6px] text-slate-600 font-bold uppercase">{item.unit}</p>
                </div>
              </div>
            ))}
            {activeCommands.length > 0 && (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-950/10 border border-amber-900/20">
                <div className="flex items-center space-x-3">
                   <div className="w-8 h-8 rounded-xl bg-amber-900/20 flex items-center justify-center text-amber-500 text-[10px]">
                      <i className="fas fa-shopping-cart"></i>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-200 leading-none">Commandes en cours</span>
                      <span className="text-[7px] text-amber-700 font-black uppercase mt-1 tracking-tighter">Attente validation magasin</span>
                   </div>
                </div>
                <span className="text-xs font-black text-amber-500">{activeCommands.length}</span>
              </div>
            )}
            {criticalStock.length === 0 && activeCommands.length === 0 && (
              <div className="py-10 flex flex-col items-center justify-center opacity-20">
                <i className="fas fa-shield-halved text-2xl mb-2"></i>
                <p className="text-[8px] font-black uppercase tracking-widest">Système de Stock Conforme</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Global Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
         {[
           { icon: 'fa-file-pdf', label: 'Export PDF' },
           { icon: 'fa-microchip', label: 'AI Audit' },
           { icon: 'fa-fingerprint', label: 'Security' },
           { icon: 'fa-rotate', label: 'Sync Hub' }
         ].map((action, idx) => (
           <button key={idx} className="p-4 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex flex-col items-center gap-2 group">
             <i className={`fas ${action.icon} text-slate-600 group-hover:text-rose-600 transition-colors`}></i>
             <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{action.label}</span>
           </button>
         ))}
      </div>
    </div>
  );
};

export default DashboardView;