/**
 * Toast.tsx — Lightweight toast notification system.
 *
 * Provides a `useToast` hook and a `<ToastContainer />` component
 * for showing ephemeral success, error, and info messages.
 */

import { useState, useCallback, useEffect, createContext, useContext, type ReactNode } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  addToast: (message: string, type?: ToastType) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue>({
  addToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

// ─── Provider ────────────────────────────────────────────────────────────────
let _nextId = 0;
const DURATION_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = _nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

// ─── Container ───────────────────────────────────────────────────────────────
function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

// ─── Individual Toast ────────────────────────────────────────────────────────
const TOAST_STYLES: Record<ToastType, string> = {
  success: 'bg-green-900 text-white border-green-700',
  error: 'bg-red-900 text-white border-red-700',
  info: 'bg-black text-white border-gray-700',
};

const TOAST_ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 px-5 py-3 border-2 font-sans text-sm min-w-[280px] shadow-lg animate-[slideIn_0.2s_ease-out] ${TOAST_STYLES[toast.type]}`}
      role="alert"
    >
      <span className="text-lg font-bold">{TOAST_ICONS[toast.type]}</span>
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="opacity-60 hover:opacity-100 transition-opacity text-lg"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
