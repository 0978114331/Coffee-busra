export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'done';
export type TableStatus = 'free' | 'occupied';
export type Lang = 'en' | 'km';
export type PaymentCurrency = 'USD' | 'KHR';

export interface Table {
  id: string;
  num: number;
  status: TableStatus;
  current_orders: number;
}

export interface MenuItem {
  id: string;
  name: string;
  cat: string;
  description: string | null;
  price: number;
  image: string | null;
  available: boolean;
}

export interface OrderItem {
  id: string;
  name: string;
  displayName: string;
  price: number;
  qty: number;
  image: string | null;
  cat: string;
  sugar?: number;
  ice?: string;
  note?: string;
}

export interface Order {
  id: number;
  table_num: number;
  items: OrderItem[];
  total: number;
  note: string | null;
  status: OrderStatus;
  payment_currency: PaymentCurrency | null;
  exchange_rate: number | null;
  cash_received: number | null;
  change: number | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
}

export interface Settings {
  id: number;
  shop_name: string;
  logo_url: string;
  exchange_rate: number;
  admin_pin: string;
  customer_pin: string;
  tg_token: string;
  tg_chat_id: string;
  created_at: string;
  updated_at: string;
}

export interface Promos {
  id: number;
  active: boolean;
  images: string[];
  created_at: string;
}

export interface CartItem extends OrderItem {
  cartId: string;
}
