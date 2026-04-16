import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

// ── Helpers ──────────────────────────────────────────────────

/**
 * Generate all scheduled dose slots for a medication.
 * Returns an array of Date objects (ascending order).
 */
export function generateDoseSlots(medication) {
  const { start_date, start_time, interval_hours, ended_at } = medication;
  if (!start_date) return [];

  // Normalize start datetime (truncate to minute)
  const timeStr = ((start_time || '08:00:00')).substring(0, 5); // "HH:MM"
  const startDt = new Date(`${start_date}T${timeStr}:00`);
  startDt.setSeconds(0, 0);

  const intervalMs = (Number(interval_hours) || 24) * 3_600_000;

  // End: ended_at if set, otherwise one interval past now
  const endDt = ended_at
    ? new Date(ended_at)
    : new Date(Date.now() + intervalMs);

  const slots = [];
  let cur = new Date(startDt);
  while (cur <= endDt && slots.length < 500) { // safety cap
    slots.push(new Date(cur));
    cur = new Date(cur.getTime() + intervalMs);
  }
  return slots; // ascending
}

/**
 * Check if a dose slot has a matching check record (within 1 minute tolerance).
 */
export function isSlotChecked(slot, checks, medId) {
  const slotMs = slot.getTime();
  return checks.some(
    (c) =>
      c.medication_id === medId &&
      c.scheduled_at &&
      Math.abs(new Date(c.scheduled_at).getTime() - slotMs) < 60_000
  );
}

/**
 * Human-readable frequency label
 */
export function formatFrequency(hours) {
  const h = Number(hours);
  if (!h) return '';
  if (h < 24) return `Cada ${h}h`;
  if (h === 24) return 'Diario';
  if (h % 168 === 0) return `Cada ${h / 168} sem.`;
  if (h % 24 === 0) return `Cada ${h / 24} días`;
  return `Cada ${h}h`;
}

// ── Hook ─────────────────────────────────────────────────────

export function useMedications(petId) {
  const [medications, setMedications] = useState([]);
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all medications + all their checks in one go
  const fetchAll = useCallback(async () => {
    if (!petId) { setLoading(false); return; }

    const { data: meds } = await supabase
      .from('medications')
      .select('*')
      .eq('pet_id', petId)
      .order('created_at', { ascending: false });

    setMedications(meds || []);

    if (meds && meds.length > 0) {
      const medIds = meds.map((m) => m.id);
      const { data: chks } = await supabase
        .from('medication_checks')
        .select('*')
        .in('medication_id', medIds)
        .not('scheduled_at', 'is', null)
        .order('scheduled_at', { ascending: false });

      setChecks(chks || []);
    } else {
      setChecks([]);
    }

    setLoading(false);
  }, [petId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Derived lists
  const activeMedications = medications.filter((m) => m.is_active && !m.ended_at);
  const endedMedications = medications.filter((m) => !m.is_active || !!m.ended_at);

  // ── Actions ────────────────────────────────────────────────

  const addMedication = async (medData) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('medications')
      .insert({ ...medData, pet_id: petId, created_by: user.id, is_active: true })
      .select()
      .single();

    if (!error) await fetchAll();
    return { data, error };
  };

  /**
   * Toggle a specific scheduled dose slot on/off.
   * @param {string} medId
   * @param {Date} slot  — the scheduled Date for this dose
   */
  const checkSlot = async (medId, slot) => {
    const slotMs = slot.getTime();
    const existing = checks.find(
      (c) =>
        c.medication_id === medId &&
        c.scheduled_at &&
        Math.abs(new Date(c.scheduled_at).getTime() - slotMs) < 60_000
    );

    if (existing) {
      await supabase.from('medication_checks').delete().eq('id', existing.id);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      // Normalise to full ISO (seconds = 0)
      const normalised = new Date(slot);
      normalised.setSeconds(0, 0);
      await supabase.from('medication_checks').insert({
        medication_id: medId,
        scheduled_at: normalised.toISOString(),
        taken: true,
        checked_by: user.id,
      });
    }
    await fetchAll();
  };

  /**
   * Mark a medication as ended (finalize treatment).
   */
  const endMedication = async (medId) => {
    await supabase
      .from('medications')
      .update({ ended_at: new Date().toISOString(), is_active: false })
      .eq('id', medId);
    await fetchAll();
  };

  const deleteMedication = async (id) => {
    await supabase.from('medications').delete().eq('id', id);
    await fetchAll();
  };

  const updateMedication = async (id, updates) => {
    const { error } = await supabase.from('medications').update(updates).eq('id', id);
    if (!error) await fetchAll();
    return { error };
  };

  // Legacy compatibility (still used by PetProfilePage and MedicationsPage)
  const isTakenToday = (medId) => {
    const today = new Date().toDateString();
    return checks.some(
      (c) =>
        c.medication_id === medId &&
        c.scheduled_at &&
        new Date(c.scheduled_at).toDateString() === today
    );
  };

  const pendingToday = activeMedications.filter((m) => !isTakenToday(m.id)).length;

  return {
    medications,
    activeMedications,
    endedMedications,
    // legacy alias for components not yet migrated:
    inactiveMedications: endedMedications,
    checks,
    loading,
    pendingToday,
    isTakenToday,
    // New API:
    checkSlot,
    endMedication,
    // Existing API:
    addMedication,
    updateMedication,
    deleteMedication,
    fetchAll,
    // Helpers exported for components:
    generateDoseSlots,
    isSlotChecked,
    formatFrequency,
  };
}
