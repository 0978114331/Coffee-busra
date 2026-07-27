import { useEffect, useState } from 'react';

export interface ToastMsg {
  id: number;
  message: string;
  type?: 'default' | 'alert' | 'error';
}

let toastId = 0;
let listeners: ((toasts: ToastMsg[]) => void)[] = [];
let currentToasts: ToastMsg[] = [];

export function showToast(message: string, type: ToastMsg['type'] = 'default', duration = 4500) {
  const id = ++toastId;
  const toast: ToastMsg = { id, message, type };
  currentToasts = [...currentToasts, toast];
  listeners.forEach((l) => l(currentToasts));
  setTimeout(() => {
    currentToasts = currentToasts.filter((t) => t.id !== id);
    listeners.forEach((l) => l(currentToasts));
  }, duration);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  useEffect(() => {
    listeners.push(setToasts);
    return () => {
      listeners = listeners.filter((l) => l !== setToasts);
    };
  }, []);

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type ?? ''}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
