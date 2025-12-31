
import React, { useState, useEffect } from 'react';
import { HotelSite, StaffMember, Apartment, StockItem, MealVoucher, CashTransaction } from '../types.ts';

interface ReportViewProps {
  site: HotelSite;
}

const ReportView: React.FC<ReportViewProps> = ({ site }) => {
  const [data, setData] = useState({
    staff: [] as StaffMember[],
    apartments: [] as Apartment[],
    stock: [] as StockItem[],
    vouchers: [] as MealVoucher[],
    cash: [] as CashTransaction[]
  });

  useEffect(() => {
    const staff = JSON.parse(localStorage.getItem(`samia_staff_${site}`) || '[]');
    const apartments = JSON.parse(localStorage.getItem(`samia_apartments_${site}`) || '[]');
    const stock = JSON.parse(localStorage.getItem(`samia_stock_items_${site}`) || '[]');
    const vouchers = JSON.parse(localStorage.getItem(`samia_vouchers_${site}`) || '[]');
    const cash = JSON.parse(localStorage.getItem(`samia_cash_${site}`) || '[]').map((t: any) => ({
      ...t, timestamp: new Date(t.timestamp)
    }));

    setData({ staff, apartments, stock, vouchers, cash });
  }, [site]);

  const calculateStaffCost = () => {
    return data.staff.reduce((acc, s) => {
      const daily = s.monthlyBaseSalary / 30;
      const absences = s.attendance.filter(a => a.status === 'Absent').length;
      return acc + (daily * (30 - absences));
    }, 0);
  };

  const cashBalance = data.cash.reduce((acc, t) => t.type === 'Entrée' ? acc + t.amount : acc - t.amount, 0);
  const stockValue = data.stock.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  const occupiedCount = data.apartments.filter(a => a.status === 'Occupé').length;
  const occupancyRate = data.apartments.length > 0 ? (occupiedCount / data.apartments.length) * 100 : 0;

  const handleExport = (type: 'pdf' | 'excel') => {
    if (type === 'pdf') {
      window.print();
    } else {
      alert("Export Excel en cours pour " + site + "...");
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 bg-transparent pb-24 report-content">
      <style>{`
        @media print {
          body * { visibility: hidden; background: white !important; color: black !important; }
          .report-content, .report-content * { visibility: visible; }
          .report-content { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="flex items-center justify-between no-print">
        <div className="flex flex-col">
          <h2 className="text-lg font-black text-white italic uppercase tracking-tight leading-none">Decision Hub</h2>
          <span className="text-[7px] text-rose-700 font-black uppercase tracking-[0.2em] mt-1">{site}</span>
        </div>
        <div className="flex gap-1">
          <button onClick={() => handleExport('pdf')} className="w-8 h-8 flex items-center justify-center bg-white/5 text-slate-500 rounded-lg border border-white/5">
            <i className="fas fa-print text-[10px]"></i>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#120303]/60 backdrop-blur-md p-3 rounded-2xl border border-white/5">
          <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest mb-1">Masse Salariale</p>
          <p className="text-sm font-black text-white">{calculateStaffCost().toLocaleString()} <span className="text-[8px] text-rose-700">DH</span></p>
        </div>
        <div className="bg-[#120303]/60 backdrop-blur-md p-3 rounded-2xl border border-white/5">
          <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest mb-1">Occupation</p>
          <p className="text-sm font-black text-emerald-500">{occupancyRate.toFixed(1)}%</p>
        </div>
        <div className="bg-[#120303]/60 backdrop-blur-md p-3 rounded-2xl border border-white/5">
          <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest mb-1">Solde Caisse</p>
          <p className="text-sm font-black text-white">{cashBalance.toLocaleString()} <span className="text-[8px] text-rose-700">DH</span></p>
        </div>
        <div className="bg-[#120303]/60 backdrop-blur-md p-3 rounded-2xl border border-white/5">
          <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest mb-1">Valeur Stock</p>
          <p className="text-sm font-black text-amber-500">{stockValue.toLocaleString()} <span className="text-[8px] text-amber-900">DH</span></p>
        </div>
      </div>

      <div className="bg-[#120303]/60 backdrop-blur-md p-4 rounded-3xl border border-white/5 space-y-4">
        <h3 className="text-[9px] font-black text-white uppercase tracking-widest italic">Analyse Restauration</h3>
        <div className="space-y-3">
          {['Petit-Déjeuner', 'Déjeuner', 'Goûter', 'Dîner'].map(cat => {
            const count = data.vouchers.filter(v => v.mealType === cat).length;
            const max = Math.max(...['Petit-Déjeuner', 'Déjeuner', 'Goûter', 'Dîner'].map(c => data.vouchers.filter(v => v.mealType === c).length), 1);
            const width = (count / max) * 100;
            return (
              <div key={cat} className="space-y-1">
                <div className="flex justify-between text-[7px] font-bold uppercase">
                  <span className="text-slate-500">{cat}</span>
                  <span className="text-white">{count} Bons</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-rose-950 to-rose-600 transition-all duration-1000" style={{ width: `${width}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-[#120303]/60 backdrop-blur-md rounded-3xl border border-white/5 overflow-hidden">
        <div className="px-4 py-2 bg-white/5 border-b border-white/5">
          <h3 className="text-[9px] font-black text-white uppercase tracking-widest">Détail Salaires</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-4 py-2 text-[7px] font-black text-slate-600 uppercase">Personnel</th>
                <th className="px-4 py-2 text-[7px] font-black text-slate-600 uppercase">Abs</th>
                <th className="px-4 py-2 text-[7px] font-black text-slate-600 uppercase text-right">Net DH</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.staff.map(member => {
                const absCount = member.attendance.filter(a => a.status === 'Absent').length;
                const net = (member.monthlyBaseSalary / 30) * (30 - absCount);
                return (
                  <tr key={member.id}>
                    <td className="px-4 py-2">
                      <p className="text-[9px] font-bold text-white">{member.name}</p>
                      <p className="text-[6px] text-slate-600 uppercase font-black">{member.function}</p>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`text-[8px] font-black ${absCount > 0 ? 'text-rose-500' : 'text-slate-700'}`}>{absCount}j</span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <p className="text-[10px] font-black text-white">{net.toLocaleString()}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="py-6 text-center opacity-30 no-print">
        <p className="text-[6px] font-black text-slate-700 uppercase tracking-[0.5em]">Business Intel v4.2</p>
      </div>
    </div>
  );
};

export default ReportView;
