import React, { useState, useEffect, useMemo, Component, ReactNode } from 'react';
import { ViewType, User, HotelSite, AppNotification, InternalMessage, UserRole } from './types.ts';
import DashboardView from './components/DashboardView.tsx';
import StockView from './components/StockView.tsx';
import MealsView from './components/MealsView.tsx';
import MealVouchersView from './components/MealVouchersView.tsx';
import StaffView from './components/StaffView.tsx';
import ApartmentView from './components/ApartmentView.tsx';
import LaundryView from './components/LaundryView.tsx';
import CashView from './components/CashView.tsx';
import ReportView from './components/ReportView.tsx';
import SettingsView from './components/SettingsView.tsx';
import AuthView from './components/AuthView.tsx';
import LoadingView from './components/LoadingView.tsx';
import { authService } from './services/authService.ts';

const LOGO_URL = "https://i.ibb.co/XZZBLSSW/Chat-GPT-Image-Dec-31-2025-02-10-28-AM.png";

// -- ERROR BOUNDARY --
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(_: Error) { return { hasError: true }; }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("App Crash:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) return (
      <div className="flex h-screen w-full items-center justify-center bg-black text-white p-10 flex-col text-center">
        <h1 className="text-2xl font-bold text-rose-500 mb-4">Erreur Système Critique</h1>
        <p className="text-sm text-slate-400 mb-6">Une erreur inattendue est survenue. Le système de sécurité a stoppé l'exécution.</p>
        <button onClick={() => window.location.reload()} className="px-6 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all font-bold uppercase text-xs">Redémarrer le Système</button>
      </div>
    );
    return this.props.children;
  }
}

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeSite, setActiveSite] = useState<HotelSite>('Fnideq');
  const [currentView, setCurrentView] = useState<ViewType>(ViewType.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [currentTime, setCurrentTime] = useState(new Date());

  const [notifications, setNotifications] = useState<AppNotification[]>([
    { id: '1', type: 'warning', title: 'Stock Bas', message: 'Alerte : Riz et Huile en baisse.', timestamp: new Date().toISOString(), category: 'Stock' },
    { id: '2', type: 'success', title: 'Système', message: 'Système Samia v4.2 opérationnel.', timestamp: new Date().toISOString(), category: 'System' }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const [internalMessages, setInternalMessages] = useState<InternalMessage[]>([]);
  const [showMessenger, setShowMessenger] = useState(false);
  const [newMessage, setNewMessage] = useState({ content: '', recipientRole: 'Gérant' as UserRole, recipientSite: 'Fnideq' as HotelSite });
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const initApp = async () => {
      try {
        const user = authService.getCurrentUser();
        if (user) {
          setCurrentUser(user);
          setActiveSite(user.role === 'Boss' ? 'Fnideq' : user.site);
        }
        
        // Chargement sécurisé des messages
        try {
            const savedMsgs = localStorage.getItem('samia_internal_messages');
            if (savedMsgs && savedMsgs !== "undefined") {
                setInternalMessages(JSON.parse(savedMsgs));
            } else {
                setInternalMessages([]);
            }
        } catch (e) {
            console.warn("Resetting internal messages due to error");
            localStorage.removeItem('samia_internal_messages');
            setInternalMessages([]);
        }

      } catch (err) {
        console.error("Critical Init Error", err);
        // En cas d'erreur critique, on déconnecte pour réinitialiser l'état
        authService.logout();
      } finally {
        setTimeout(() => setIsLoading(false), 3000);
      }
    };

    initApp();
  }, []);

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setIsSidebarOpen(false);
    setCurrentView(ViewType.DASHBOARD);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newMessage.content.trim()) return;
    const msg: InternalMessage = {
      id: Date.now().toString(),
      senderName: currentUser.name,
      senderRole: currentUser.role,
      senderSite: currentUser.site,
      recipientRole: newMessage.recipientRole,
      recipientSite: newMessage.recipientSite,
      content: newMessage.content,
      timestamp: new Date().toISOString(),
      isRead: false
    };
    const updated = [msg, ...internalMessages];
    setInternalMessages(updated);
    localStorage.setItem('samia_internal_messages', JSON.stringify(updated));
    setNewMessage({ ...newMessage, content: '' });
  };

  const visibleMessages = useMemo(() => {
    if (!currentUser) return [];
    return internalMessages.filter(m => {
      if (currentUser.role === 'Boss') return true;
      if (m.senderName === currentUser.name) return true;
      return m.recipientRole === currentUser.role && m.recipientSite === currentUser.site;
    });
  }, [internalMessages, currentUser]);

  const unreadCount = useMemo(() => {
    if (!currentUser) return 0;
    return visibleMessages.filter(m => m.recipientRole === currentUser.role && !m.isRead).length;
  }, [visibleMessages, currentUser]);

  if (isLoading) return <LoadingView />;
  if (!currentUser) return <AuthView onLogin={(user) => { setCurrentUser(user); setActiveSite(user.role === 'Boss' ? 'Fnideq' : user.site); }} />;

  const isBoss = currentUser.role === 'Boss';
  const isGerant = currentUser.role === 'Gérant';

  const NavItem: React.FC<{ view: ViewType; icon: string; label: string }> = ({ view, icon, label }) => {
    const isActive = currentView === view;
    return (
      <button
        onClick={() => { setCurrentView(view); setIsSidebarOpen(false); }}
        className={`w-full group flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all relative overflow-hidden ${
          isActive 
            ? 'bg-gradient-to-r from-rose-900/40 to-rose-950/10 text-white shadow-lg border border-white/5' 
            : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        {isActive && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-rose-600 shadow-[0_0_10px_#e11d48]"></div>}
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
          isActive ? 'bg-rose-600 text-white' : 'bg-[#0f0303] group-hover:bg-rose-950/30'
        }`}>
          <i className={`fas ${icon} text-[10px]`}></i>
        </div>
        <span className="font-bold text-[10px] uppercase tracking-tight">{label}</span>
      </button>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="shrink-0 pb-6 border-b border-white/5">
        <div className="flex items-center space-x-3 mb-6">
          <img src={LOGO_URL} className="w-9 h-9 rounded-xl border border-white/10" />
          <div>
            <h1 className="text-sm font-black text-white italic uppercase tracking-tighter leading-tight">Samia Hub</h1>
            <p className="text-[7px] font-black text-rose-600 uppercase tracking-widest">Hub System</p>
          </div>
        </div>
        {isBoss && (
          <div className="bg-[#0a0202] rounded-xl p-1 border border-white/5 flex gap-1">
            {['Fnideq', 'M\'diq', 'Al Hoceima'].map((site) => (
              <button key={site} onClick={() => setActiveSite(site as HotelSite)} className={`flex-1 text-[8px] font-black uppercase py-1.5 rounded-lg transition-all ${activeSite === site ? 'bg-rose-900 text-white' : 'text-slate-600'}`}>
                {site.charAt(0)}
              </button>
            ))}
          </div>
        )}
      </div>
      
      <nav className="flex-1 overflow-y-auto custom-scrollbar py-4 space-y-1">
        <div className="px-3 mb-2 opacity-40"><span className="text-[7px] font-black uppercase tracking-[0.3em]">Principal</span></div>
        <NavItem view={ViewType.DASHBOARD} icon="fa-th-large" label="Tableau de Bord" />
        <NavItem view={ViewType.APARTMENTS} icon="fa-key" label="Suites" />
        <NavItem view={ViewType.BLANCHISSERIE} icon="fa-soap" label="Blanchisserie" />
        
        <div className="px-3 mb-2 mt-4 opacity-40"><span className="text-[7px] font-black uppercase tracking-[0.3em]">Logistique</span></div>
        <NavItem view={ViewType.MEAL_VOUCHERS} icon="fa-receipt" label="Bons Resto" />
        <NavItem view={ViewType.STOCK} icon="fa-box-open" label="Stocks" />
        <NavItem view={ViewType.MEALS} icon="fa-utensils" label="Planning" />
        
        <div className="px-3 mb-2 mt-4 opacity-40"><span className="text-[7px] font-black uppercase tracking-[0.3em]">Administration</span></div>
        {(isBoss || isGerant) && <NavItem view={ViewType.CASH} icon="fa-wallet" label="Caisse" />}
        <NavItem view={ViewType.STAFF} icon="fa-user-tie" label="Personnel" />
        {(isBoss || isGerant) && <NavItem view={ViewType.REPORTS} icon="fa-chart-bar" label="Rapports" />}
      </nav>

      <div className="shrink-0 pt-4 border-t border-white/5 space-y-3">
        <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center space-x-2">
           <div className="w-8 h-8 rounded-lg bg-rose-900 flex items-center justify-center text-white font-black text-[10px]">{currentUser.name.charAt(0)}</div>
           <div className="flex-1 min-w-0">
             <p className="text-[9px] font-bold text-slate-200 truncate leading-none">{currentUser.name}</p>
             <p className="text-[6px] text-rose-500 font-black uppercase tracking-widest mt-1">{currentUser.role}</p>
           </div>
        </div>
        <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-rose-950/20 text-rose-500 text-[8px] font-black uppercase hover:bg-rose-900 hover:text-white transition-all">
          <i className="fas fa-power-off"></i><span>Déconnexion</span>
        </button>
      </div>
    </div>
  );

  const renderView = () => {
    switch (currentView) {
      case ViewType.DASHBOARD: return <DashboardView site={activeSite} isBoss={isBoss} />;
      case ViewType.STOCK: return <StockView site={activeSite} role={currentUser.role} />;
      case ViewType.MEALS: return <MealsView site={activeSite} />;
      case ViewType.MEAL_VOUCHERS: return <MealVouchersView site={activeSite} />;
      case ViewType.APARTMENTS: return <ApartmentView site={activeSite} />;
      case ViewType.BLANCHISSERIE: return <LaundryView site={activeSite} />;
      case ViewType.STAFF: return <StaffView site={activeSite} isBoss={isBoss} />;
      case ViewType.CASH: return <CashView site={activeSite} />;
      case ViewType.REPORTS: return <ReportView site={activeSite} />;
      case ViewType.SETTINGS: return <SettingsView onBack={() => setCurrentView(ViewType.DASHBOARD)} />;
      default: return <DashboardView site={activeSite} isBoss={isBoss} />;
    }
  };

  return (
    <ErrorBoundary>
      <div className="flex h-screen w-full overflow-hidden bg-[#070101] text-slate-300">
        <aside className="hidden md:block w-64 border-r border-white/5 p-5 bg-[#0a0202] h-full shrink-0">
          <SidebarContent />
        </aside>

        <main className="flex-1 flex flex-col relative h-full min-w-0">
          <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-[#0a0202]/95 backdrop-blur-xl z-[40] shrink-0">
            <div className="flex items-center space-x-5">
              <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-rose-600 text-lg"><i className="fas fa-bars"></i></button>
              <div className="flex flex-col">
                <span className="text-[13px] font-black text-white font-mono leading-none tracking-tight">
                  {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                </span>
                <span className="text-[7px] font-black text-rose-600 uppercase tracking-widest mt-1 opacity-80">
                  {currentTime.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2.5">
              <button onClick={() => { setShowMessenger(!showMessenger); setShowNotifications(false); }} className={`relative w-10 h-10 flex items-center justify-center rounded-xl border transition-all ${showMessenger ? 'bg-rose-900 border-rose-800 text-white' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'}`}>
                  <i className="fas fa-comment-dots text-xs"></i>
                  {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-700 rounded-full text-[7px] font-black flex items-center justify-center border border-black shadow-lg">{unreadCount}</span>}
              </button>
              <button onClick={() => { setShowNotifications(!showNotifications); setShowMessenger(false); }} className={`relative w-10 h-10 flex items-center justify-center rounded-xl border transition-all ${showNotifications ? 'bg-rose-900 border-rose-800 text-white' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'}`}>
                  <i className="fas fa-bell text-xs"></i>
                  {notifications.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 rounded-full text-[7px] font-black flex items-center justify-center border border-black shadow-lg">{notifications.length}</span>}
              </button>
              {isBoss && (
                <button 
                  onClick={() => { setCurrentView(ViewType.SETTINGS); setShowMessenger(false); setShowNotifications(false); }} 
                  className={`relative w-10 h-10 flex items-center justify-center rounded-xl border transition-all ${currentView === ViewType.SETTINGS ? 'bg-rose-900 border-rose-800 text-white shadow-[0_0_15px_rgba(225,29,72,0.3)]' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'}`}
                >
                  <i className="fas fa-cog text-xs"></i>
                </button>
              )}
            </div>
          </header>

          <div className="flex-1 overflow-hidden relative">
            <div className="absolute inset-0 overflow-y-auto custom-scrollbar bg-[#070101]">
              {renderView()}
            </div>

            {showMessenger && (
              <div className="absolute top-0 right-0 w-full sm:w-80 h-full bg-[#0a0202]/98 border-l border-white/10 z-[50] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-in slide-in-from-right duration-300">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-rose-950/20">
                    <h4 className="text-[10px] font-black text-white uppercase italic tracking-widest">Intercom Hub</h4>
                    <button onClick={() => setShowMessenger(false)} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-white"><i className="fas fa-times"></i></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {visibleMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center opacity-10">
                        <i className="fas fa-comments text-4xl mb-3"></i>
                        <p className="text-[8px] font-black uppercase">Silence Radio</p>
                      </div>
                    ) : (
                      visibleMessages.map(m => (
                        <div key={m.id} className={`p-3 rounded-2xl border ${m.senderName === currentUser.name ? 'bg-rose-900/10 border-rose-900/20 ml-6' : 'bg-white/5 border-white/5 mr-6'}`}>
                          <div className="flex justify-between items-center mb-1.5">
                              <span className="text-[7px] font-black text-rose-500 uppercase">{m.senderName}</span>
                              <span className="text-[6px] text-slate-600 font-bold">{new Date(m.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                          </div>
                          <p className="text-[10px] text-slate-200 leading-tight">{m.content}</p>
                        </div>
                      ))
                    )}
                </div>
                <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-[#070101] space-y-2.5">
                    <div className="grid grid-cols-2 gap-2">
                      <select value={newMessage.recipientSite} onChange={e => setNewMessage({...newMessage, recipientSite: e.target.value as HotelSite})} className="bg-[#0a0202] border border-white/10 rounded-xl p-2 text-[8px] text-white outline-none">
                        {['Fnideq', 'M\'diq', 'Al Hoceima'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <select value={newMessage.recipientRole} onChange={e => setNewMessage({...newMessage, recipientRole: e.target.value as UserRole})} className="bg-[#0a0202] border border-white/10 rounded-xl p-2 text-[8px] text-white outline-none">
                        {['Gérant', 'Chef de Cuisine', 'Magasinier', 'Caissier', 'Réceptionniste'].map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <input type="text" value={newMessage.content} onChange={e => setNewMessage({...newMessage, content: e.target.value})} placeholder="Message sécurisé..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] text-white outline-none focus:border-rose-900 transition-all" />
                      <button type="submit" className="w-12 h-12 bg-rose-900 text-white rounded-xl flex items-center justify-center active:scale-90 transition-all shadow-lg"><i className="fas fa-paper-plane text-[11px]"></i></button>
                    </div>
                </form>
              </div>
            )}

            {showNotifications && (
              <div className="absolute top-0 right-0 w-full sm:w-85 bg-[#120303]/98 backdrop-blur-3xl border-l border-white/10 h-full shadow-[0_20px_60px_rgba(0,0,0,0.9)] z-[50] p-5 flex flex-col animate-in slide-in-from-right duration-300">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <h4 className="text-[10px] font-black text-white uppercase italic tracking-[0.2em]">Flux d'Alertes</h4>
                    <div className="flex gap-4">
                      <button onClick={() => setNotifications([])} className="text-[7px] text-rose-600 uppercase font-black hover:underline">Vider</button>
                      <button onClick={() => setShowNotifications(false)} className="text-slate-500"><i className="fas fa-times"></i></button>
                    </div>
                </div>
                <div className="space-y-2.5 overflow-y-auto custom-scrollbar pr-1 mt-4">
                    {notifications.length === 0 ? (
                      <p className="text-[8px] text-center opacity-20 py-8 uppercase font-bold tracking-widest">Zone Calme</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex gap-4 hover:bg-white/10 transition-colors">
                          <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${n.type === 'warning' ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'}`}></div>
                          <div className="flex-1">
                              <p className="text-[10px] font-black text-white leading-tight">{n.title}</p>
                              <p className="text-[8px] text-slate-500 leading-tight mt-1 font-medium">{n.message}</p>
                              <span className="text-[6px] text-slate-700 font-bold uppercase mt-1.5 block">{new Date(n.timestamp).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      ))
                    )}
                </div>
              </div>
            )}
          </div>
        </main>

        {isSidebarOpen && <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[45] md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
        <aside className={`fixed inset-y-0 left-0 w-72 bg-[#0a0202] border-r border-white/5 p-6 z-[50] transform transition-transform duration-500 md:hidden flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full shadow-2xl'}`}>
          <SidebarContent />
        </aside>
      </div>
    </ErrorBoundary>
  );
};

export default App;