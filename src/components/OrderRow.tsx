import type { Order, OrderStatus } from '@/types';
import { useStore } from '@/store/useStore';

interface OrderRowProps {
  order: Order;
  onClick?: () => void;
  showActions?: boolean;
  onAdvance?: () => void;
}

const statusClass: Record<OrderStatus, string> = {
  pending: 'status-pending',
  preparing: 'status-preparing',
  ready: 'status-ready',
  done: 'status-done',
};

export default function OrderRow({ order, onClick, showActions, onAdvance }: OrderRowProps) {
  const t = useStore((s) => s.t);
  const itemsText = (order.items || [])
    .map((i) => `${i.qty}× ${i.displayName || i.name}`)
    .join(', ');

  const nextStatus: Record<OrderStatus, string | null> = {
    pending: 'preparing',
    preparing: 'ready',
    ready: 'done',
    done: null,
  };
  const next = nextStatus[order.status];

  return (
    <div className="order-row" onClick={onClick}>
      <div>#{order.id}</div>
      <div>{order.table_num}</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{itemsText}</div>
      <div style={{ color: 'var(--gold)', fontWeight: 'bold' }}>${order.total.toFixed(2)}</div>
      <div>
        <span className={`order-status ${statusClass[order.status]}`}>
          {t(`status${order.status.charAt(0).toUpperCase()}${order.status.slice(1)}` as never)}
        </span>
      </div>
      <div>
        {showActions && next && (
          <button
            className="btn btn-sm btn-gold"
            onClick={(e) => {
              e.stopPropagation();
              onAdvance?.();
            }}
          >
            {t('next')}
          </button>
        )}
      </div>
    </div>
  );
}
