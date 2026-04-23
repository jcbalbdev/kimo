import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../auth/hooks/useAuth';

const NOTIFICATION_TYPES = [
  { id: 'feeding',      label: 'Alimentación',   emoji: '🍖' },
  { id: 'medication',   label: 'Medicamentos',    emoji: '💊' },
  { id: 'vaccine',      label: 'Vacunas',         emoji: '💉' },
  { id: 'appointment',  label: 'Citas',           emoji: '📅' },
  { id: 'health_alert', label: 'Alertas de salud',emoji: '🚨' },
];

export { NOTIFICATION_TYPES };

export function useNotificationPrefs(pets = []) {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState([]); // raw rows from DB
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPrefs = useCallback(async () => {
    if (!user || !supabase || pets.length === 0) {
      setLoading(false);
      return;
    }

    const petIds = pets.map((p) => p.id);

    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .in('pet_id', petIds);

    if (!error) setPrefs(data || []);
    setLoading(false);
  }, [user?.id, pets.length]);

  useEffect(() => { fetchPrefs(); }, [fetchPrefs]);

  /**
   * Returns true if a specific (pet, type) pair is enabled.
   * Defaults to true if no preference row exists yet (opt-out model).
   */
  const isEnabled = useCallback((petId, type) => {
    const row = prefs.find((p) => p.pet_id === petId && p.notification_type === type);
    return row ? row.enabled : true;
  }, [prefs]);

  /**
   * Returns true if ALL types for a pet are enabled.
   */
  const isAllEnabled = useCallback((petId) => {
    return NOTIFICATION_TYPES.every((t) => isEnabled(petId, t.id));
  }, [isEnabled]);

  /**
   * Toggle a single (pet, type) preference.
   */
  const togglePref = async (petId, type) => {
    if (!user || !supabase) return;
    setSaving(true);

    const current = isEnabled(petId, type);
    const newValue = !current;

    const { error } = await supabase
      .from('notification_preferences')
      .upsert(
        { user_id: user.id, pet_id: petId, notification_type: type, enabled: newValue },
        { onConflict: 'user_id,pet_id,notification_type' }
      );

    if (!error) {
      setPrefs((prev) => {
        const exists = prev.find((p) => p.pet_id === petId && p.notification_type === type);
        if (exists) {
          return prev.map((p) =>
            p.pet_id === petId && p.notification_type === type ? { ...p, enabled: newValue } : p
          );
        }
        return [...prev, { user_id: user.id, pet_id: petId, notification_type: type, enabled: newValue }];
      });
    }

    setSaving(false);
  };

  /**
   * Toggle ALL types for a pet (master switch).
   */
  const toggleAllForPet = async (petId) => {
    if (!user || !supabase) return;
    setSaving(true);

    const allOn = isAllEnabled(petId);
    const newValue = !allOn;

    const rows = NOTIFICATION_TYPES.map((t) => ({
      user_id: user.id,
      pet_id: petId,
      notification_type: t.id,
      enabled: newValue,
    }));

    const { error } = await supabase
      .from('notification_preferences')
      .upsert(rows, { onConflict: 'user_id,pet_id,notification_type' });

    if (!error) {
      setPrefs((prev) => {
        const filtered = prev.filter((p) => p.pet_id !== petId);
        return [...filtered, ...rows];
      });
    }

    setSaving(false);
  };

  return {
    prefs,
    loading,
    saving,
    isEnabled,
    isAllEnabled,
    togglePref,
    toggleAllForPet,
    NOTIFICATION_TYPES,
  };
}
