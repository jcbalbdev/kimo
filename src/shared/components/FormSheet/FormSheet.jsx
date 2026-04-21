import { BackChevron } from '../Icons';
import './FormSheet.css';

/**
 * Full-screen form sheet with back button, title, and save/cancel actions.
 * Replaces the duplicated tab-sheet-overlay → tab-sheet pattern used in
 * MedsTab, AlimentosTab, CitasTab, VacunasTab, SaludTab, and PerfilTab.
 */
export default function FormSheet({
  isOpen,
  onClose,
  title,
  onSave,
  saving = false,
  saveDisabled = false,
  saveLabel,
  children,
}) {
  if (!isOpen) return null;

  return (
    <div className="form-sheet-overlay" onClick={onClose}>
      <div className="form-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="form-sheet-header-row">
          <button className="form-sheet-back" onClick={onClose}>
            <BackChevron />
          </button>
          <h3 className="form-sheet-title">{title}</h3>
        </div>

        <div className="form-sheet-body">
          {children}
        </div>

        {onSave && (
          <div className="form-sheet-actions">
            <button className="form-sheet-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button
              className="form-sheet-save"
              onClick={onSave}
              disabled={saving || saveDisabled}
            >
              {saving ? 'Guardando…' : (saveLabel || 'Guardar')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
