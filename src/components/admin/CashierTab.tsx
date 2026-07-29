import { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import Modal from '@/components/Modal';
import OrderReceipt from '@/components/OrderReceipt';
import { showToast } from '@/components/Toast';
import { isToday } from '@/lib/analytics';
import type { Order, PaymentCurrency } from '@/types';

export default function CashierTab() {
  const t = useStore((s) => s.t);
  const orders = useStore((s) => s.orders);
  const settings = useStore((s) => s.settings);
  const updateOrderPayment = useStore((s) => s.updateOrderPayment);
  const updateOrderStatus = useStore((s) => s.updateOrderStatus);

  const [payOrder, setPayOrder] = useState<Order | null>(null);
  const [currency, setCurrency] = useState<PaymentCurrency>('USD');
  const [cashReceived, setCashReceived] = useState('');
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  const rate = settings?.exchange_rate ?? 4100;

  const activeOrders = useMemo(() => orders.filter((o) => o.status !== 'done'), [orders]);
  const completedOrders = useMemo(() => orders.filter((o) => o.status === 'done' && isToday(o.created_at)), [orders]);

  const openPayment = (order: Order) => {
    setPayOrder(order);
    setCurrency('USD');
    setCashReceived('');
  };

  const totalUsd = payOrder?.total ?? 0;
  const totalKhr = Math.round(totalUsd * rate);
  const cashNum = parseFloat(cashReceived) || 0;

  const change = useMemo(() => {
    if (currency === 'USD') return cashNum - totalUsd;
    return cashNum - totalKhr;
  }, [cashNum, currency, totalUsd, totalKhr]);

  const displayChange = currency === 'USD' ? `$${Math.max(0, change).toFixed(2)}` : `${Math.max(0, Math.round(change)).toLocaleString()} ៛`;

  const handlePay = async (print: boolean) => {
    if (!payOrder) return;
    const payment = {
      payment_currency: currency,
      exchange_rate: rate,
      cash_received: currency === 'USD' ? cashNum : cashNum / rate,
      change: currency === 'USD' ? Math.max(0, change) : Math.max(0, change) / rate,
    };
    await updateOrderPayment(payOrder.id, payment);
    await updateOrderStatus(payOrder.id, 'done');
    showToast(t('orderUpdated'), 'alert');
    const updated = { ...payOrder, ...payment, status: 'done' as const };
    setPayOrder(null);
    if (print) {
      setReceiptOrder(updated);
      setTimeout(() => window.print(), 300);
    }
  };

  const renderOrderCard = (order: Order) => (
    <div key={order.id} style={{ background: 'var(--surface3)', padding: '1.2rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <strong style={{ color: 'var(--cream)' }}>#{order.id}</strong>
        <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{t('table')} {order.table_num}</span>
      </div>
      <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
        {(order.items || []).map((i) => `${i.qty}× ${i.displayName || i.name}`).join(', ')}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: 'var(--gold)', fontSize: '1.2rem', fontWeight: 'bold' }}>${order.total.toFixed(2)}</span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {order.status !== 'done' ? (
            <button className="btn btn-sm btn-gold" onClick={() => openPayment(order)}>{t('payment')}</button>
          ) : (
            <button className="btn btn-sm btn-outline" onClick={() => setReceiptOrder(order)}>{t('viewReceipt')}</button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      <div className="section-title">{t('cashier')}</div>
      <div className="two-col">
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--cream)', marginBottom: '1.5rem', letterSpacing: '1px', textTransform: 'uppercase' }}>
            {t('activeOrders')}
          </div>
          <div style={{ display: 'grid', gap: '1.2rem' }}>
            {activeOrders.length === 0 ? <div style={{ color: 'var(--muted)' }}>{t('noOrders')}</div> : activeOrders.map(renderOrderCard)}
          </div>
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--green)', marginBottom: '1.5rem', letterSpacing: '1px', textTransform: 'uppercase' }}>
            {t('doneOrders')}
          </div>
          <div style={{ display: 'grid', gap: '1.2rem' }}>
            {completedOrders.length === 0 ? <div style={{ color: 'var(--muted)' }}>{t('noOrders')}</div> : completedOrders.map(renderOrderCard)}
          </div>
        </div>
      </div>

      <Modal open={payOrder != null} onClose={() => setPayOrder(null)}>
        <h2 style={{ color: 'var(--gold)', marginBottom: '0.5rem', fontFamily: "'Playfair Display',serif", fontSize: '2rem' }}>{t('payment')}</h2>
        <div style={{ color: 'var(--muted)', marginBottom: '2rem', fontSize: '1.1rem' }}>
          {t('orderNumber')} #{payOrder?.id}
        </div>

        <div style={{ background: 'linear-gradient(145deg, var(--surface3), var(--surface2))', padding: '2rem', borderRadius: '20px', marginBottom: '2rem', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', fontSize: '1.3rem' }}>
            <span style={{ fontWeight: 'bold' }}>{t('total')}:</span>
            <div style={{ textAlign: 'right' }}>
              <strong style={{ color: 'var(--gold)', fontSize: '1.8rem', display: 'block' }}>${totalUsd.toFixed(2)}</strong>
              <span style={{ color: 'var(--muted)', fontSize: '1.1rem', fontWeight: 'bold' }}>{totalKhr.toLocaleString()} ៛</span>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">{t('payment')}</label>
            <select className="form-input" value={currency} onChange={(e) => { setCurrency(e.target.value as PaymentCurrency); setCashReceived(''); }}>
              <option value="USD">USD ($)</option>
              <option value="KHR">Riel (៛)</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{t('cashReceived')}</label>
            <input
              type="number"
              className="form-input"
              value={cashReceived}
              onChange={(e) => setCashReceived(e.target.value)}
              style={{ fontSize: '1.5rem', fontWeight: 'bold', height: '60px' }}
              placeholder={currency === 'USD' ? '$0.00' : '0 ៛'}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', fontSize: '1.2rem', color: 'var(--green)', fontWeight: 'bold' }}>
            <span>{t('change')}:</span>
            <span style={{ fontSize: '1.6rem' }}>{displayChange}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-outline" style={{ padding: '1.2rem', fontSize: '1rem' }} onClick={() => handlePay(true)}>
            {t('printReceipt')}
          </button>
          <button className="btn btn-gold" style={{ flex: 1, padding: '1.2rem', fontSize: '1.1rem' }} onClick={() => handlePay(false)}>
            {t('confirm')}
          </button>
        </div>
      </Modal>

      <Modal open={receiptOrder != null} onClose={() => setReceiptOrder(null)}>
        <h2 style={{ color: 'var(--gold)', marginBottom: '0.5rem', fontFamily: "'Playfair Display',serif", fontSize: '2rem' }}>{t('receipt')}</h2>
        <div style={{ color: 'var(--muted)', marginBottom: '2rem', fontSize: '1.1rem' }}>
          {t('orderNumber')} #{receiptOrder?.id}
        </div>
        {receiptOrder && <OrderReceipt order={receiptOrder} settings={settings} />}
        <button className="btn btn-outline btn-full" style={{ padding: '1.2rem', fontSize: '1.1rem', marginTop: '1.5rem' }} onClick={() => window.print()}>
          {t('printReceipt')}
        </button>
      </Modal>
    </div>
  );
}
