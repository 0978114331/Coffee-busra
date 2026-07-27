import { useState } from 'react';
import { useStore } from '@/store/useStore';
import Modal from '@/components/Modal';
import QrCode from '@/components/QrCode';
import { showToast } from '@/components/Toast';

export default function TablesTab() {
  const t = useStore((s) => s.t);
  const tables = useStore((s) => s.tables);
  const orders = useStore((s) => s.orders);
  const addTable = useStore((s) => s.addTable);
  const deleteTable = useStore((s) => s.deleteTable);
  const [newNum, setNewNum] = useState('');
  const [qrTable, setQrTable] = useState<number | null>(null);
  const [viewTable, setViewTable] = useState<number | null>(null);

  const baseUrl = window.location.origin;

  const handleAdd = async () => {
    const num = parseInt(newNum, 10);
    if (!num || num < 1) return;
    if (tables.some((tbl) => tbl.num === num)) {
      showToast('Table number already exists', 'error');
      return;
    }
    await addTable(num);
    setNewNum('');
    showToast(t('tableAdded'), 'alert');
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(t('confirmDelete'))) return;
    await deleteTable(id);
    showToast(t('tableDeleted'), 'alert');
  };

  const tableOrders = viewTable != null ? orders.filter((o) => o.table_num === viewTable && o.status !== 'done') : [];
  const tableTotal = tableOrders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div className="section-title" style={{ margin: 0 }}>{t('tables')}</div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input
            type="number"
            className="form-input"
            style={{ width: '140px' }}
            placeholder="Table No."
            min={1}
            value={newNum}
            onChange={(e) => setNewNum(e.target.value)}
          />
          <button className="btn btn-gold" onClick={handleAdd}>{t('addTable')}</button>
        </div>
      </div>

      <div className="tables-grid">
        {tables.map((tbl) => {
          const activeCount = orders.filter((o) => o.table_num === tbl.num && o.status !== 'done').length;
          return (
          <div
            key={tbl.id}
            className={`table-card ${tbl.status === 'occupied' ? 'occupied' : ''}`}
            onClick={() => setViewTable(tbl.num)}
          >
            {tbl.status === 'occupied' && <span className="table-pulse-dot" />}
            {activeCount > 0 && <span className="table-count-badge">{activeCount}</span>}
            <div className="table-num">{tbl.num}</div>
            <div className={`table-status ${tbl.status === 'occupied' ? 'busy' : 'free'}`}>
              {tbl.status === 'occupied' ? t('activeOrders') : t('available')}
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <button className="btn btn-sm btn-outline" onClick={(e) => { e.stopPropagation(); setQrTable(tbl.num); }}>
                {t('qrCode')}
              </button>
              <button className="btn btn-sm btn-danger" onClick={(e) => handleDelete(tbl.id, e)}>
                {t('delete')}
              </button>
            </div>
          </div>
          );
        })}
      </div>

      <Modal open={qrTable != null} onClose={() => setQrTable(null)} maxWidth={420}>
        <div className="print-qr">
          <h2 style={{ color: 'var(--gold)', marginBottom: '1rem', fontFamily: "'Playfair Display',serif", fontSize: '2rem', textAlign: 'center' }}>
            COFFEE<span>BUSRA</span> — {t('table')} {qrTable}
          </h2>
          <div style={{ textAlign: 'center' }}>
            <QrCode value={`${baseUrl}/?table=${qrTable}`} size={220} fileName={`table-${qrTable}`} />
            <div style={{ marginTop: '1rem', color: 'var(--muted)', fontSize: '0.85rem', wordBreak: 'break-all' }}>
              {baseUrl}/?table={qrTable}
            </div>
            <div className="no-print" style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', marginTop: '1.5rem' }}>
              <button
                className="btn btn-outline"
                style={{ padding: '0.8rem 2rem' }}
                onClick={() => window.print()}
              >
                {t('print')}
              </button>
              <button
                className="btn btn-gold"
                style={{ padding: '0.8rem 2rem' }}
                onClick={() => setQrTable(null)}
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal open={viewTable != null} onClose={() => setViewTable(null)} maxWidth={600}>
        <h2 style={{ color: 'var(--gold)', marginBottom: '1.5rem', fontFamily: "'Playfair Display',serif", fontSize: '2rem' }}>
          {t('table')} {viewTable}
        </h2>
        <div style={{ maxHeight: '55vh', overflowY: 'auto', paddingRight: '10px' }}>
          {tableOrders.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>{t('noOrders')}</div>
          ) : (
            tableOrders.map((o) => (
              <div key={o.id} style={{ background: 'var(--surface3)', padding: '1rem', borderRadius: '12px', marginBottom: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong>#{o.id}</strong>
                  <span className={`order-status status-${o.status}`}>{t(`status${o.status.charAt(0).toUpperCase()}${o.status.slice(1)}` as never)}</span>
                </div>
                {o.note && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--red)', marginBottom: '0.5rem', fontStyle: 'italic' }}>📝 {o.note}</div>
                )}
                {o.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.4rem' }}>
                    {item.image && (
                      <img src={item.image} alt={item.name} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    )}
                    <div style={{ fontSize: '0.85rem', color: 'var(--cream)' }}>
                      {item.qty}× {item.displayName || item.name}
                    </div>
                  </div>
                ))}
                {o.lat != null && o.lng != null && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <a href={`https://maps.google.com/?q=${o.lat},${o.lng}`} target="_blank" rel="noreferrer" style={{ color: 'var(--blue)', fontSize: '0.8rem', textDecoration: 'none' }}>📍 View Customer Location</a>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: '1.4rem', fontWeight: 'bold' }}>
          <span>{t('total')}:</span>
          <span style={{ color: 'var(--gold)', fontSize: '1.8rem' }}>${tableTotal.toFixed(2)}</span>
        </div>
      </Modal>
    </div>
  );
}
