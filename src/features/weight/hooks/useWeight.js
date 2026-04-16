import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

export function useWeight(petId) {
  const [weightLogs, setWeightLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWeightLogs = useCallback(async () => {
    if (!petId) { setLoading(false); return; }

    const { data } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('pet_id', petId)
      .order('date', { ascending: true });

    setWeightLogs(data || []);
    setLoading(false);
  }, [petId]);

  useEffect(() => { fetchWeightLogs(); }, [fetchWeightLogs]);

  const addWeightLog = async (logData) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('weight_logs')
      .insert({ ...logData, pet_id: petId, created_by: user.id })
      .select()
      .single();

    if (data) await fetchWeightLogs();
    return { data, error };
  };

  const deleteWeightLog = async (id) => {
    await supabase.from('weight_logs').delete().eq('id', id);
    await fetchWeightLogs();
  };

  // Derived
  const lastWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1] : null;

  const getTrend = () => {
    if (weightLogs.length < 2) return 'stable';
    const last = weightLogs[weightLogs.length - 1].weight;
    const prev = weightLogs[weightLogs.length - 2].weight;
    if (last > prev) return 'up';
    if (last < prev) return 'down';
    return 'stable';
  };

  return {
    weightLogs,
    lastWeight,
    trend: getTrend(),
    loading,
    addWeightLog,
    deleteWeightLog,
  };
}
