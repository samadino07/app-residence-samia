
import React from 'react';
import { HotelSite, MenuItem } from '../types';

interface MenuViewProps {
  site: HotelSite;
}

const SAMPLE_MENU: MenuItem[] = [
  { id: '1', name: 'Tajine de Poulet aux Citrons', price: 85, category: 'Plat' },
  { id: '2', name: 'Salade Marocaine Royale', price: 45, category: 'Entrée' },
  { id: '3', name: 'Pastilla aux Fruits de Mer', price: 120, category: 'Plat' },
  { id: '4', name: 'Thé à la menthe & Pâtisseries', price: 35, category: 'Dessert' }
];

const MenuView: React.FC<MenuViewProps> = ({ site }) => {
  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 space-y-8 bg-slate-950">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Carte & Menus du Jour</h2>
          <p className="text-slate-400 text-sm">Gestion de la restauration - {site}</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold">
          Actualiser le Menu
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
            <h3 className="font-bold text-white border-b border-white/5 pb-4">Catalogue des Plats</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SAMPLE_MENU.map(item => (
                <div key={item.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex justify-between items-center group hover:border-blue-500/30 transition-all">
                  <div>
                    <p className="text-xs text-blue-500 font-bold uppercase tracking-widest">{item.category}</p>
                    <p className="font-bold text-white">{item.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-400">{item.price} DH</p>
                    <button className="text-[10px] text-slate-500 hover:text-white mt-1 uppercase font-black">Modifier</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-blue-500/20 bg-blue-500/5 space-y-4">
            <h3 className="font-bold text-white text-center">Aujourd'hui à {site}</h3>
            <div className="space-y-4 p-4 rounded-2xl border border-dashed border-blue-500/30">
              <div className="text-center">
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Menu de la Mi-Journée</p>
                <p className="text-sm font-bold text-white mt-1 italic">Suggestion du Chef</p>
              </div>
              <div className="space-y-2 pt-4">
                <p className="text-xs text-slate-300 flex justify-between"><span>Harira Traditionnelle</span> <span>40 DH</span></p>
                <p className="text-xs text-slate-300 flex justify-between"><span>Tajine Agneau Pruneaux</span> <span>95 DH</span></p>
                <p className="text-xs text-slate-300 flex justify-between"><span>Fruits de saison</span> <span>25 DH</span></p>
              </div>
              <button className="w-full py-2 bg-blue-600 rounded-xl text-xs font-bold text-white mt-4">Imprimer le Menu</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuView;
