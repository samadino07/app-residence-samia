
export enum ViewType {
  DASHBOARD = 'DASHBOARD',
  STOCK = 'STOCK',
  MEALS = 'MEALS',
  MEAL_VOUCHERS = 'MEAL_VOUCHERS',
  APARTMENTS = 'APARTMENTS',
  BLANCHISSERIE = 'BLANCHISSERIE',
  STAFF = 'STAFF',
  CASH = 'CASH',
  REPORTS = 'REPORTS',
  SETTINGS = 'SETTINGS'
}

export type HotelSite = 'Fnideq' | 'M\'diq' | 'Al Hoceima' | 'Siège Social';

export type UserRole = 'Boss' | 'Gérant' | 'Chef de Cuisine' | 'Magasinier' | 'Caissier' | 'Réceptionniste';

export interface User {
  email: string;
  name: string;
  role: UserRole;
  site: HotelSite;
  password?: string;
}

export interface InternalMessage {
  id: string;
  senderName: string;
  senderRole: UserRole;
  senderSite: HotelSite;
  recipientRole: UserRole;
  recipientSite: HotelSite;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface AppNotification {
  id: string;
  type: 'danger' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  category: 'Stock' | 'Finance' | 'Restauration' | 'System';
}

export interface ActivityLog {
  id: string;
  userName: string;
  userRole: string;
  action: 'Connexion' | 'Déconnexion';
  timestamp: string;
  site: string;
}

export interface AttendanceRecord {
  date: string;
  status: 'Présent' | 'Absent' | 'Justifié';
}

export interface StaffMember {
  id: string;
  name: string;
  function: string;
  phone: string;
  site: HotelSite;
  monthlyBaseSalary: number;
  attendance: AttendanceRecord[];
  previousMonthSalary: number;
  status: 'En poste' | 'En congé' | 'Midi';
}

export type MealCategory = 'Petit-Déjeuner' | 'Déjeuner' | 'Goûter' | 'Dîner';

export interface Dish {
  id: string;
  name: string;
  description: string;
  price: number;
  category: MealCategory;
}

export interface DailyPlan {
  id: string;
  day: string;
  category: MealCategory;
  mainDishId: string;
  alternatives: string[];
}

export interface MealVoucher {
  id: string;
  type: 'Repas' | 'Boisson';
  clientName: string;
  apartmentNumber: string;
  mealType?: MealCategory;
  beverages: string[];
  status: 'Valide' | 'Consommé' | 'Annulé';
  date: string;
  timestamp: string;
}

export type StockCategory = 
  | 'Produits Laitiers' 
  | 'Boucherie' 
  | 'Épicerie' 
  | 'Boulangerie' 
  | 'Fruits & Légumes' 
  | 'Entretien' 
  | 'Autre';

export interface StockItem {
  id: string;
  name: string;
  category: StockCategory;
  quantity: number;
  unit: 'Kg' | 'L' | 'Unité' | 'Pack';
  unitPrice: number;
  minThreshold: number;
}

export interface ChefCommand {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  status: 'En attente' | 'Livré';
  timestamp: Date;
}

export interface ApartmentHistory {
  id: string;
  clientName: string;
  checkInDate: string;
  checkOutDate: string;
  occupantCount: number;
  accommodationType: string;
}

export interface Apartment {
  id: string;
  residenceName: string;
  block: string;
  number: string;
  type: 'Suite' | 'Appartement' | 'Studio';
  capacity: 2 | 4;
  status: 'Libre' | 'Occupé' | 'Ménage' | 'Maintenance';
  currentClient?: string;
  currentOccupantsCount: number;
  accommodationType?: '1/1 Single' | '1/2 Double' | '1/3 Triple' | '1/4 Quadruple';
  checkInDate?: string;
  history: ApartmentHistory[];
}

export type LaundryStatus = 'En attente' | 'En blanchisserie' | 'En réception' | 'Livré';

export interface LaundryRequest {
  id: string;
  clientName: string;
  apartmentId: string;
  apartmentNumber: string;
  items: string;
  status: LaundryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CashTransaction {
  id: string;
  type: 'Entrée' | 'Sortie';
  amount: number;
  description: string;
  timestamp: Date;
  category: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: Date;
}
