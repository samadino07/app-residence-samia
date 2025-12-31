
import React, { useState, useEffect } from 'react';
import { HotelSite, StockItem, UserRole, StockCategory, ChefCommand } from '../types';

interface StockViewProps {
  site: HotelSite;
  role: UserRole;
}

const CATEGORIES: StockCategory[] = ['Produits Laitiers', 'Boucherie', 'Épicerie', 'Boulangerie', 'Fruits & Légumes', 'Entretien', 'Autre'];
const UNITS = ['Kg', 'L', 'Unité', 'Pack'];

const StockView: React.FC<StockViewProps> = ({ site, role }) => {
  const ITEMS_STORAGE_KEY = `samia_stock_items_${site}`;
  const COMMANDS_STORAGE_KEY = `samia_stock_commands_${site}`;

  const [items, setItems] = useState<StockItem[]>([]);
  const [commands, setCommands] = useState<ChefCommand[]>([]);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isOrdering, setIsOrdering] = useState<StockItem | null>(null);
  const [orderQty, setOrderQty] = useState<number>(0);

  const isBoss = role === 'Boss';
  const isChef = role === 'Chef de Cuisine';
  const isMagasinier = role === 'Magasinier';
  const isGerant = role === 'Gérant';

  useEffect(() => {
    const savedItems = localStorage.getItem(ITEMS_STORAGE_KEY);
    const savedCommands = localStorage.getItem(COMMANDS_STORAGE_KEY);
    if (savedItems) setItems(JSON.parse(savedItems));
    if (savedCommands) setCommands(JSON.parse(savedCommands));
  }, [site]);

  useEffect(() => {
    if (items.length > 0) localStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(items));
  }, [items, site]);

  useEffect(() => {
    if (commands.length > 0) localStorage.setItem(COMMANDS_STORAGE_KEY, JSON.stringify(commands));
  }, [commands, site]);

  const [newProduct, setNewProduct] = useState({ name: '', category: CATEGORIES[0], unit: UNITS[0] as any, unitPrice: 0, minThreshold: 5 });

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || newProduct.unitPrice <= 0) return;
    const item: StockItem = { id: Date.now().toString(), name: newProduct.name, category: newProduct.category, quantity: 0, unit: newProduct.unit, unitPrice: newProduct.unitPrice, minThreshold: newProduct.minThreshold };
    const updatedItems = [...items, item];
    setItems(updatedItems);
    setIsAddingProduct(false);
    setNewProduct({ name: '', category: CATEGORIES[0], unit: UNITS[0] as any, unitPrice: 0, minThreshold: 5 });
  };

  const adjustStock = (id: string, delta: number) => {
    setItems(items.map(item => item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item));
  };

  const createCommand = () => {
    if (!isOrdering || orderQty <= 0) return;
    const newCommand: ChefCommand = { id: Date.now().toString(), productId: isOrdering.id, productName: isOrdering.name, quantity: orderQty, unit: isOrdering.unit, status: 'En attente', timestamp: new Date() };
    setCommands([newCommand, ...commands]);
    setIsOrdering(null);
    setOrderQty(0);
  };

  const handleMarkAsDelivered = (commandId: string) => {
    setCommands(commands.map(cmd => cmd.id === commandId ? { ...cmd, status: 'Livré' as const } : cmd));
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 bg-transparent pb-24">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-lg font-black text-white italic uppercase tracking-tight leading-none">Stocks Control</h2>
          <span className="text-[7px] text-rose-700 font-black uppercase tracking-[0.2em] mt-1">{site}</span>
        </div>
        {isBoss && (
          <button onClick={() => setIsAddingProduct(true)} className="w-8 h-8 flex items-center justify-center bg-rose-900/50 text-white rounded-lg border border-rose-800/30">
            <i className="fas fa-plus text-[10px]"></i>
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Table/List View */}
        <div className="bg-[#120303]/60 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden">
          <div className="px-4 py-2 border-b border-white/5 flex justify-between bg-white/5">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic">Catalogue</span>
            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{items.length} Réf</span>
          </div>
          
          <div className="divide-y divide-white/5">
            {items.map(item => (
              <div key={item.id} className="p-3 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-white truncate leading-none">{item.name}</p>
                  <p className="text-[7px] text-rose-500 font-black uppercase mt-1 opacity-70">{item.category}</p>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="text-center">
                    <p className={`text-xs font-black ${item.quantity <= item.minThreshold ? 'text-rose-500 animate-pulse' : 'text-emerald-500'}`}>
                      {item.quantity} <span className="text-[7px] opacity-60">{item.unit}</span>
                    </p>
                  </div>
                  
                  <div className="flex space-x-1">
                    {(isMagasinier || isBoss || isGerant) && (
                      <div className="flex bg-[#0a0202] rounded-lg border border-white/5 p-0.5">
                        <button onClick={() => adjustStock(item.id, -1)} className="w-5 h-5 flex items-center justify-center text-rose-500 text-[8px]"><i className="fas fa-minus"></i></button>
                        <button onClick={() => adjustStock(item.id, 1)} className="w-5 h-5 flex items-center justify-center text-emerald-500 text-[8px]"><i className="fas fa-plus"></i></button>
                      </div>
                    )}
                    {(isChef || isBoss) && (
                      <button onClick={() => setIsOrdering(item)} className="w-6 h-6 rounded-lg bg-rose-900/40 text-white flex items-center justify-center text-[8px]"><i className="fas fa-shopping-basket"></i></button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Commands List */}
        <div className="bg-[#120303]/60 backdrop-blur-md rounded-2xl border border-white/5 p-4 space-y-3">
          <h3 className="text-[9px] font-black text-white uppercase tracking-widest italic">Bons de Commande</h3>
          <div className="space-y-2">
            {commands.map(cmd => (
              <div key={cmd.id} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-white truncate leading-none">{cmd.productName}</p>
                  <p className="text-[7px] text-slate-500 font-black uppercase mt-1">{cmd.quantity} {cmd.unit}</p>
                </div>
                <div className="flex flex-col items-end">
                   <span className={`text-[6px] px-1.5 py-0.5 rounded uppercase font-black ${cmd.status === 'Livré' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'}`}>{cmd.status}</span>
                   {(isMagasinier || isBoss) && cmd.status === 'En attente' && (
                     <button onClick={() => handleMarkAsDelivered(cmd.id)} className="mt-1 text-emerald-500 text-[8px] uppercase font-black">Luvrer</button>
                   )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isAddingProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#1a0505] w-full max-w-[280px] rounded-3xl p-6 border border-white/10 shadow-2xl space-y-4">
             <h3 className="text-white font-black uppercase text-xs italic tracking-widest">Nouvel Article</h3>
             <form onSubmit={handleAddProduct} className="space-y-3">
                <input required type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-[10px]" placeholder="Désignation" />
                <div className="grid grid-cols-2 gap-2">
                  <select value={newProduct.unit} onChange={e => setNewProduct({...newProduct, unit: e.target.value as any})} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-[10px] outline-none appearance-none">
                    {UNITS.map(u => <option key={u} value={u} className="bg-[#1a0505]">{u}</option>)}
                  </select>
                  <input type="number" step="0.01" value={newProduct.unitPrice} onChange={e => setNewProduct({...newProduct, unitPrice: parseFloat(e.target.value)})} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-[10px]" placeholder="Prix DH" />
                </div>
                <button type="submit" className="w-full py-2.5 bg-rose-900 text-white rounded-xl text-[8px] font-black uppercase">Enregistrer</button>
                <button type="button" onClick={() => setIsAddingProduct(false)} className="w-full py-2.5 text-slate-600 text-[8px] font-black uppercase">Fermer</button>
             </form>
          </div>
        </div>
      )}

      {isOrdering && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#1a0505] w-full max-w-[280px] rounded-3xl p-6 border border-white/10 shadow-2xl space-y-4">
             <div className="text-center">
                <h3 className="text-white font-black uppercase text-xs">{isOrdering.name}</h3>
                <p className="text-[7px] text-rose-500 font-bold uppercase mt-1">Saisie Commande</p>
             </div>
             <input autoFocus type="number" value={orderQty} onChange={(e) => setOrderQty(parseFloat(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center text-2xl font-black text-white outline-none" placeholder="0.00" />
             <div className="flex gap-2">
                <button onClick={() => setIsOrdering(null)} className="flex-1 py-2.5 text-slate-600 text-[8px] font-black uppercase">Annuler</button>
                <button onClick={createCommand} className="flex-[2] py-2.5 bg-rose-900 text-white rounded-xl text-[8px] font-black uppercase">Commander</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockView;
