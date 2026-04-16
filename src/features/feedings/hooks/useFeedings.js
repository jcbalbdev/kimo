import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

export function useFeedings(petId) {
  const [feedings, setFeedings] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  const fetchFeedings = useCallback(async () => {
    if (!petId) { setLoading(false); return; }

    const { data } = await supabase
      .from('feedings')
      .select('*, profiles:created_by(display_name)')
      .eq('pet_id', petId)
      .order('date', { ascending: false })
      .order('time', { ascending: false })
      .limit(100);

    setFeedings(data || []);
    setLoading(false);
  }, [petId]);

  useEffect(() => { fetchFeedings(); }, [fetchFeedings]);

  const addFeeding = async (feedData) => {
    const { data: { user } } = await supabase.auth.getUser();
    const now = new Date();
    const defaultTime = now.toTimeString().slice(0, 8); // "HH:MM:SS"

    const { data, error } = await supabase
      .from('feedings')
      .insert({
        ...feedData,
        pet_id: petId,
        date: today,
        time: feedData.time || defaultTime, // use provided or fallback to now
        created_by: user.id,
      })
      .select()
      .single();

    if (data) await fetchFeedings();
    return { data, error };
  };

  const updateFeeding = async (id, updates) => {
    const { error } = await supabase
      .from('feedings')
      .update(updates)
      .eq('id', id);
    if (!error) await fetchFeedings();
    return { error };
  };

  const deleteFeeding = async (id) => {
    await supabase.from('feedings').delete().eq('id', id);
    await fetchFeedings();
  };

  // Derived data
  const todayFeedings = feedings.filter((f) => f.date === today);
  const lastFeeding = feedings.length > 0 ? feedings[0] : null;

  // Group by date for timeline
  const groupedByDate = feedings.reduce((groups, feeding) => {
    const date = feeding.date;
    if (!groups[date]) groups[date] = [];
    groups[date].push(feeding);
    return groups;
  }, {});

  return {
    feedings,
    todayFeedings,
    lastFeeding,
    groupedByDate,
    loading,
    addFeeding,
    updateFeeding,
    deleteFeeding,
  };
}
