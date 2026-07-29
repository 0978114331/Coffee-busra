import { useStore } from '@/store/useStore';
import type { Order } from '@/types';

export function useOrders() {
  return useStore((s) => s.orders);
}

export function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export function isYesterday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return d.getDate() === yesterday.getDate() && d.getMonth() === yesterday.getMonth() && d.getFullYear() === yesterday.getFullYear();
}

export function isThisWeek(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(now.getDate() - 7);
  return d >= weekAgo && d <= now;
}

export function isThisMonth(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export function groupOrdersByDate(orders: Order[]): { label: string; orders: Order[] }[] {
  const today = orders.filter((o) => isToday(o.created_at));
  const yesterday = orders.filter((o) => isYesterday(o.created_at));
  const thisWeek = orders.filter((o) => isThisWeek(o.created_at) && !isToday(o.created_at) && !isYesterday(o.created_at));
  const older = orders.filter((o) => !isThisWeek(o.created_at));

  const groups: { label: string; orders: Order[] }[] = [];
  if (today.length) groups.push({ label: 'Today', orders: today });
  if (yesterday.length) groups.push({ label: 'Yesterday', orders: yesterday });
  if (thisWeek.length) groups.push({ label: 'This Week', orders: thisWeek });
  if (older.length) groups.push({ label: 'Older', orders: older });
  return groups;
}

export function getRevenueData(orders: Order[], mode: 'daily' | 'weekly' | 'monthly'): { labels: string[]; data: number[] } {
  const now = new Date();
  const labels: string[] = [];
  const data: number[] = [];

  if (mode === 'daily') {
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(now.getDate() - i);
      labels.push(day.toLocaleDateString('en', { weekday: 'short' }));
      const dayRevenue = orders
        .filter((o) => {
          const d = new Date(o.created_at);
          return d.getDate() === day.getDate() && d.getMonth() === day.getMonth() && d.getFullYear() === day.getFullYear();
        })
        .reduce((sum, o) => sum + o.total, 0);
      data.push(dayRevenue);
    }
  } else if (mode === 'weekly') {
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      labels.push(`W${4 - i}`);
      const weekRevenue = orders
        .filter((o) => {
          const d = new Date(o.created_at);
          return d >= weekStart && d <= weekEnd;
        })
        .reduce((sum, o) => sum + o.total, 0);
      data.push(weekRevenue);
    }
  } else {
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(month.toLocaleDateString('en', { month: 'short' }));
      const monthRevenue = orders
        .filter((o) => {
          const d = new Date(o.created_at);
          return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear();
        })
        .reduce((sum, o) => sum + o.total, 0);
      data.push(monthRevenue);
    }
  }

  return { labels, data };
}

export function getCategorySales(orders: Order[]): { labels: string[]; data: number[] } {
  const map = new Map<string, number>();
  for (const order of orders) {
    for (const item of (order.items || [])) {
      map.set(item.cat, (map.get(item.cat) ?? 0) + item.qty);
    }
  }
  const entries = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  return { labels: entries.map((e) => e[0]), data: entries.map((e) => e[1]) };
}

export function getTopProducts(orders: Order[], limit = 10): { labels: string[]; data: number[] } {
  const map = new Map<string, number>();
  for (const order of orders) {
    for (const item of (order.items || [])) {
      const name = item.displayName || item.name;
      map.set(name, (map.get(name) ?? 0) + item.qty);
    }
  }
  const entries = Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, limit);
  return { labels: entries.map((e) => e[0]), data: entries.map((e) => e[1]) };
}

export function getBestSeller(orders: Order[]): string {
  const { labels, data } = getTopProducts(orders, 1);
  if (!labels.length) return '-';
  return `${labels[0]} (${data[0]})`;
}

export function getTopCategory(orders: Order[]): string {
  const { labels } = getCategorySales(orders);
  return labels[0] ?? '-';
}

export function getTotalProductsSold(orders: Order[]): number {
  return orders.reduce((sum, o) => sum + (o.items || []).reduce((s, i) => s + i.qty, 0), 0);
}

export function getAvgOrderValue(orders: Order[]): number {
  if (!orders.length) return 0;
  const total = orders.reduce((sum, o) => sum + o.total, 0);
  return total / orders.length;
}