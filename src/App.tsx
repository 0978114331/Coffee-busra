import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import AdminLayout from '@/components/admin/AdminLayout';
import CustomerApp from '@/components/customer/CustomerApp';
import PinGate from '@/components/PinGate';
import { ToastContainer } from '@/components/Toast';

function AdminRoute() {
  const adminUnlocked = useStore((s) => s.adminUnlocked);
  const setAdminUnlocked = useStore((s) => s.setAdminUnlocked);
  const settings = useStore((s) => s.settings);
  const navigate = useNavigate();

  if (!settings) return null;

  if (!adminUnlocked) {
    return (
      <PinGate
        type="admin"
        onSuccess={() => setAdminUnlocked(true)}
        onSwitch={() => navigate('/')}
        switchLabel="Go to Customer App"
      />
    );
  }

  return <AdminLayout />;
}

function CustomerRoute() {
  const customerUnlocked = useStore((s) => s.customerUnlocked);
  const setCustomerUnlocked = useStore((s) => s.setCustomerUnlocked);
  const settings = useStore((s) => s.settings);

  if (!settings) return null;

  if (!customerUnlocked) {
    return (
      <PinGate
        type="customer"
        onSuccess={() => setCustomerUnlocked(true)}
      />
    );
  }

  return <CustomerApp />;
}

function AppRoutes() {
  const init = useStore((s) => s.init);
  const loading = useStore((s) => s.loading);
  const error = useStore((s) => s.error);
  const settings = useStore((s) => s.settings);
  const location = useLocation();

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    init().then((fn) => { cleanup = fn; });
    return () => { cleanup?.(); };
  }, []);

  if (loading || !settings) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="logo" style={{ fontSize: '2rem', justifyContent: 'center', marginBottom: '1rem' }}>COFFEE<span>BUSRA</span></div>
          <div style={{ color: 'var(--muted)' }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ color: 'var(--red)', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Connection Error</div>
          <div style={{ color: 'var(--muted)' }}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/admin" element={<AdminRoute />} />
      <Route path="/" element={<CustomerRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <ToastContainer />
    </BrowserRouter>
  );
}
