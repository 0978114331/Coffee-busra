import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';

interface PinGateProps {
  type: 'admin' | 'customer';
  onSuccess: () => void;
  onSwitch?: () => void;
  switchLabel?: string;
}

export default function PinGate({ type, onSuccess, onSwitch, switchLabel }: PinGateProps) {
  const t = useStore((s) => s.t);
  const settings = useStore((s) => s.settings);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const expectedPin = type === 'admin' ? settings?.admin_pin : settings?.customer_pin;
  const title = type === 'admin' ? t('adminAccess') : t('customerAccess');
  const subtitle = type === 'admin' ? 'Please enter the system PIN.' : 'Please enter the store PIN to order.';
  const buttonLabel = type === 'admin' ? 'Unlock Dashboard' : 'Enter Menu';

  useEffect(() => {
    if (!expectedPin) {
      onSuccess();
    }
  }, [expectedPin, onSuccess]);

  if (!expectedPin) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === expectedPin) {
      setError(false);
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 9999, background: 'var(--bg)' }}>
      <div className="modal" style={{ textAlign: 'center', maxWidth: 380 }}>
        <h2 style={{ color: 'var(--gold)', marginBottom: '0.5rem', fontFamily: "'Playfair Display',serif", fontSize: '2rem' }}>
          {title}
        </h2>
        <p style={{ color: 'var(--muted)', marginBottom: '2rem', fontSize: '0.95rem' }}>{subtitle}</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            className="form-input"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError(false);
            }}
            autoFocus
            style={{ textAlign: 'center', fontSize: '2rem', letterSpacing: '10px', marginBottom: '1.5rem', fontWeight: 'bold', height: '60px' }}
            placeholder="****"
          />
          {error && (
            <div style={{ color: 'var(--red)', fontSize: '0.9rem', marginBottom: '1.5rem', fontWeight: 'bold' }}>
              {t('wrongPin')}
            </div>
          )}
          <button type="submit" className="btn btn-gold btn-full" style={{ padding: '1.2rem', fontSize: '1.1rem', textTransform: 'uppercase' }}>
            {buttonLabel}
          </button>
        </form>
        {onSwitch && (
          <button className="btn btn-outline btn-full" style={{ padding: '1rem', fontSize: '0.9rem', marginTop: '1rem', border: 'none' }} onClick={onSwitch}>
            {switchLabel}
          </button>
        )}
      </div>
    </div>
  );
}
