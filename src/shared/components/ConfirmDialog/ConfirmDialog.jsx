import './ConfirmDialog.css';

/**
 * Reusable confirmation dialog overlay.
 * Previously duplicated in SaludTab, HogaresPage, and PetProfilePage.
 */
export default function ConfirmDialog({
  isOpen,
  title = '¿Estás seguro?',
  message,
  onConfirm,
  onCancel,
  confirmText = 'Eliminar',
  cancelText = 'Cancelar',
  loading = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="confirm-dialog-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-dialog-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18"/>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
          </svg>
        </div>
        <h4 className="confirm-dialog-title">{title}</h4>
        {message && <p className="confirm-dialog-text">{message}</p>}
        <div className="confirm-dialog-actions">
          <button className="confirm-dialog-cancel" onClick={onCancel} disabled={loading}>
            {cancelText}
          </button>
          <button className="confirm-dialog-confirm" onClick={onConfirm} disabled={loading}>
            {loading ? 'Eliminando…' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
