import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: number;
}

export default function Modal({ open, onClose, children, maxWidth = 480 }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(160deg, #1e1a14 0%, #15120e 100%)',
          border: '1px solid #c9a84c',
          borderRadius: '24px',
          padding: '2.5rem',
          maxWidth,
          width: '100%',
          position: 'relative',
          maxHeight: 'calc(100dvh - 2rem)',
          overflowY: 'auto',
          animation: 'modalIn 0.35s cubic-bezier(0.34,1.56,0.64,1)',
          boxShadow: '0 15px 60px rgba(0,0,0,0.8)',
          margin: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '1.2rem',
            right: '1.2rem',
            background: 'rgba(255,255,255,0.08)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            cursor: 'pointer',
            color: '#e8dcc8',
            fontSize: '1.2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
            zIndex: 1,
          }}
        >
          &times;
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
}
