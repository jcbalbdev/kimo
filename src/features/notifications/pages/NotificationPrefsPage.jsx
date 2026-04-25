import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { usePets } from '../../pets/hooks/usePets';
import { useNotificationPrefs, NOTIFICATION_TYPES } from '../hooks/useNotificationPrefs';
import './NotificationPrefsPage.css';

export default function NotificationPrefsPage() {
  const navigate  = useNavigate();
  const location  = useLocation();

  // Context from navigation state
  const householdId   = location.state?.householdId   || null;
  const householdName = location.state?.householdName || null;
  const petId         = location.state?.petId         || null;
  const petName       = location.state?.petName       || null;

  // Fallback: pets from the currentHousehold (accessed without context)
  const { pets: currentPets = [] } = usePets();

  const [filteredPets, setFilteredPets] = useState(null);
  const [loadingFiltered, setLoadingFiltered] = useState(false);

  useEffect(() => {
    // Case 1: specific pet from avatar bell
    if (petId) {
      setLoadingFiltered(true);
      supabase
        .from('pets')
        .select('id, name, avatar_emoji, photo_url')
        .eq('id', petId)
        .single()
        .then(({ data }) => {
          setFilteredPets(data ? [data] : []);
          setLoadingFiltered(false);
        });
      return;
    }
    // Case 2: specific household from household sheet
    if (householdId) {
      setLoadingFiltered(true);
      supabase
        .from('pets')
        .select('id, name, avatar_emoji, photo_url')
        .eq('household_id', householdId)
        .order('created_at', { ascending: true })
        .then(({ data }) => {
          setFilteredPets(data || []);
          setLoadingFiltered(false);
        });
      return;
    }
    setFilteredPets(null);
  }, [petId, householdId]);

  const pets    = (petId || householdId) ? (filteredPets ?? []) : currentPets;
  const loading = (petId || householdId) ? loadingFiltered : false;

  const { saving, isEnabled, isAllEnabled, togglePref, toggleAllForPet } =
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
        {petName
          ? `Alertas de ${petName}`
          : householdName
            ? `Alertas del hogar "${householdName}"`
            : 'Elige de qué mascotas y qué tipo de alertas quieres recibir.'}
      </p>

      {loading ? (
        <div className="np-loading">Cargando preferencias…</div>
      ) : pets.length === 0 ? (
        <div className="np-empty">No hay mascotas registradas en este hogar.</div>
      ) : (
        <div className="np-list">
          {pets.map((pet) => (
            <div key={pet.id} className="np-pet-card">
              {/* Pet header + master toggle */}
              <div className="np-pet-header">
                <span className="np-pet-avatar">
                  {(!pet.avatar_emoji || pet.avatar_emoji.startsWith('img'))
                    ? '🐾'
                    : (pet.avatar_emoji || pet.avatar || '🐾')}
                </span>
                <span className="np-pet-name">{pet.name}</span>
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
