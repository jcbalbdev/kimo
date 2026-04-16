import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

// ── Slot generator ────────────────────────────────────────

/**
 * Generate all scheduled dose dates for a vaccine.
 * First slot = initial application date (auto-checked).
 * Subsequent slots based on interval_days + repeats.
 * Returns array of { dateStr, isFirst } in DESCENDING order (newest first).
 */
export function generateVacSlots(vaccine) {
  const { date, interval_days, repeats, ended_at } = vaccine;
  if (!date) return [];

  const slots = [{ dateStr: date, isFirst: true }];

  if (!interval_days) return slots; // no next dose configured

  const startDate = new Date(date + 'T12:00:00');

  // End limit: ended_at or one interval past now
  const maxDate = ended_at
    ? new Date(ended_at)
    : new Date(Date.now() + (interval_days || 365) * 86_400_000);

  let cur = new Date(startDate);
  cur.setDate(cur.getDate() + interval_days);

  let safety = 0;
  while (cur <= maxDate && safety < 200) {
    const ds = cur.toISOString().split('T')[0];
    slots.push({ dateStr: ds, isFirst: false });
    safety++;

    if (!repeats) break; // only one next dose if not repeating

    cur = new Date(cur);
    cur.setDate(cur.getDate() + interval_days);
  }

  return slots.reverse(); // newest first for display
}

/**
 * Format interval_days into a human-readable label.
 */
export function formatVacInterval(days) {
  if (!days) return '';
  if (days === 1)   return 'Diario';
  if (days < 30)    return `Cada ${days} días`;
  if (days === 30)  return 'Mensual';
  if (days === 60)  return 'Cada 2 meses';
  if (days === 90)  return 'Cada 3 meses';
  if (days === 180) return 'Cada 6 meses';
  if (days === 365) return 'Anual';
  return `Cada ${days} días`;
}

// ── Hook ─────────────────────────────────────────────────

export function useVaccines(petId) {
  const [vaccines, setVaccines]   = useState([]);
  const [checks,   setChecks]     = useState([]);
  const [loading,  setLoading]    = useState(true);

  const fetchAll = useCallback(async () => {
    if (!petId) { setLoading(false); return; }

    const { data: vaxs } = await supabase
      .from('vaccines')
      .select('*')
      .eq('pet_id', petId)
      .order('date', { ascending: false });

    setVaccines(vaxs || []);

    if (vaxs && vaxs.length > 0) {
      const ids = vaxs.map((v) => v.id);
      const { data: chks } = await supabase
        .from('vaccine_checks')
        .select('*')
        .in('vaccine_id', ids)
        .order('scheduled_date', { ascending: false });

      setChecks(chks || []);
    } else {
      setChecks([]);
    }

    setLoading(false);
  }, [petId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Derived ─────────────────────────────────────────────

  const today = new Date().toISOString().split('T')[0];

  /** Returns true if a dose slot is considered checked. First slot auto-checked only if its date <= today. */
  const isDoseChecked = (vaccineId, dateStr, isFirst) => {
    if (isFirst) return dateStr <= today; // only auto-check if already applied
    return checks.some(
      (c) => c.vaccine_id === vaccineId && c.scheduled_date === dateStr
    );
  };

  /** Returns true if a scheduled date is overdue and not yet checked. */
  const isDoseOverdue = (vaccineId, dateStr, isFirst) => {
    if (isFirst) return false;
    return dateStr < today && !isDoseChecked(vaccineId, dateStr, false);
  };

  /** Count of vaccines with at least one overdue unchecked dose. */
  const pendingVaccines = vaccines.filter((v) => {
    const slots = generateVacSlots(v);
    return slots.some((s) => isDoseOverdue(v.id, s.dateStr, s.isFirst));
  });

  // ── Actions ─────────────────────────────────────────────

  const addVaccine = async (data) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: row, error } = await supabase
      .from('vaccines')
      .insert({ ...data, pet_id: petId, created_by: user.id })
      .select()
      .single();

    if (!error) await fetchAll();
    return { data: row, error };
  };

  /**
   * Toggle a specific scheduled dose.
   * First dose (isFirst=true) is always locked as checked.
   */
  const checkDose = async (vaccineId, dateStr) => {
    const existing = checks.find(
      (c) => c.vaccine_id === vaccineId && c.scheduled_date === dateStr
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (existing) {
      await supabase.from('vaccine_checks').delete().eq('id', existing.id);
    } else {
      await supabase.from('vaccine_checks').insert({
        vaccine_id:     vaccineId,
        scheduled_date: dateStr,
        taken:          true,
        checked_by:     user.id,
      });
    }
    await fetchAll();
  };

  const endVaccine = async (id) => {
    await supabase
      .from('vaccines')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', id);
    await fetchAll();
  };

  const deleteVaccine = async (id) => {
    await supabase.from('vaccines').delete().eq('id', id);
    await fetchAll();
  };

  const updateVaccine = async (id, updates) => {
    const { error } = await supabase.from('vaccines').update(updates).eq('id', id);
    if (!error) await fetchAll();
    return { error };
  };

  return {
    vaccines,
    checks,
    loading,
    pendingVaccines,
    // Helpers:
    generateVacSlots,
    isDoseChecked,
    isDoseOverdue,
    formatVacInterval,
    // Actions:
    addVaccine,
    checkDose,
    endVaccine,
    deleteVaccine,
    updateVaccine,
  };
}
