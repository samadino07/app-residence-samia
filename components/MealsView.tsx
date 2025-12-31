
import React, { useState, useEffect } from 'react';
import { HotelSite, Dish, DailyPlan, MealCategory } from '../types.ts';
import { authService } from '../services/authService.ts';

interface MealsViewProps { site: HotelSite; }

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MEAL_CATEGORIES: MealCategory[] = ['Petit-Déjeuner', 'Déjeuner', 'Goûter', 'Dîner'];

const MealsView: React.FC<MealsViewProps> = ({ site }) => {
  const currentUser = authService.getCurrentUser();
  const isChef = currentUser?.role === 'Chef de Cuisine';
  const DISHES_KEY = `samia_dishes_${site}`;
  const PLAN_KEY = `samia_planning_${site}`;

  const [dishes, setDishes] = useState<Dish[]>([]);
  const [planning, setPlanning] = useState<DailyPlan[]>([]);
  const [activeTab, setActiveTab] = useState<'Planning' | 'Catalogue'>('Planning');
  const [isAddingDish, setIsAddingDish] = useState(false);
  const [isEditingPlan, setIsEditingPlan] = useState<DailyPlan | null>(null);

  const [newDish, setNewDish] = useState({ name: '', description: '', price: 0, category: MEAL_CATEGORIES[0] });

  useEffect(() => {
    const savedDishes = localStorage.getItem(DISHES_KEY);
    const savedPlan = localStorage.getItem(PLAN_KEY);
    if (savedDishes) setDishes(JSON.parse(savedDishes));
    if (savedPlan) setPlanning(JSON.parse(savedPlan));
  }, [site]);

  const saveToStorage = (key: string, data: any, setter: Function) => {
    setter(data);
    localStorage.setItem(key, JSON.stringify(data));
  };

  const handleAddDish = (e: React.FormEvent) => {
    e.preventDefault();
    const dish: Dish = { ...newDish, id: Date.now().toString() };
    saveToStorage(DISHES_KEY, [...dishes, dish], setDishes);
    setIsAddingDish(false);
    setNewDish({ name: '', description: '', price: 0, category: MEAL_CATEGORIES[0] });
  };

  const updatePlanning = (day: string, category: MealCategory, dishId: string) => {
    const existingIndex = planning.findIndex(p => p.day === day && p.category === category);
    let updated: DailyPlan[] = existingIndex > -1 ? [...planning] : [...planning, { id: Date.now().toString(), day, category, mainDishId: dishId, alternatives: [] }];
    if (existingIndex > -1) updated[existingIndex] = { ...updated[existingIndex], mainDishId: dishId };
    saveToStorage(PLAN_KEY, updated, setPlanning);
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 bg-transparent pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-white italic uppercase tracking-tight">Cuisine Center</h2>
        <div className="flex bg-[#0a0202] p-0.5 rounded-lg border border-white/5">
          {['Planning', 'Catalogue'].map(t => (
            <button key={t} onClick={() => setActiveTab(t as any)} className={`px-2.5 py-1 rounded-md text-[7px] font-black uppercase transition-all ${activeTab === t ? 'bg-rose-900 text-white' : 'text-slate-600'}`}>{t}</button>
          ))}
        </div>
      </div>

      {activeTab === 'Catalogue' ? (
        <div className="grid grid-cols-2 gap-2.5">
          {dishes.map(dish => (
            <div key={dish.id} className="bg-[#120303]/60 backdrop-blur-md p-3 rounded-2xl border border-white/5">
              <span className="text-[6px] font-black text-rose-500 uppercase tracking-widest">{dish.category}</span>
              <p className="text-[10px] font-black text-white truncate leading-tight mt-1">{dish.name}</p>
              <p className="text-[8px] font-bold text-slate-500 mt-1">{dish.price} DH</p>
            </div>
          ))}
          {isChef && <button onClick={() => setIsAddingDish(true)} className="aspect-square rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center text-slate-700"><i className="fas fa-plus mb-1"></i><span className="text-[7px] font-black uppercase">Plat</span></button>}
        </div>
      ) : (
        <div className="space-y-4">
          {DAYS.map(day => (
            <div key={day} className="space-y-2">
              <h3 className="text-[8px] font-black text-rose-700 uppercase tracking-[0.2em]">{day}</h3>
              <div className="grid grid-cols-4 gap-1.5">
                {MEAL_CATEGORIES.map(cat => {
                  const plan = planning.find(p => p.day === day && p.category === cat);
                  return (
                    <div key={cat} onClick={() => isChef && setIsEditingPlan(plan || { id: '', day, category: cat, mainDishId: '', alternatives: [] })} className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center ${plan ? 'bg-rose-900/20 border-rose-900/40' : 'bg-white/5 border-white/5 opacity-40'}`}>
                      <span className="text-[5px] font-black text-slate-500 uppercase leading-none mb-1">{cat.split('-')[0]}</span>
                      <p className="text-[7px] font-bold text-white leading-tight line-clamp-1">{plan ? dishes.find(d => d.id === plan.mainDishId)?.name || '?' : '-'}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {isAddingDish && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#1a0505] w-full max-w-[280px] rounded-3xl p-6 border border-white/10 shadow-2xl space-y-4">
            <h3 className="text-white font-black uppercase text-xs">Nouveau Plat</h3>
            <form onSubmit={handleAddDish} className="space-y-3">
              <input required type="text" value={newDish.name} onChange={e => setNewDish({...newDish, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-[10px]" placeholder="Nom du plat" />
              <input type="number" value={newDish.price} onChange={e => setNewDish({...newDish, price: parseFloat(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-[10px]" placeholder="Prix DH" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setIsAddingDish(false)} className="flex-1 py-2 text-slate-600 text-[8px] font-black uppercase">Fermer</button>
                <button type="submit" className="flex-[2] py-2 bg-rose-900 text-white rounded-xl text-[8px] font-black uppercase">Valider</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditingPlan && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#1a0505] w-full max-w-[280px] rounded-3xl p-6 border border-white/10 shadow-2xl space-y-4">
             <div className="text-center">
                <p className="text-[6px] text-rose-500 uppercase">{isEditingPlan.day}</p>
                <h3 className="text-white font-black uppercase text-xs">{isEditingPlan.category}</h3>
             </div>
             <select value={isEditingPlan.mainDishId} onChange={e => { updatePlanning(isEditingPlan.day, isEditingPlan.category, e.target.value); setIsEditingPlan(null); }} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-[10px] outline-none">
               <option value="">Plat Principal...</option>
               {dishes.filter(d => d.category === isEditingPlan.category).map(dish => <option key={dish.id} value={dish.id}>{dish.name}</option>)}
             </select>
             <button onClick={() => setIsEditingPlan(null)} className="w-full py-2.5 text-slate-600 text-[8px] font-black uppercase">Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealsView;
