import { useStore } from '@/store/useStore';
import { showToast } from '@/components/Toast';
import type { Order } from '@/types';

export default function KitchenTab() {
  const t = useStore((s) => s.t);
  const orders = useStore((s) => s.orders);
  const updateOrderStatus = useStore((s) => s.updateOrderStatus);

  const activeOrders = orders.filter((o) => o.status === 'pending' || o.status === 'preparing');

  const handleStartPrep = async (order: Order) => {
    await updateOrderStatus(order.id, 'preparing');
    showToast(t('orderUpdated'), 'alert');
  };

  const handleMarkReady = async (order: Order) => {
    await updateOrderStatus(order.id, 'ready');
    showToast(t('orderUpdated'), 'alert');
  };

  return (
    <div className="fade-in">
      <div className="section-title">{t('kitchen')}</div>
      {activeOrders.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '3rem' }}>{t('noOrders')}</div>
      ) : (
        <div className="kitchen-grid">
          {activeOrders.map((order) => (
            <div key={order.id} className="kitchen-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.4rem', color: 'var(--cream)' }}>
                    #{order.id}
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                    {t('table')} {order.table_num}
                  </div>
                </div>
                <span className={`order-status status-${order.status}`}>
                  {t(`status${order.status.charAt(0).toUpperCase()}${order.status.slice(1)}` as never)}
                </span>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                {(order.items || []).map((item, i) => (
                  <div key={i} style={{ padding: '0.6rem 0', borderBottom: '1px solid rgba(201,168,76,0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--cream)', fontWeight: '600' }}>
                        {item.qty}× {item.displayName || item.name}
                      </span>
                      <span style={{ color: 'var(--gold)' }}>${item.price.toFixed(2)}</span>
                    </div>
                    {(item.sugar != null || item.ice || item.note) && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
                        {item.sugar != null && <span>Sugar: {item.sugar}% </span>}
                        {item.ice && <span>Ice: {item.ice} </span>}
                        {item.note && <span>· {item.note}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {order.note && (
                <div style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: '8px', padding: '0.6rem', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--red)' }}>
                  <strong>{t('specialNote')}:</strong> {order.note}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {order.status === 'pending' && (
                  <button className="btn btn-gold btn-full" onClick={() => handleStartPrep(order)}>
                    {t('startPrep')}
                  </button>
                )}
                {order.status === 'preparing' && (
                  <button className="btn btn-success btn-full" onClick={() => handleMarkReady(order)}>
                    {t('markReady')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
