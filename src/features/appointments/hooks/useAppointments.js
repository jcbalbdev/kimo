import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

export function useAppointments(petId) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = useCallback(async () => {
    if (!petId) { setLoading(false); return; }

    const { data } = await supabase
      .from('appointments')
      .select('*, profiles:created_by(display_name)')
      .eq('pet_id', petId)
      .order('date', { ascending: false });

    setAppointments(data || []);
    setLoading(false);
  }, [petId]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const addAppointment = async (apptData) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('appointments')
      .insert({ ...apptData, pet_id: petId, created_by: user.id })
      .select()
      .single();

    if (data) await fetchAppointments();
    return { data, error };
  };

  const updateAppointment = async (id, updates) => {
    const { error } = await supabase
      .from('appointments')
      .update(updates)
      .eq('id', id);

    if (!error) await fetchAppointments();
    return { error };
  };

  const deleteAppointment = async (id) => {
    await supabase.from('appointments').delete().eq('id', id);
    await fetchAppointments();
  };

  // Derived data
  const today = new Date().toISOString().split('T')[0];

  const upcoming = appointments
    .filter((a) => a.status === 'scheduled' && a.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  const past = appointments
    .filter((a) => a.status !== 'scheduled' || a.date < today)
    .sort((a, b) => b.date.localeCompare(a.date));

  const nextAppointment = upcoming[0] || null;

  return {
    appointments,
    upcoming,
    past,
    nextAppointment,
    loading,
    addAppointment,
    updateAppointment,
    deleteAppointment,
  };
}
