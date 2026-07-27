import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { showToast } from '@/components/Toast';
import type { Settings as SettingsType, Promos } from '@/types';

export default function SettingsTab() {
  const t = useStore((s) => s.t);
  const settings = useStore((s) => s.settings);
  const promos = useStore((s) => s.promos);
  const updateSettings = useStore((s) => s.updateSettings);
  const updatePromos = useStore((s) => s.updatePromos);
  const resetOrders = useStore((s) => s.resetOrders);
  const resetAll = useStore((s) => s.resetAll);

  const [adminPin, setAdminPin] = useState('');
  const [customerPin, setCustomerPin] = useState('');
  const [exchangeRate, setExchangeRate] = useState('');
  const [tgToken, setTgToken] = useState('');
  const [tgChatId, setTgChatId] = useState('');
  const [shopName, setShopName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [promoActive, setPromoActive] = useState(true);
  const [promoImages, setPromoImages] = useState<string[]>([]);
  const [newPromoUrl, setNewPromoUrl] = useState('');

  useEffect(() => {
    if (settings) {
      setAdminPin(settings.admin_pin);
      setCustomerPin(settings.customer_pin);
      setExchangeRate(String(settings.exchange_rate));
      setTgToken(settings.tg_token);
      setTgChatId(settings.tg_chat_id);
      setShopName(settings.shop_name);
      setLogoUrl(settings.logo_url);
    }
  }, [settings]);

  useEffect(() => {
    if (promos) {
      setPromoActive(promos.active);
      setPromoImages(promos.images);
    }
  }, [promos]);

  const saveBranding = async () => {
    await updateSettings({ shop_name: shopName, logo_url: logoUrl });
    showToast(t('saved'), 'alert');
  };

  const saveSecurity = async () => {
    await updateSettings({ admin_pin: adminPin, customer_pin: customerPin });
    showToast(t('pinUpdated'), 'alert');
  };

  const saveCurrency = async () => {
    const rate = parseInt(exchangeRate, 10);
    if (isNaN(rate) || rate <= 0) {
      showToast(t('invalidPrice'), 'error');
      return;
    }
    await updateSettings({ exchange_rate: rate });
    showToast(t('saved'), 'alert');
  };

  const saveTelegram = async () => {
    await updateSettings({ tg_token: tgToken, tg_chat_id: tgChatId });
    showToast(t('saved'), 'alert');
  };

  const testTelegram = async () => {
    if (!tgToken || !tgChatId) {
      showToast('Enter token and chat ID first', 'error');
      return;
    }
    try {
      const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/telegram-notify`;
      const res = await fetch(fnUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ test: true, tgToken, tgChatId }),
      });
      if (res.ok) showToast('Telegram test sent!', 'alert');
      else showToast('Telegram test failed', 'error');
    } catch {
      showToast('Telegram test failed', 'error');
    }
  };

  const addPromoImage = () => {
    if (!newPromoUrl) return;
    try {
      new URL(newPromoUrl);
    } catch {
      showToast(t('invalidUrl'), 'error');
      return;
    }
    setPromoImages([...promoImages, newPromoUrl]);
    setNewPromoUrl('');
  };

  const removePromoImage = (idx: number) => {
    setPromoImages(promoImages.filter((_, i) => i !== idx));
  };

  const savePromo = async () => {
    await updatePromos({ active: promoActive, images: promoImages });
    showToast(t('promoUpdated'), 'alert');
  };

  const handleResetOrders = async () => {
    if (!confirm(t('confirmReset'))) return;
    await resetOrders();
    showToast(t('dataReset'), 'alert');
  };

  const handleResetAll = async () => {
    if (!confirm(t('confirmReset'))) return;
    await resetAll();
    showToast(t('dataReset'), 'alert');
  };

  const sectionStyle: React.CSSProperties = { background: 'var(--surface2)', padding: '2rem', borderRadius: '20px', border: '1px solid var(--border)', boxShadow: '0 8px 30px rgba(0,0,0,0.4)' };
  const dangerSectionStyle: React.CSSProperties = { background: 'rgba(231,76,60,0.05)', padding: '2rem', borderRadius: '20px', border: '1px solid rgba(231,76,60,0.3)', boxShadow: '0 8px 30px rgba(0,0,0,0.4)' };
  const headingStyle: React.CSSProperties = { color: 'var(--gold)', marginBottom: '1rem', fontFamily: "'Playfair Display',serif", fontSize: '1.5rem' };

  return (
    <div className="fade-in">
      <div className="section-title">{t('settings')}</div>
      <div className="two-col">
        <div style={{ ...sectionStyle, gridColumn: '1 / -1' }}>
          <h3 style={headingStyle}>{t('branding')}</h3>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Shop name shows in the admin navbar and receipts. Logo URL shows on printed receipts.
          </p>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Shop Name</label>
              <input className="form-input" value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="Coffee Busra" />
            </div>
            <div className="form-group">
              <label className="form-label">Logo URL (Receipt)</label>
              <input className="form-input" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>
          {logoUrl && (
            <div style={{ marginBottom: '1rem' }}>
              <img src={logoUrl} alt="logo preview" style={{ height: '60px', borderRadius: '8px', background: '#fff', padding: '4px' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
          )}
          <button className="btn btn-gold" onClick={saveBranding}>{t('save')}</button>
        </div>

        <div style={{ ...sectionStyle, gridColumn: '1 / -1' }}>
          <h3 style={headingStyle}>{t('security')}</h3>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Protect the system with PIN codes. Leave blank to disable protection.
          </p>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('adminPin')}</label>
              <input type="password" className="form-input" value={adminPin} onChange={(e) => setAdminPin(e.target.value)} placeholder="Enter Admin PIN" />
            </div>
            <div className="form-group">
              <label className="form-label">{t('customerPin')}</label>
              <input type="password" className="form-input" value={customerPin} onChange={(e) => setCustomerPin(e.target.value)} placeholder="Enter Customer PIN" />
            </div>
          </div>
          <button className="btn btn-gold" onClick={saveSecurity}>{t('save')}</button>
        </div>

        <div style={{ ...dangerSectionStyle, gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ color: 'var(--red)', marginBottom: '0.5rem', fontFamily: "'Playfair Display',serif", fontSize: '1.5rem' }}>{t('dangerZone')}</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: 0 }}>{t('resetWarning')}</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-danger" onClick={handleResetOrders}>{t('resetOrders')}</button>
            <button className="btn btn-danger" onClick={handleResetAll}>{t('resetAll')}</button>
          </div>
        </div>

        <div style={{ ...sectionStyle, gridColumn: '1 / -1' }}>
          <h3 style={headingStyle}>{t('exchangeRate')}</h3>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Configure the USD to KHR exchange rate for the cashier and receipt.
          </p>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('exchangeRate')}</label>
              <input type="number" className="form-input" value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)} placeholder="4100" />
            </div>
          </div>
          <button className="btn btn-gold" onClick={saveCurrency}>{t('save')}</button>
        </div>

        <div style={{ ...sectionStyle, gridColumn: '1 / -1' }}>
          <h3 style={headingStyle}>{t('promo')}</h3>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Display an advertisement or promotion template for customers.
          </p>
          <div className="form-row" style={{ marginBottom: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{t('addImageUrl')}</label>
              <input className="form-input" value={newPromoUrl} onChange={(e) => setNewPromoUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button className="btn btn-outline" onClick={addPromoImage}>+ {t('addImage')}</button>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem', display: 'grid', gap: '10px' }}>
            {promoImages.length === 0 ? (
              <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{t('noPromoImages')}</div>
            ) : (
              promoImages.map((url, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--surface3)', padding: '0.6rem 1rem', borderRadius: '10px' }}>
                  <img src={url} alt="promo" style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} />
                  <span style={{ flex: 1, fontSize: '0.8rem', color: 'var(--muted)', wordBreak: 'break-all' }}>{url}</span>
                  <button className="btn btn-sm btn-danger" onClick={() => removePromoImage(idx)}>{t('delete')}</button>
                </div>
              ))
            )}
          </div>

          <div className="form-group" style={{ width: '50%' }}>
            <label className="form-label">Status</label>
            <select className="form-input" value={String(promoActive)} onChange={(e) => setPromoActive(e.target.value === 'true')}>
              <option value="true">Show</option>
              <option value="false">Hide</option>
            </select>
          </div>
          <button className="btn btn-gold" onClick={savePromo}>{t('save')}</button>
        </div>

        <div style={sectionStyle}>
          <h3 style={headingStyle}>Telegram Alerts</h3>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Receive orders and customer GPS location to Telegram.
          </p>
          <div className="form-group">
            <label className="form-label">{t('telegramToken')}</label>
            <input className="form-input" type="password" value={tgToken} onChange={(e) => setTgToken(e.target.value)} placeholder="123456:ABC-DEF..." />
          </div>
          <div className="form-group">
            <label className="form-label">{t('telegramChatId')}</label>
            <input className="form-input" type="password" value={tgChatId} onChange={(e) => setTgChatId(e.target.value)} placeholder="-1001234567890" />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-gold" onClick={saveTelegram}>{t('save')}</button>
            <button className="btn btn-outline" onClick={testTelegram}>Test Connection</button>
          </div>
        </div>
      </div>
    </div>
  );
}
