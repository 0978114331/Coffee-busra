import { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { groupOrdersByDate } from '@/lib/analytics';
import type { Order, OrderStatus } from '@/types';
import { showToast } from '@/components/Toast';
import Modal from '@/components/Modal';

const nextStatus: Record<OrderStatus, OrderStatus | null> = {
  pending: 'preparing',
  preparing: 'ready',
  ready: 'done',
  done: null,
};

const nextLabel: Record<OrderStatus, string> = {
  pending: 'Start Prep',
  preparing: 'Mark Ready',
  ready: 'Mark Done',
  done: '',
};

const statusClass: Record<OrderStatus, string> = {
  pending: 'status-pending',
  preparing: 'status-preparing',
  ready: 'status-ready',
  done: 'status-done',
};

export default function OrdersTab() {
  const t = useStore((s) => s.t);
  const orders = useStore((s) => s.orders);
  const updateOrderStatus = useStore((s) => s.updateOrderStatus);
  const deleteOrder = useStore((s) => s.deleteOrder);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(['Today']));
  const [dateFilter, setDateFilter] = useState('');
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);

  const filteredOrders = useMemo(() => {
    if (!dateFilter) return orders;
    return orders.filter((o) => new Date(o.created_at).toISOString().slice(0, 10) === dateFilter);
  }, [orders, dateFilter]);

  const groups = groupOrdersByDate(filteredOrders);

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const handleAdvance = async (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = nextStatus[order.status];
    if (!next) return;
    await updateOrderStatus(order.id, next);
    showToast(t('orderUpdated'), 'alert');
  };

  const handleDelete = async (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(t('confirmDelete'))) return;
    await deleteOrder(order.id);
    showToast(t('orderDeleted'), 'alert');
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="section-title" style={{ margin: 0 }}>{t('orders')}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{t('filterByDate')}</label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="form-input"
            style={{ width: 'auto', padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
          />
          {dateFilter && (
            <button className="btn btn-sm btn-outline" onClick={() => setDateFilter('')}>{t('clear')}</button>
          )}
        </div>
      </div>

      {groups.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '3rem' }}>{t('noOrders')}</div>
      ) : (
        groups.map((group) => {
          const isOpen = openGroups.has(group.label);
          return (
            <div key={group.label} style={{ marginBottom: '1rem', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface2)' }}>
              <div
                onClick={() => toggleGroup(group.label)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', cursor: 'pointer', background: 'var(--surface3)', borderBottom: isOpen ? '1px solid var(--border)' : 'none', transition: 'background 0.2s' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <span style={{ color: 'var(--gold)', fontWeight: 800, fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {group.label.toUpperCase()}
                  </span>
                  <span style={{ background: 'var(--surface2)', color: 'var(--cream)', fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '20px', border: '1px solid var(--border)' }}>
                    {group.orders.length} {t('orders')}
                  </span>
                </div>
                <span style={{ color: 'var(--gold)', fontSize: '1.2rem', userSelect: 'none' }}>{isOpen ? '▲' : '▼'}</span>
              </div>

              {isOpen && (
                <div style={{ maxHeight: '420px', overflowY: 'auto', overflowX: 'auto' }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '80px 90px 1fr 100px 120px 140px',
                    padding: '0.8rem 1.5rem',
                    background: 'rgba(201,168,76,0.05)',
                    fontSize: '0.72rem',
                    textTransform: 'uppercase',
                    color: 'var(--gold)',
                    fontWeight: 700,
                    letterSpacing: '1px',
                    minWidth: '680px',
                    borderBottom: '1px solid rgba(201,168,76,0.08)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                  }}>
                    <div>ID</div>
                    <div>{t('table')}</div>
                    <div>{t('items')}</div>
                    <div>{t('total')}</div>
                    <div>{t('status')}</div>
                    <div>{t('actions')}</div>
                  </div>

                  {group.orders.map((order) => {
                    const itemsText = (order.items || [])
                      .map((i) => `${i.qty}x ${i.displayName || i.name}`)
                      .join(', ');
                    const next = nextStatus[order.status];

                    return (
                      <div
                        key={order.id}
                        onClick={() => setPreviewOrder(order)}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '80px 90px 1fr 100px 120px 140px',
                          padding: '1rem 1.5rem',
                          alignItems: 'center',
                          borderBottom: '1px solid rgba(201,168,76,0.06)',
                          fontSize: '0.9rem',
                          minWidth: '680px',
                          transition: 'background 0.15s',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(201,168,76,0.04)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = ''; }}
                      >
                        <div style={{ color: 'var(--gold)', fontWeight: 700 }}>#{order.id}</div>
                        <div style={{ color: 'var(--cream)', fontWeight: 600 }}>T-{order.table_num}</div>
                        <div style={{ color: 'var(--muted)', fontSize: '0.82rem', paddingRight: '1rem', lineHeight: 1.4 }}>{itemsText}</div>
                        <div style={{ color: 'var(--gold)', fontWeight: 700 }}>${order.total.toFixed(2)}</div>
                        <div>
                          <span className={`order-status ${statusClass[order.status]}`}>
                            {order.status.toUpperCase()}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          {next && (
                            <button
                              className="btn btn-sm btn-gold"
                              onClick={(e) => handleAdvance(order, e)}
                              style={{ fontSize: '0.75rem', padding: '0.35rem 0.8rem' }}
                            >
                              {nextLabel[order.status]}
                            </button>
                          )}
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={(e) => handleDelete(order, e)}
                            style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem', minWidth: '30px' }}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}

      <Modal open={previewOrder != null} onClose={() => setPreviewOrder(null)} maxWidth={680}>
        {previewOrder && (
          <>
            <h2 style={{ color: 'var(--gold)', marginBottom: '0.5rem', fontFamily: "'Playfair Display',serif", fontSize: '1.8rem' }}>
              {t('orderDetails')} #{previewOrder.id}
            </h2>
            <div style={{ color: 'var(--muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              {new Date(previewOrder.created_at).toLocaleString()} · T-{previewOrder.table_num}
            </div>

            {previewOrder.lat != null && previewOrder.lng != null && (
              <div style={{ marginBottom: '1rem' }}>
                <a href={`https://maps.google.com/?q=${previewOrder.lat},${previewOrder.lng}`} target="_blank" rel="noreferrer" style={{ color: 'var(--blue)', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem' }}>
                  📍 View Customer Location
                </a>
              </div>
            )}

            {previewOrder.note && (
              <div style={{ background: 'rgba(231,76,60,0.1)', borderLeft: '4px solid var(--red)', padding: '0.8rem', borderRadius: '8px', marginBottom: '1.5rem', color: 'var(--cream)', fontSize: '0.9rem' }}>
                <strong>Note:</strong> {previewOrder.note}
              </div>
            )}

            <h3 style={{ color: 'var(--gold)', marginBottom: '1rem', fontSize: '1.1rem', fontFamily: "'Playfair Display',serif" }}>
              {t('orderedProducts')}
            </h3>
            <div style={{ display: 'grid', gap: '0.8rem', maxHeight: '40vh', overflowY: 'auto', paddingRight: '6px' }}>
              {(previewOrder.items || []).map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'var(--surface2)', padding: '0.8rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {item.image && (
                    <img src={item.image} alt={item.name} style={{ width: '60px', height: '60px', borderRadius: '10px', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--gold)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '1px' }}>{item.cat}</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--cream)' }}>{item.displayName || item.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>${item.price.toFixed(2)} × {item.qty}</div>
                  </div>
                  <div style={{ textAlign: 'right', color: 'var(--gold)', fontWeight: 800, fontSize: '1.1rem' }}>
                    ${(item.price * item.qty).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: '1.3rem', fontWeight: 800 }}>
              <span>{t('total')}</span>
              <span style={{ color: 'var(--gold)' }}>${previewOrder.total.toFixed(2)}</span>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}