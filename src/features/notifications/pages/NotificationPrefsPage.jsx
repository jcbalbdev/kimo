import { useNavigate } from 'react-router-dom';
import { usePets } from '../../pets/hooks/usePets';
import { useNotificationPrefs, NOTIFICATION_TYPES } from '../hooks/useNotificationPrefs';
import './NotificationPrefsPage.css';

export default function NotificationPrefsPage() {
  const navigate = useNavigate();
  const { pets = [] } = usePets();
  const { loading, saving, isEnabled, isAllEnabled, togglePref, toggleAllForPet } =
    useNotificationPrefs(pets);

  return (
    <div className="np-root">
      {/* Header */}
      <div className="np-header">
        <button className="np-back-btn" onClick={() => navigate(-1)} aria-label="Volver">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <h1 className="np-title">🔔 Notificaciones</h1>
        {saving && <span className="np-saving">Guardando…</span>}
      </div>

      <p className="np-subtitle">
        Elige de qué mascotas y qué tipo de alertas quieres recibir.
      </p>

      {loading ? (
        <div className="np-loading">Cargando preferencias…</div>
      ) : pets.length === 0 ? (
        <div className="np-empty">No tienes mascotas registradas aún.</div>
      ) : (
        <div className="np-list">
          {pets.map((pet) => (
            <div key={pet.id} className="np-pet-card">
              {/* Pet header + master toggle */}
              <div className="np-pet-header">
                <span className="np-pet-avatar">{pet.avatar || '🐾'}</span>
                <span className="np-pet-name">{pet.name}</span>
                <button
                  className={`np-master-toggle ${isAllEnabled(pet.id) ? 'np-toggle-on' : 'np-toggle-off'}`}
                  onClick={() => toggleAllForPet(pet.id)}
                  aria-label={`Activar/desactivar todo para ${pet.name}`}
                >
                  {isAllEnabled(pet.id) ? 'Todo activado' : 'Todo apagado'}
                </button>
              </div>

              {/* Individual type toggles */}
              <div className="np-types">
                {NOTIFICATION_TYPES.map((type) => {
                  const on = isEnabled(pet.id, type.id);
                  return (
                    <div key={type.id} className="np-type-row">
                      <span className="np-type-emoji">{type.emoji}</span>
                      <span className="np-type-label">{type.label}</span>
                      <button
                        className={`np-toggle ${on ? 'np-toggle-on' : 'np-toggle-off'}`}
                        onClick={() => togglePref(pet.id, type.id)}
                        aria-label={`${on ? 'Desactivar' : 'Activar'} ${type.label} para ${pet.name}`}
                      >
                        <span className="np-toggle-knob" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
