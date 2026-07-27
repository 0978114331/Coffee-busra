import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/store/useStore';
import { showToast } from '@/components/Toast';
import Modal from '@/components/Modal';
import type { MenuItem, Order, OrderStatus } from '@/types';

const DRINK_CATEGORIES = ['Coffee', 'Tea', 'Frappe', 'Smoothie', 'Juice', 'Soda'];
const SUGAR_LEVELS = [0, 25, 50, 75, 100];
const ICE_LEVELS = ['No Ice', 'Less Ice', 'Normal Ice', 'Extra Ice'];
const INITIAL_LOAD = 20;

const STATUS_STEPS: { key: OrderStatus; labelEn: string; labelKm: string }[] = [
  { key: 'pending', labelEn: 'Received', labelKm: 'ទទួលបាន' },
  { key: 'preparing', labelEn: 'Preparing', labelKm: 'កំពុងធ្វើ' },
  { key: 'ready', labelEn: 'Ready', labelKm: 'រួចរាល់' },
  { key: 'done', labelEn: 'Completed', labelKm: 'បានបញ្ចប់' },
];

function StatusTracker({ status, lang }: { status: OrderStatus; lang: 'en' | 'km' }) {
  const currentIdx = STATUS_STEPS.findIndex((s) => s.key === status);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.8rem' }}>
      {STATUS_STEPS.map((step, idx) => {
        const isDone = idx <= currentIdx;
        const isCurrent = idx === currentIdx;
        return (
          <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: idx === STATUS_STEPS.length - 1 ? '0 0 auto' : '1 1 auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 'bold', flexShrink: 0,
                background: isDone ? 'var(--gold)' : 'var(--surface3)',
                color: isDone ? '#000' : 'var(--muted)',
                border: isCurrent ? '2px solid var(--gold2)' : '1px solid var(--border)',
                boxShadow: isCurrent ? '0 0 12px rgba(201,168,76,0.5)' : 'none',
                transition: 'all 0.3s',
              }}>
                {isDone && idx < currentIdx ? '✓' : idx + 1}
              </div>
              <span style={{ fontSize: '0.65rem', color: isDone ? 'var(--gold)' : 'var(--muted)', fontWeight: isCurrent ? 700 : 400, whiteSpace: 'nowrap' }}>
                {lang === 'km' ? step.labelKm : step.labelEn}
              </span>
            </div>
            {idx < STATUS_STEPS.length - 1 && (
              <div style={{
                flex: 1, height: '2px', minWidth: '16px', margin: '0 0.2rem',
                background: idx < currentIdx ? 'var(--gold)' : 'var(--surface3)',
                transition: 'background 0.3s',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function CustomerApp() {
  const t = useStore((s) => s.t);
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  const menuItems = useStore((s) => s.menuItems);
  const promos = useStore((s) => s.promos);
  const cart = useStore((s) => s.cart);
  const selectedTable = useStore((s) => s.selectedTable);
  const setSelectedTable = useStore((s) => s.setSelectedTable);
  const addToCart = useStore((s) => s.addToCart);
  const updateCartQty = useStore((s) => s.updateCartQty);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const clearCart = useStore((s) => s.clearCart);
  const cartCount = useStore((s) => s.cartCount());
  const cartTotal = useStore((s) => s.cartTotal());
  const placeOrder = useStore((s) => s.placeOrder);
  const orders = useStore((s) => s.orders);
  const sessionOrderIds = useStore((s) => s.sessionOrderIds);
  const clearSessionOrders = useStore((s) => s.clearSessionOrders);
  const settings = useStore((s) => s.settings);

  const shopName = settings?.shop_name || 'Coffee Busra';
  const parts = shopName.split(' ');
  const brandFirst = parts[0] || 'Coffee';
  const brandRest = parts.slice(1).join(' ');

  const [activeCat, setActiveCat] = useState('All');
  const [visibleCount, setVisibleCount] = useState(INITIAL_LOAD);
  const [cartOpen, setCartOpen] = useState(false);
  const [myOrdersOpen, setMyOrdersOpen] = useState(false);
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [manualTable, setManualTable] = useState('');
  const [drinkModalItem, setDrinkModalItem] = useState<MenuItem | null>(null);
  const [selectedSugar, setSelectedSugar] = useState(100);
  const [selectedIce, setSelectedIce] = useState('Normal Ice');
  const [drinkNote, setDrinkNote] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [placing, setPlacing] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'locating' | 'success' | 'failed'>('idle');
  const [confirmOrder, setConfirmOrder] = useState<Order | null>(null);
  const [celebrated, setCelebrated] = useState<Set<number>>(new Set());

  const categories = useMemo(() => {
    const cats = Array.from(new Set(menuItems.map((m) => m.cat)));
    return ['All', ...cats];
  }, [menuItems]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tableParam = params.get('table');
    if (tableParam) {
      setSelectedTable(parseInt(tableParam, 10));
    } else if (selectedTable == null && menuItems.length > 0) {
      setSelectedTable(1);
    }
  }, [menuItems.length]);

  const filteredItems = activeCat === 'All' ? menuItems : menuItems.filter((m) => m.cat === activeCat);
  const visibleItems = filteredItems.slice(0, visibleCount);

  const isDrink = (item: MenuItem) => DRINK_CATEGORIES.some((c) => item.cat.toLowerCase().includes(c.toLowerCase()));

  const handleAddClick = (item: MenuItem) => {
    if (!item.available) return;
    if (isDrink(item)) {
      setSelectedSugar(100);
      setSelectedIce('Normal Ice');
      setDrinkNote('');
      setDrinkModalItem(item);
    } else {
      addToCart(item);
      showToast(`${item.name} ${t('addToCart').toLowerCase()}`, 'alert');
    }
  };

  const confirmDrinkAdd = () => {
    if (!drinkModalItem) return;
    addToCart(drinkModalItem, { sugar: selectedSugar, ice: selectedIce, note: drinkNote || undefined });
    showToast(`${drinkModalItem.name} ${t('addToCart').toLowerCase()}`, 'alert');
    setDrinkModalItem(null);
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    if (selectedTable == null) {
      setTableModalOpen(true);
      return;
    }
    setPlacing(true);
    setLocationStatus('locating');

    let lat: number | null = null;
    let lng: number | null = null;

    if (navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000, enableHighAccuracy: true });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
        setLocationStatus('success');
      } catch {
        setLocationStatus('failed');
        // proceed without location
      }
    } else {
      setLocationStatus('failed');
    }

    const result = await placeOrder(orderNote, lat, lng);
    setPlacing(false);

    if (result.success && result.order) {
      showToast(t('orderPlaced'), 'alert');
      setCartOpen(false);
      setOrderNote('');
      setConfirmOrder(result.order);
      setLocationStatus('idle');
    } else {
      showToast(result.error ?? t('orderFailed'), 'error');
      setLocationStatus('idle');
    }
  };

  const saveManualTable = () => {
    const num = parseInt(manualTable, 10);
    if (num >= 1) {
      setSelectedTable(num);
      setTableModalOpen(false);
      setManualTable('');
    }
  };

  const myOrders = orders.filter((o) => sessionOrderIds.includes(o.id));

  useEffect(() => {
    for (const order of myOrders) {
      if (order.status === 'ready' && !celebrated.has(order.id)) {
        showToast(t('orderReady'), 'alert');
        setCelebrated(new Set([...celebrated, order.id]));
      }
    }
  }, [myOrders, celebrated, t]);

  const promoImages = promos?.active ? promos.images : [];

  const locationStatusText = (() => {
    if (locationStatus === 'locating') return t('locating');
    if (locationStatus === 'success') return lang === 'km' ? 'ទីតាំងបាន' : 'Location obtained';
    if (locationStatus === 'failed') return lang === 'km' ? 'ទីតាំងមិនបាន' : 'Location skipped';
    return '';
  })();

  const isQrScan = useMemo(() => new URLSearchParams(window.location.search).has('table'), []);

  return (
    <div className="customer-view">
      <button className="lang-btn" style={{ position: 'fixed', top: '15px', right: '15px', zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', border: '1px solid var(--border)' }} onClick={() => setLang(lang === 'en' ? 'km' : 'en')}>
        🌐 {lang === 'en' ? 'EN' : 'KM'}
      </button>
      {!isQrScan && (
        <button className="btn btn-outline btn-sm" style={{ position: 'fixed', top: '15px', left: '15px', zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', border: '1px solid var(--border)' }} onClick={() => { window.location.href = '/admin'; }}>
          ← Admin
        </button>
      )}

      <div className="customer-hero fade-in">
        <div className="customer-table-badge" onClick={() => setTableModalOpen(true)}>
          <span>{t('table')} {selectedTable ?? '?'}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
        </div>
        {settings?.logo_url && (
          <img
            src={settings.logo_url}
            alt={shopName}
            style={{ height: '90px', width: 'auto', objectFit: 'contain', marginBottom: '0.8rem', borderRadius: '12px', background: 'rgba(255,255,255,0.95)', padding: '6px', boxShadow: '0 8px 30px rgba(0,0,0,0.4)' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
        <div className="logo" style={{ fontSize: '3.5rem', justifyContent: 'center', textShadow: '0 4px 20px rgba(201,168,76,0.5)' }}>
          {brandFirst.toUpperCase()}<span>{brandRest.toUpperCase()}</span>
        </div>
        <div style={{ color: 'var(--gold2)', fontSize: '1.1rem', marginTop: '0.8rem', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' }}>
          {t('tagline')}
        </div>
      </div>

      {promoImages.length > 0 && <PromoCarousel images={promoImages} />}

      <div className="cat-tabs fade-in" style={{ animationDelay: '0.2s' }}>
        {categories.map((cat) => (
          <button key={cat} className={`cat-tab ${activeCat === cat ? 'active' : ''}`} onClick={() => { setActiveCat(cat); setVisibleCount(INITIAL_LOAD); }}>
            {cat === 'All' ? t('all') : cat}
          </button>
        ))}
      </div>

      <div className="customer-menu fade-in" style={{ animationDelay: '0.3s' }}>
        <div className="c-menu-grid">
          {visibleItems.map((item) => (
            <div key={item.id} className={`c-menu-card ${!item.available ? 'unavailable' : ''}`} onClick={() => handleAddClick(item)}>
              <div className="c-img-wrapper">
                {item.image && <img src={item.image} alt={item.name} className="c-item-img" />}
                <div className="c-img-overlay" />
                {!item.available && <div className="c-item-badge">{t('soldOut')}</div>}
              </div>
              <div className="c-item-body">
                <div className="c-item-cat">{item.cat}</div>
                <div className="c-item-name">{item.name}</div>
                <div className="c-item-rating">
                  <span className="stars">★★★★★</span>
                  <span className="rating-text">4.9 (120+)</span>
                </div>
                {item.description && <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>{item.description}</div>}
                <div className="c-item-footer">
                  <div className="c-item-price">${item.price.toFixed(2)}</div>
                  <button className="add-btn" onClick={(e) => { e.stopPropagation(); handleAddClick(item); }}>+</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {filteredItems.length > visibleCount && (
          <div style={{ textAlign: 'center', marginTop: '3.5rem' }}>
            <button className="btn btn-outline" style={{ padding: '1rem 3rem', fontSize: '1.1rem', borderRadius: '30px', fontWeight: 800, letterSpacing: '1px' }} onClick={() => setVisibleCount(visibleCount + INITIAL_LOAD)}>
              {t('seeMore')} ↓
            </button>
          </div>
        )}
      </div>

      <div className="cart-float fade-in" style={{ animationDelay: '0.4s' }}>
        {sessionOrderIds.length > 0 && (
          <button className="my-orders-btn" onClick={() => setMyOrdersOpen(true)}>
            📋 {t('myOrders')}
          </button>
        )}
        {cart.length > 0 && (
          <button className="cart-btn" onClick={() => setCartOpen(true)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
            {t('cart')}
            <div className="cart-count">{cartCount}</div>
          </button>
        )}
      </div>

      {cartOpen && (
        <>
          <div className="overlay-backdrop" onClick={() => setCartOpen(false)} />
          <div className="sidebar open">
            <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', background: 'linear-gradient(180deg, var(--surface3), var(--surface2))' }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.5rem', fontWeight: 700, color: 'var(--cream)' }}>{t('yourOrder')}</div>
              <button className="btn-close" style={{ position: 'static' }} onClick={() => setCartOpen(false)}>&times;</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>{t('cartEmpty')}</div>
              ) : (
                cart.map((item) => (
                  <div key={item.cartId} style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', padding: '0.8rem 0', borderBottom: '1px solid rgba(201,168,76,0.08)' }}>
                    {item.image && (
                      <img src={item.image} alt={item.name} style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ color: 'var(--cream)', fontWeight: 600, fontSize: '0.9rem' }}>{item.displayName}</div>
                      <div style={{ color: 'var(--gold)', fontSize: '0.85rem' }}>${item.price.toFixed(2)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button className="btn btn-sm btn-outline" onClick={() => updateCartQty(item.cartId, item.qty - 1)}>−</button>
                      <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 'bold' }}>{item.qty}</span>
                      <button className="btn btn-sm btn-outline" onClick={() => updateCartQty(item.cartId, item.qty + 1)}>+</button>
                      <button className="btn btn-sm btn-danger" onClick={() => removeFromCart(item.cartId)}>×</button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div style={{ padding: '2rem 1.5rem', borderTop: '1px solid var(--border)', background: 'linear-gradient(0deg, var(--surface3), var(--surface2))' }}>
              {locationStatus !== 'idle' && locationStatus !== 'locating' && (
                <div style={{ marginBottom: '1rem', fontSize: '0.8rem', color: locationStatus === 'success' ? 'var(--green)' : 'var(--muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  📍 {locationStatusText}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.3rem', fontWeight: 800 }}>
                <span>{t('total')}</span>
                <span style={{ color: 'var(--gold)' }}>${cartTotal.toFixed(2)}</span>
              </div>
              <textarea className="form-input" style={{ marginBottom: '1.5rem', resize: 'none', height: '80px' }} placeholder={t('specialNote')} value={orderNote} onChange={(e) => setOrderNote(e.target.value)} />
              <button className="btn btn-gold btn-full" disabled={placing} onClick={handlePlaceOrder} style={{ padding: '1.2rem', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {placing ? (locationStatus === 'locating' ? t('locating') : t('submitting')) : t('placeOrder')}
              </button>
              <button className="btn btn-outline btn-full" style={{ marginTop: '0.8rem' }} onClick={clearCart}>{t('cancel')}</button>
            </div>
          </div>
        </>
      )}

      {myOrdersOpen && (
        <>
          <div className="overlay-backdrop" onClick={() => setMyOrdersOpen(false)} />
          <div className="sidebar open">
            <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(180deg, var(--surface3), var(--surface2))' }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.5rem', fontWeight: 700, color: 'var(--cream)' }}>{t('myOrders')}</div>
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                {myOrders.length > 0 && (
                  <button className="btn btn-danger btn-sm" onClick={() => { if (confirm(t('confirmDelete'))) clearSessionOrders(); }}>
                    {t('clear')}
                  </button>
                )}
                <button className="btn-close" style={{ position: 'static' }} onClick={() => setMyOrdersOpen(false)}>&times;</button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              {myOrders.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>{t('noOrders')}</div>
              ) : (
                myOrders.map((order) => (
                  <div key={order.id} style={{ background: 'var(--surface3)', padding: '1.2rem', borderRadius: '16px', marginBottom: '1rem', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <strong style={{ color: 'var(--cream)' }}>#{order.id}</strong>
                      <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>
                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                      {order.items.map((i) => `${i.qty}× ${i.displayName || i.name}`).join(', ')}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--gold)', fontWeight: 'bold' }}>${order.total.toFixed(2)}</span>
                      <span className={`order-status status-${order.status}`}>
                        {t(`status${order.status.charAt(0).toUpperCase()}${order.status.slice(1)}` as never)}
                      </span>
                    </div>
                    <StatusTracker status={order.status} lang={lang} />
                    {order.lat != null && order.lng != null && (
                      <a href={`https://www.google.com/maps?q=${order.lat},${order.lng}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: 'var(--blue)', textDecoration: 'underline', marginTop: '0.6rem', display: 'inline-block' }}>
                        📍 {t('viewOnMap')}
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Order Confirmation Receipt Modal */}
      <Modal open={confirmOrder != null} onClose={() => setConfirmOrder(null)} maxWidth={460}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--green)', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', boxShadow: '0 0 20px rgba(46,204,113,0.4)' }}>
            ✓
          </div>
          <h2 style={{ color: 'var(--gold)', marginBottom: '0.5rem', fontFamily: "'Playfair Display',serif", fontSize: '1.8rem' }}>
            {t('orderPlacedSuccess')}
          </h2>
          <p style={{ color: 'var(--muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            {t('orderPlacedMsg', { id: confirmOrder?.id ?? '' })}
          </p>
        </div>

        {confirmOrder && (
          <div style={{ background: 'var(--surface3)', borderRadius: '16px', padding: '1.2rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--muted)' }}>{t('orderNumber')}</span>
              <strong style={{ color: 'var(--cream)' }}>#{confirmOrder.id}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--muted)' }}>{t('table')}</span>
              <strong style={{ color: 'var(--cream)' }}>{confirmOrder.table_num}</strong>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.8rem', marginBottom: '0.5rem' }}>
              {confirmOrder.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', padding: '0.5rem 0' }}>
                  {item.image && (
                    <img src={item.image} alt={item.name} style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'var(--cream)', fontSize: '0.85rem', fontWeight: 600 }}>{item.qty}× {item.displayName || item.name}</div>
                    <div style={{ color: 'var(--gold)', fontSize: '0.8rem' }}>${(item.price * item.qty).toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '0.8rem', fontWeight: 'bold' }}>
              <span style={{ color: 'var(--cream)' }}>{t('total')}</span>
              <span style={{ color: 'var(--gold)', fontSize: '1.2rem' }}>${confirmOrder.total.toFixed(2)}</span>
            </div>
            {confirmOrder.lat != null && confirmOrder.lng != null && (
              <div style={{ marginTop: '0.8rem', fontSize: '0.75rem', color: 'var(--green)' }}>
                📍 {t('locationShared')}
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.8rem' }}>
          <button className="btn btn-outline" style={{ flex: 1, padding: '1rem' }} onClick={() => { setConfirmOrder(null); setMyOrdersOpen(true); }}>
            {t('viewMyOrders')}
          </button>
          <button className="btn btn-gold" style={{ flex: 1, padding: '1rem' }} onClick={() => setConfirmOrder(null)}>
            {t('orderAnother')}
          </button>
        </div>
      </Modal>

      <Modal open={tableModalOpen} onClose={() => setTableModalOpen(false)} maxWidth={400}>
        <h2 style={{ color: 'var(--gold)', marginBottom: '0.8rem', fontFamily: "'Playfair Display',serif", fontSize: '2rem', textAlign: 'center' }}>{t('selectTable')}</h2>
        <p style={{ color: 'var(--muted)', fontSize: '1rem', marginBottom: '2rem', textAlign: 'center' }}>{t('tableNum')}</p>
        <input type="number" className="form-input" value={manualTable} onChange={(e) => setManualTable(e.target.value)} style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 'bold', height: '80px', letterSpacing: '2px' }} placeholder="0" min={1} />
        <button className="btn btn-gold btn-full" style={{ marginTop: '2rem', padding: '1.2rem', fontSize: '1.1rem' }} onClick={saveManualTable}>{t('confirm')}</button>
      </Modal>

      <Modal open={drinkModalItem != null} onClose={() => setDrinkModalItem(null)}>
        <h2 style={{ color: 'var(--cream)', fontFamily: "'Playfair Display',serif", fontSize: '1.8rem', marginBottom: '2rem' }}>{drinkModalItem?.name}</h2>

        <div style={{ marginBottom: '1.5rem' }}>
          <label className="form-label" style={{ fontSize: '1rem', marginBottom: '1rem' }}>{t('sugarLevel')}</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
            {SUGAR_LEVELS.map((s) => (
              <button key={s} className={`btn ${selectedSugar === s ? 'btn-gold' : 'btn-outline'}`} style={{ padding: '0.8rem 0', fontSize: '0.9rem' }} onClick={() => setSelectedSugar(s)}>{s}%</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label className="form-label" style={{ fontSize: '1rem', marginBottom: '1rem' }}>{t('iceLevel')}</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            {ICE_LEVELS.map((ice) => (
              <button key={ice} className={`btn ${selectedIce === ice ? 'btn-gold' : 'btn-outline'}`} style={{ padding: '0.8rem', fontSize: '0.85rem' }} onClick={() => setSelectedIce(ice)}>{ice}</button>
            ))}
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '2.5rem' }}>
          <label className="form-label">{t('specialNote')}</label>
          <input type="text" className="form-input" value={drinkNote} onChange={(e) => setDrinkNote(e.target.value)} placeholder={t('notePlaceholder')} />
        </div>

        <button className="btn btn-gold btn-full" onClick={confirmDrinkAdd} style={{ padding: '1.2rem', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {t('addToCart')}
        </button>
      </Modal>
    </div>
  );
}

function PromoCarousel({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((c) => (c + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [images.length]);

  if (images.length === 0) return null;

  return (
    <div className="customer-promo fade-in">
      <div className="carousel-container">
        {images.map((img, idx) => (
          <img key={idx} src={img} alt="promo" className={`carousel-slide ${idx === current ? 'active' : ''}`} />
        ))}
        <button className="carousel-btn carousel-prev" onClick={() => setCurrent((c) => (c - 1 + images.length) % images.length)}>&#10094;</button>
        <button className="carousel-btn carousel-next" onClick={() => setCurrent((c) => (c + 1) % images.length)}>&#10095;</button>
        <div className="carousel-dots">
          {images.map((_, idx) => (
            <div key={idx} className={`dot ${idx === current ? 'active' : ''}`} onClick={() => setCurrent(idx)} />
          ))}
        </div>
      </div>
    </div>
  );
}
