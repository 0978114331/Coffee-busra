import type { Order, Settings } from '@/types';

interface OrderReceiptProps {
  order: Order;
  settings: Settings | null;
}

export default function OrderReceipt({ order, settings }: OrderReceiptProps) {
  const date = new Date(order.created_at);
  const dateStr = date.toLocaleString();
  const khrTotal = order.exchange_rate ? Math.round(order.total * order.exchange_rate) : null;
  const shopName = settings?.shop_name || 'Coffee Busra';
  const logoUrl = settings?.logo_url || '';

  return (
    <div id="print-area" style={{ color: 'black', background: 'white', fontFamily: 'monospace', fontSize: '14px', padding: '1rem', maxWidth: '320px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '0.8rem' }}>
        {logoUrl && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
            <img src={logoUrl} alt="logo" style={{ height: '70px', width: 'auto', objectFit: 'contain' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
        )}
        <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{shopName.toUpperCase()}</h2>
        <p style={{ fontSize: '0.8rem' }}>Receipt #{order.id}</p>
        <p style={{ fontSize: '0.75rem' }}>{dateStr}</p>
        <p style={{ fontSize: '0.8rem' }}>Table: {order.table_num}</p>
      </div>
      <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '0.5rem 0', marginBottom: '0.5rem' }}>
        {order.items.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.8rem' }}>
            <span>{item.qty}× {item.displayName || item.name}</span>
            <span>${(item.price * item.qty).toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '0.3rem' }}>
        <span>Total:</span>
        <span>${order.total.toFixed(2)}</span>
      </div>
      {khrTotal && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
          <span>In KHR:</span>
          <span>{khrTotal.toLocaleString()} ៛</span>
        </div>
      )}
      {order.payment_currency && order.cash_received != null && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
            <span>Cash ({order.payment_currency}):</span>
            <span>{order.payment_currency === 'USD' ? '$' : ''}{order.cash_received.toFixed(2)}{order.payment_currency === 'KHR' ? ' ៛' : ''}</span>
          </div>
          {order.change != null && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
              <span>Change:</span>
              <span>${order.change.toFixed(2)}</span>
            </div>
          )}
        </>
      )}
      {order.note && (
        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', fontStyle: 'italic' }}>
          Note: {order.note}
        </div>
      )}
      <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.8rem' }}>
        Thank you for visiting {shopName}!
      </div>
    </div>
  );
}
