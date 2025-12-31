
import { User, UserRole, ActivityLog } from '../types';

const SESSION_KEY = 'samia_suite_session';
const USERS_KEY = 'samia_users_db';
const LOGS_KEY = 'samia_activity_logs';

const INITIAL_USERS: Record<string, { user: User, pass: string }> = {
  // BOSS
  '1': { user: { email: '1', name: 'Le Boss', role: 'Boss', site: 'Siège Social' }, pass: '1' },

  // FNIDEQ (Site 1)
  'G1': { user: { email: 'G1', name: 'Gérant Fnideq', role: 'Gérant', site: 'Fnideq' }, pass: '1' },
  'Ch1': { user: { email: 'Ch1', name: 'Chef Fnideq', role: 'Chef de Cuisine', site: 'Fnideq' }, pass: '1' },
  'M1': { user: { email: 'M1', name: 'Magasinier Fnideq', role: 'Magasinier', site: 'Fnideq' }, pass: '1' },
  'C1': { user: { email: 'C1', name: 'Caissier Fnideq', role: 'Caissier', site: 'Fnideq' }, pass: '1' },
  'R1': { user: { email: 'R1', name: 'Réception Fnideq', role: 'Réceptionniste', site: 'Fnideq' }, pass: '1' },

  // M'DIQ (Site 2)
  'G2': { user: { email: 'G2', name: 'Gérant M\'diq', role: 'Gérant', site: 'M\'diq' }, pass: '1' },
  'Ch2': { user: { email: 'Ch2', name: 'Chef M\'diq', role: 'Chef de Cuisine', site: 'M\'diq' }, pass: '1' },
  'M2': { user: { email: 'M2', name: 'Magasinier M\'diq', role: 'Magasinier', site: 'M\'diq' }, pass: '1' },
  'C2': { user: { email: 'C2', name: 'Caissier M\'diq', role: 'Caissier', site: 'M\'diq' }, pass: '1' },
  'R2': { user: { email: 'R2', name: 'Réception M\'diq', role: 'Réceptionniste', site: 'M\'diq' }, pass: '1' },

  // AL HOICEIMA (Site 3)
  'G3': { user: { email: 'G3', name: 'Gérant Hoceima', role: 'Gérant', site: 'Al Hoceima' }, pass: '1' },
  'Ch3': { user: { email: 'Ch3', name: 'Chef Hoceima', role: 'Chef de Cuisine', site: 'Al Hoceima' }, pass: '3' },
  'M3': { user: { email: 'M3', name: 'Magasinier Hoceima', role: 'Magasinier', site: 'Al Hoceima' }, pass: '1' },
  'C3': { user: { email: 'C3', name: 'Caissier Hoceima', role: 'Caissier', site: 'Al Hoceima' }, pass: '1' },
  'R3': { user: { email: 'R3', name: 'Réception Hoceima', role: 'Réceptionniste', site: 'Al Hoceima' }, pass: '1' }
};

// Fonction utilitaire pour lire le stockage sans crasher
const safeGet = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (!item || item === "undefined" || item === "null") return fallback;
    return JSON.parse(item);
  } catch (e) {
    console.warn(`Données corrompues pour ${key} ou accès impossible, réinitialisation.`);
    try { localStorage.removeItem(key); } catch(err) {}
    return fallback;
  }
};

export const authService = {
  getUsers: (): Record<string, { user: User, pass: string }> => {
    const users = safeGet(USERS_KEY, INITIAL_USERS);
    // Si l'objet est vide ou mal formé, on remet les utilisateurs par défaut
    if (!users || Object.keys(users).length === 0) {
        try { localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS)); } catch(e) {}
        return INITIAL_USERS;
    }
    return users;
  },

  addUser: (userData: User, pass: string) => {
    try {
      const users = authService.getUsers();
      users[userData.email] = { user: userData, pass };
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch (e) {
      console.error("Erreur ajout utilisateur", e);
    }
  },

  deleteUser: (email: string) => {
    try {
      const users = authService.getUsers();
      delete users[email];
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch (e) {
      console.error("Erreur suppression utilisateur", e);
    }
  },

  updatePassword: (email: string, newPass: string) => {
    try {
      const users = authService.getUsers();
      if (users[email]) {
        users[email].pass = newPass;
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
      }
    } catch (e) {
      console.error("Erreur maj mot de passe", e);
    }
  },

  logActivity: (user: User, action: 'Connexion' | 'Déconnexion') => {
    try {
      const logs: ActivityLog[] = safeGet(LOGS_KEY, []);
      const newLog: ActivityLog = {
        id: Date.now().toString(),
        userName: user.name,
        userRole: user.role,
        action,
        timestamp: new Date().toISOString(),
        site: user.site
      };
      localStorage.setItem(LOGS_KEY, JSON.stringify([newLog, ...logs].slice(0, 500)));
    } catch (e) {
      console.error("Erreur log activity", e);
    }
  },

  getLogs: (): ActivityLog[] => {
    return safeGet(LOGS_KEY, []);
  },

  login: (email: string, pass: string, role: UserRole, stayConnected: boolean): User => {
    const users = authService.getUsers();
    const entry = users[email];
    
    if (!entry || entry.pass !== pass) {
      throw new Error('Identifiant ou mot de passe incorrect');
    }
    
    if (entry.user.role !== role) {
      throw new Error('Le poste sélectionné ne correspond pas à ce profil');
    }
    
    const userStr = JSON.stringify(entry.user);
    try {
        if (stayConnected) {
          localStorage.setItem(SESSION_KEY, userStr);
        } else {
          sessionStorage.setItem(SESSION_KEY, userStr);
        }
    } catch(e) {}

    authService.logActivity(entry.user, 'Connexion');
    return entry.user;
  },

  logout: () => {
    try {
      const user = authService.getCurrentUser();
      if (user) authService.logActivity(user, 'Déconnexion');
    } catch (e) {
      // Ignorer erreur de logout
    }
    try {
        localStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(SESSION_KEY);
    } catch(e) {}
  },

  getCurrentUser: (): User | null => {
    try {
      const sessionLocal = localStorage.getItem(SESSION_KEY);
      const sessionSession = sessionStorage.getItem(SESSION_KEY);
      
      if (sessionLocal && sessionLocal !== "undefined") return JSON.parse(sessionLocal);
      if (sessionSession && sessionSession !== "undefined") return JSON.parse(sessionSession);
      
      return null;
    } catch (e) {
      try {
          localStorage.removeItem(SESSION_KEY);
          sessionStorage.removeItem(SESSION_KEY);
      } catch(err) {}
      return null;
    }
  }
};
