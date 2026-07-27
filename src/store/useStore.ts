import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { translate, type TranslationKey } from '@/lib/i18n';
import type {
  CartItem,
  Lang,
  MenuItem,
  Order,
  OrderItem,
  Promos,
  Settings,
  Table,
} from '@/types';

const LS_SESSION_KEY = 'cb_session_orders';
const LS_LANG_KEY = 'cb_lang';

function loadSessionIds(): number[] {
  try {
    const raw = localStorage.getItem(LS_SESSION_KEY);
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

function saveSessionIds(ids: number[]) {
  try {
    localStorage.setItem(LS_SESSION_KEY, JSON.stringify(ids));
  } catch {}
}

function loadLang(): Lang {
  try {
    const raw = localStorage.getItem(LS_LANG_KEY);
    return raw === 'km' ? 'km' : 'en';
  } catch {
    return 'en';
  }
}

interface AppState {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;

  tables: Table[];
  menuItems: MenuItem[];
  orders: Order[];
  settings: Settings | null;
  promos: Promos | null;
  loading: boolean;
  error: string | null;

  cart: CartItem[];
  selectedTable: number | null;
  sessionOrderIds: number[];

  adminUnlocked: boolean;
  customerUnlocked: boolean;
  setAdminUnlocked: (v: boolean) => void;
  setCustomerUnlocked: (v: boolean) => void;

  init: () => Promise<(() => void) | undefined>;
  refreshOrders: () => Promise<void>;
  setSelectedTable: (n: number | null) => void;

  addToCart: (item: MenuItem, opts?: { sugar?: number; ice?: string; note?: string }) => void;
  updateCartQty: (cartId: string, qty: number) => void;
  removeFromCart: (cartId: string) => void;
  clearCart: () => void;
  cartCount: () => number;
  cartTotal: () => number;

  placeOrder: (note: string, lat: number | null, lng: number | null) => Promise<{ success: boolean; order?: Order; error?: string }>;
  clearSessionOrders: () => void;

  addTable: (num: number) => Promise<void>;
  deleteTable: (id: string) => Promise<void>;

  addMenuItem: (item: Omit<MenuItem, 'id'>) => Promise<void>;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;

  updateOrderStatus: (id: number, status: Order['status']) => Promise<void>;
  updateOrderPayment: (id: number, payment: { payment_currency: 'USD' | 'KHR'; exchange_rate: number; cash_received: number; change: number }) => Promise<void>;
  deleteOrder: (id: number) => Promise<void>;

  updateSettings: (updates: Partial<Settings>) => Promise<void>;
  updatePromos: (updates: Partial<Promos>) => Promise<void>;

  resetOrders: () => Promise<void>;
  resetAll: () => Promise<void>;
}

const initialLang = loadLang();
const initialSessionIds = loadSessionIds();

export const useStore = create<AppState>((set, get) => ({
  lang: initialLang,
  setLang: (lang) => {
    localStorage.setItem(LS_LANG_KEY, lang);
    set({ lang });
  },
  t: (key, vars) => translate(get().lang, key, vars),

  tables: [],
  menuItems: [],
  orders: [],
  settings: null,
  promos: null,
  loading: true,
  error: null,

  cart: [],
  selectedTable: null,
  sessionOrderIds: initialSessionIds,

  adminUnlocked: false,
  customerUnlocked: false,
  setAdminUnlocked: (v) => set({ adminUnlocked: v }),
  setCustomerUnlocked: (v) => set({ customerUnlocked: v }),

  init: async () => {
    set({ loading: true, error: null });
    try {
      const [tablesRes, menuRes, ordersRes, settingsRes, promosRes] = await Promise.all([
        supabase.from('tables').select('*').order('num', { ascending: true }),
        supabase.from('menu_items').select('*').order('cat', { ascending: true }),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('settings').select('*').eq('id', 1).maybeSingle(),
        supabase.from('promos').select('*').eq('id', 1).maybeSingle(),
      ]);

      set({
        tables: (tablesRes.data as Table[]) ?? [],
        menuItems: (menuRes.data as MenuItem[]) ?? [],
        orders: (ordersRes.data as Order[]) ?? [],
        settings: (settingsRes.data as Settings) ?? null,
        promos: (promosRes.data as Promos) ?? null,
        loading: false,
      });

      const channel = supabase
        .channel('coffee-busra-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
          const current = get().orders;
          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new as Order;
            if (!current.find((o) => o.id === newOrder.id)) {
              set({ orders: [newOrder, ...current] });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Order;
            set({ orders: current.map((o) => (o.id === updated.id ? updated : o)) });
          } else if (payload.eventType === 'DELETE') {
            const old = payload.old as { id: number };
            set({ orders: current.filter((o) => o.id !== old.id) });
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, (payload) => {
          const current = get().tables;
          if (payload.eventType === 'INSERT') {
            const t = payload.new as Table;
            if (!current.find((x) => x.id === t.id)) set({ tables: [...current, t] });
          } else if (payload.eventType === 'UPDATE') {
            const t = payload.new as Table;
            set({ tables: current.map((x) => (x.id === t.id ? t : x)) });
          } else if (payload.eventType === 'DELETE') {
            const old = payload.old as { id: string };
            set({ tables: current.filter((x) => x.id !== old.id) });
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, (payload) => {
          const current = get().menuItems;
          if (payload.eventType === 'INSERT') {
            const m = payload.new as MenuItem;
            if (!current.find((x) => x.id === m.id)) set({ menuItems: [...current, m] });
          } else if (payload.eventType === 'UPDATE') {
            const m = payload.new as MenuItem;
            set({ menuItems: current.map((x) => (x.id === m.id ? m : x)) });
          } else if (payload.eventType === 'DELETE') {
            const old = payload.old as { id: string };
            set({ menuItems: current.filter((x) => x.id !== old.id) });
          }
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'settings' }, (payload) => {
          set({ settings: payload.new as Settings });
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'promos' }, (payload) => {
          set({ promos: payload.new as Promos });
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      return undefined;
    }
  },

  refreshOrders: async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (data) set({ orders: data as Order[] });
  },

  setSelectedTable: (n) => set({ selectedTable: n }),

  addToCart: (item, opts) => {
    const sugar = opts?.sugar;
    const ice = opts?.ice;
    const note = opts?.note;
    const cartId = `${item.id}-${sugar ?? ''}-${ice ?? ''}-${note ?? ''}`;
    const sugarLabel = sugar != null ? `${sugar}% Sugar` : '';
    const displayName = [item.name, sugarLabel, ice ?? '', note ? `(${note})` : ''].filter(Boolean).join(', ');
    const existing = get().cart.find((c) => c.cartId === cartId);
    if (existing) {
      set({ cart: get().cart.map((c) => (c.cartId === cartId ? { ...c, qty: c.qty + 1 } : c)) });
    } else {
      const newItem: CartItem = {
        cartId,
        id: item.id,
        name: item.name,
        displayName,
        price: item.price,
        qty: 1,
        image: item.image,
        cat: item.cat,
        sugar,
        ice,
        note,
      };
      set({ cart: [...get().cart, newItem] });
    }
  },

  updateCartQty: (cartId, qty) => {
    if (qty <= 0) {
      set({ cart: get().cart.filter((c) => c.cartId !== cartId) });
    } else {
      set({ cart: get().cart.map((c) => (c.cartId === cartId ? { ...c, qty } : c)) });
    }
  },

  removeFromCart: (cartId) => set({ cart: get().cart.filter((c) => c.cartId !== cartId) }),
  clearCart: () => set({ cart: [] }),
  cartCount: () => get().cart.reduce((sum, c) => sum + c.qty, 0),
  cartTotal: () => get().cart.reduce((sum, c) => sum + c.qty * c.price, 0),

  placeOrder: async (note, lat, lng) => {
    const { cart, selectedTable, settings } = get();
    if (cart.length === 0) return { success: false, error: 'Cart is empty' };
    if (selectedTable == null) return { success: false, error: 'No table selected' };

    const items: OrderItem[] = cart.map((c) => ({
      id: c.id,
      name: c.name,
      displayName: c.displayName,
      price: c.price,
      qty: c.qty,
      image: c.image,
      cat: c.cat,
      sugar: c.sugar,
      ice: c.ice,
      note: c.note,
    }));
    const total = cart.reduce((sum, c) => sum + c.qty * c.price, 0);

    const { data, error } = await supabase
      .from('orders')
      .insert({
        table_num: selectedTable,
        items,
        total,
        note: note || null,
        status: 'pending',
        lat,
        lng,
      })
      .select()
      .single();

    if (error || !data) {
      return { success: false, error: error?.message ?? 'Failed to place order' };
    }

    const order = data as Order;
    const newIds = [...get().sessionOrderIds, order.id];
    saveSessionIds(newIds);
    set({ cart: [], sessionOrderIds: newIds });

    // Fire-and-forget Telegram notification via edge function
    const tgToken = settings?.tg_token;
    const tgChatId = settings?.tg_chat_id;
    if (tgToken && tgChatId) {
      try {
        const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/telegram-notify`;
        await fetch(fnUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ orderId: order.id, tgToken, tgChatId }),
        });
      } catch {
        // non-fatal
      }
    }

    return { success: true, order };
  },

  clearSessionOrders: () => {
    saveSessionIds([]);
    set({ sessionOrderIds: [] });
  },

  addTable: async (num) => {
    await supabase.from('tables').insert({ num, status: 'free', current_orders: 0 });
  },
  deleteTable: async (id) => {
    await supabase.from('tables').delete().eq('id', id);
  },

  addMenuItem: async (item) => {
    await supabase.from('menu_items').insert(item);
  },
  updateMenuItem: async (id, updates) => {
    await supabase.from('menu_items').update(updates).eq('id', id);
  },
  deleteMenuItem: async (id) => {
    await supabase.from('menu_items').delete().eq('id', id);
  },

  updateOrderStatus: async (id, status) => {
    await supabase.from('orders').update({ status }).eq('id', id);
  },
  updateOrderPayment: async (id, payment) => {
    await supabase.from('orders').update(payment).eq('id', id);
  },
  deleteOrder: async (id) => {
    await supabase.from('orders').delete().eq('id', id);
  },

  updateSettings: async (updates) => {
    await supabase.from('settings').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', 1);
  },
  updatePromos: async (updates) => {
    await supabase.from('promos').update(updates).eq('id', 1);
  },

  resetOrders: async () => {
    await supabase.from('orders').delete().neq('id', 0);
  },
  resetAll: async () => {
    await supabase.from('orders').delete().neq('id', 0);
    await supabase.from('menu_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('tables').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  },
}));
