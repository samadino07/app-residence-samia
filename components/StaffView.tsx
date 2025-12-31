
import React, { useState, useEffect } from 'react';
import { HotelSite, StaffMember, AttendanceRecord } from '../types';
import { authService } from '../services/authService';

interface StaffViewProps {
  site: HotelSite;
  isBoss: boolean;
}

const StaffView: React.FC<StaffViewProps> = ({ site, isBoss }) => {
  const currentUser = authService.getCurrentUser();
  const isGerant = currentUser?.role === 'Gérant';
  const isCaissier = currentUser?.role === 'Caissier';
  
  const STORAGE_KEY = `samia_staff_${site}`;
  const todayDate = new Date().toLocaleDateString('fr-FR');
  
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    function: '',
    phone: '',
    monthlyBaseSalary: '',
    previousMonthSalary: '',
    status: 'En poste' as StaffMember['status']
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setStaff(JSON.parse(saved));
    }
  }, [site]);

  const saveToStorage = (updated: StaffMember[]) => {
    setStaff(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handlePointage = (staffId: string, status: 'Présent' | 'Absent') => {
    const updated = staff.map(s => {
      if (s.id === staffId) {
        const otherAttendance = s.attendance.filter(a => a.date !== todayDate);
        return {
          ...s,
          attendance: [...otherAttendance, { date: todayDate, status }]
        };
      }
      return s;
    });
    saveToStorage(updated);
  };

  const handleJustify = (staffId: string) => {
    const updated = staff.map(s => {
      if (s.id === staffId) {
        const todayRecord = s.attendance.find(a => a.date === todayDate);
        if (todayRecord && todayRecord.status === 'Absent') {
          const otherAttendance = s.attendance.filter(a => a.date !== todayDate);
          return {
            ...s,
            attendance: [...otherAttendance, { date: todayDate, status: 'Justifié' as const }]
          };
        }
      }
      return s;
    });
    saveToStorage(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const monthlySalary = parseFloat(formData.monthlyBaseSalary) || 0;
    
    if (editingMember) {
      const updated = staff.map(s => s.id === editingMember.id ? {
        ...s,
        name: formData.name,
        function: formData.function,
        phone: formData.phone,
        monthlyBaseSalary: monthlySalary,
        previousMonthSalary: parseFloat(formData.previousMonthSalary) || 0,
        status: formData.status
      } : s);
      saveToStorage(updated);
      setEditingMember(null);
    } else {
      const newMember: StaffMember = {
        id: Date.now().toString(),
        name: formData.name,
        function: formData.function,
        phone: formData.phone,
        site: site,
        monthlyBaseSalary: monthlySalary,
        attendance: [],
        previousMonthSalary: parseFloat(formData.previousMonthSalary) || 0,
        status: formData.status
      };
      saveToStorage([...staff, newMember]);
    }
    
    setIsAdding(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      function: '',
      phone: '',
      monthlyBaseSalary: '',
      previousMonthSalary: '',
      status: 'En poste'
    });
  };

  const deleteStaff = (id: string) => {
    if (confirm('Voulez-vous supprimer ce profil salarié ?')) {
      saveToStorage(staff.filter(s => s.id !== id));
    }
  };

  const startEdit = (member: StaffMember) => {
    if (!isGerant && !isBoss) return;
    setEditingMember(member);
    setFormData({
      name: member.name,
      function: member.function,
      phone: member.phone,
      monthlyBaseSalary: member.monthlyBaseSalary.toString(),
      previousMonthSalary: member.previousMonthSalary.toString(),
      status: member.status
    });
    setIsAdding(true);
  };

  const calculateDailySalary = (monthly: number) => monthly / 30;
  const getAbsenceCount = (member: StaffMember) => member.attendance.filter(a => a.status === 'Absent').length;
  const calculateCurrentSalary = (member: StaffMember) => {
    const daily = calculateDailySalary(member.monthlyBaseSalary);
    const absences = getAbsenceCount(member);
    return daily * (30 - absences);
  };
  const totalPayroll = staff.reduce((acc, s) => acc + calculateCurrentSalary(s), 0);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 bg-transparent pb-24">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-lg font-black text-white italic uppercase tracking-tight leading-none">Staff Hub</h2>
          <span className="text-[7px] text-rose-700 font-black uppercase tracking-[0.2em] mt-1">{site}</span>
        </div>
        {(isBoss || isGerant) && (
          <button onClick={() => { resetForm(); setIsAdding(true); }} className="w-8 h-8 flex items-center justify-center bg-rose-900/50 text-white rounded-lg border border-rose-800/30">
            <i className="fas fa-user-plus text-[10px]"></i>
          </button>
        )}
      </div>

      {/* Budget Indicator */}
      {(isBoss || isGerant) && (
        <div className="bg-[#120303]/60 backdrop-blur-md p-3 rounded-2xl border border-white/5 flex justify-between items-center">
          <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest leading-none">Masse Salariale Prévue</p>
          <p className="text-xs font-black text-white">{totalPayroll.toLocaleString('fr-FR')} <span className="text-[8px] text-rose-700">DH</span></p>
        </div>
      )}

      {/* Grid of Staff Members */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {staff.length === 0 ? (
          <div className="col-span-full py-12 border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center opacity-20">
            <i className="fas fa-id-card text-xl mb-2"></i>
            <p className="text-[8px] font-bold uppercase tracking-widest">Aucun Personnel</p>
          </div>
        ) : (
          staff.map((member) => {
            const todayStatus = member.attendance.find(a => a.date === todayDate)?.status;
            const dailySalary = calculateDailySalary(member.monthlyBaseSalary);
            const currentSalary = calculateCurrentSalary(member);
            const absences = getAbsenceCount(member);
            
            return (
              <div key={member.id} className="bg-[#120303]/60 backdrop-blur-md p-4 rounded-3xl border border-white/5 space-y-4 relative overflow-hidden group">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0a0202] border border-white/5 flex items-center justify-center text-rose-700 font-black text-xs">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-[11px] font-black text-white leading-tight">{member.name}</h3>
                      <p className="text-[7px] text-rose-500 font-black uppercase tracking-widest mt-0.5">{member.function}</p>
                    </div>
                  </div>
                  <div className={`px-1.5 py-0.5 rounded-md text-[6px] font-black uppercase tracking-widest border transition-all ${
                    todayStatus === 'Présent' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                    todayStatus === 'Absent' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                    todayStatus === 'Justifié' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                    'bg-slate-500/10 text-slate-500 border-white/5'
                  }`}>
                    {todayStatus || 'En attente'}
                  </div>
                </div>

                {/* Pointage Controls */}
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handlePointage(member.id, 'Présent')} className={`py-1.5 rounded-lg text-[7px] font-black uppercase tracking-widest border transition-all ${todayStatus === 'Présent' ? 'bg-emerald-900 border-emerald-800 text-white' : 'bg-white/5 border-white/5 text-slate-600'}`}>
                    Présent
                  </button>
                  <button onClick={() => handlePointage(member.id, 'Absent')} className={`py-1.5 rounded-lg text-[7px] font-black uppercase tracking-widest border transition-all ${todayStatus === 'Absent' ? 'bg-rose-900 border-rose-800 text-white' : 'bg-white/5 border-white/5 text-slate-600'}`}>
                    Absent
                  </button>
                </div>

                {/* Payroll Section (Boss/Gerant) */}
                {(isBoss || isGerant) && (
                  <div className="pt-3 border-t border-white/5 space-y-2">
                    <div className="flex justify-between text-[7px] font-black uppercase tracking-widest">
                       <span className="text-slate-600">Net dû (absences décomptées)</span>
                       <span className="text-rose-700">{absences}j abs</span>
                    </div>
                    <p className="text-[14px] font-black text-white leading-none">
                      {currentSalary.toLocaleString('fr-FR', { minimumFractionDigits: 0 })} <span className="text-[9px] text-rose-700">DH</span>
                    </p>
                    <div className="flex justify-between items-center">
                       <span className="text-[7px] font-bold text-slate-700 italic">Base: {member.monthlyBaseSalary} DH</span>
                       <div className="flex gap-1.5">
                          <button onClick={() => startEdit(member)} className="text-slate-600 hover:text-white transition-colors"><i className="fas fa-edit text-[8px]"></i></button>
                          <button onClick={() => deleteStaff(member.id)} className="text-rose-950 hover:text-rose-600 transition-colors"><i className="fas fa-trash text-[8px]"></i></button>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add/Edit Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#1a0505] w-full max-w-[300px] rounded-3xl p-6 border border-white/10 shadow-2xl space-y-4">
            <h3 className="text-white font-black uppercase text-xs italic">{editingMember ? 'Modifier Profil' : 'Nouveau Staff'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-[10px]" placeholder="Nom complet" />
              <input required type="text" value={formData.function} onChange={e => setFormData({...formData, function: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-[10px]" placeholder="Poste" />
              <input required type="number" value={formData.monthlyBaseSalary} onChange={e => setFormData({...formData, monthlyBaseSalary: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-[10px]" placeholder="Salaire Mensuel DH" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-2 text-slate-600 text-[8px] font-black uppercase">Fermer</button>
                <button type="submit" className="flex-[2] py-2 bg-rose-900 text-white rounded-xl text-[8px] font-black uppercase">Valider</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffView;
