import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import Overview from '@/components/admin/Overview';
import TablesTab from '@/components/admin/TablesTab';
import MenuTab from '@/components/admin/MenuTab';
import OrdersTab from '@/components/admin/OrdersTab';
import KitchenTab from '@/components/admin/KitchenTab';
import CashierTab from '@/components/admin/CashierTab';
import SettingsTab from '@/components/admin/SettingsTab';

type Tab = 'overview' | 'tables' | 'menu' | 'orders' | 'kitchen' | 'cashier' | 'settings';

const tabs: { id: Tab; labelKey: 'overview' | 'tables' | 'menu' | 'orders' | 'kitchen' | 'cashier' | 'settings' }[] = [
  { id: 'overview', labelKey: 'overview' },
  { id: 'tables', labelKey: 'tables' },
  { id: 'menu', labelKey: 'menu' },
  { id: 'orders', labelKey: 'orders' },
  { id: 'kitchen', labelKey: 'kitchen' },
  { id: 'cashier', labelKey: 'cashier' },
  { id: 'settings', labelKey: 'settings' },
];

export default function AdminLayout() {
  const t = useStore((s) => s.t);
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  const orders = useStore((s) => s.orders);
  const settings = useStore((s) => s.settings);
  const setAdminUnlocked = useStore((s) => s.setAdminUnlocked);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const kitchenCount = orders.filter((o) => o.status === 'pending' || o.status === 'preparing').length;
  const cashierCount = orders.filter((o) => o.status === 'ready').length;

  const shopName = settings?.shop_name || 'Coffee Busra';
  const parts = shopName.split(' ');
  const brandFirst = parts[0] || 'Coffee';
  const brandRest = parts.slice(1).join(' ');

  const handleTabClick = (tab: Tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const renderTab = (): ReactNode => {
    switch (activeTab) {
      case 'overview': return <Overview />;
      case 'tables': return <TablesTab />;
      case 'menu': return <MenuTab />;
      case 'orders': return <OrdersTab />;
      case 'kitchen': return <KitchenTab />;
      case 'cashier': return <CashierTab />;
      case 'settings': return <SettingsTab />;
      default: return null;
    }
  };

  return (
    <div className="view active fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
      <nav className="navbar">
        <div className="logo">
          <button className="hamburger-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>☰</button>
          {brandFirst.toUpperCase()}<span>{brandRest.toUpperCase()}</span>
        </div>

        <div className={`nav-tabs ${mobileMenuOpen ? 'show' : ''}`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabClick(tab.id)}
            >
              {t(tab.labelKey)}
              {tab.id === 'orders' && pendingCount > 0 && <span className="nav-badge">{pendingCount}</span>}
              {tab.id === 'kitchen' && kitchenCount > 0 && <span className="nav-badge">{kitchenCount}</span>}
              {tab.id === 'cashier' && cashierCount > 0 && <span className="nav-badge">{cashierCount}</span>}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="lang-btn" onClick={() => setLang(lang === 'en' ? 'km' : 'en')}>
            🌐 {lang === 'en' ? 'EN' : 'KM'}
          </button>
          <div className="nav-status">
            <div className="pulse" />
            <span>Live</span>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/')}>{t('customerView')}</button>
        </div>
      </nav>

      <div className="main-content">
        {renderTab()}
      </div>
    </div>
  );
}
