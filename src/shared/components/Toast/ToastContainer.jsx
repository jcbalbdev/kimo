import { useToast } from '../../hooks/useToast';
import './Toast.css';

const TOAST_ICONS = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" role="alert" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <span className="toast-icon">{TOAST_ICONS[toast.type]}</span>
          <span className="toast-message">{toast.message}</span>
          <button
            className="toast-dismiss"
            onClick={() => removeToast(toast.id)}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
