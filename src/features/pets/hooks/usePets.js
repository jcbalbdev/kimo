import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../auth/hooks/useAuth';
import { useHousehold } from '../../household/hooks/useHousehold';
import { getSpecies } from '../constants/species';

export function usePets() {
  const { user } = useAuth();
  const { currentHousehold } = useHousehold();
  const [pets, setPets] = useState([]);
  const [currentPetId, setCurrentPetId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPets = useCallback(async () => {
    if (!currentHousehold) { setLoading(false); return; }

    const { data } = await supabase
      .from('pets')
      .select('*')
      .eq('household_id', currentHousehold.id)
      .order('created_at', { ascending: true });

    const petList = data || [];
    setPets(petList);

    // Auto-select first pet if none selected or current not in list
    if (petList.length > 0) {
      if (!currentPetId || !petList.find((p) => p.id === currentPetId)) {
        setCurrentPetId(petList[0].id);
      }
    } else {
      setCurrentPetId(null);
    }
    setLoading(false);
  }, [currentHousehold, currentPetId]);

  useEffect(() => { fetchPets(); }, [fetchPets]);

  const currentPet = pets.find((p) => p.id === currentPetId) || null;

  const addPet = async ({ name, species, customSpecies, avatarKey }) => {
    if (!currentHousehold || !user) {
      console.error('[Pets] No household or user', { currentHousehold, user });
      return { error: 'No household' };
    }

    const speciesData = getSpecies(species);
    console.log('[Pets] Creating pet:', { name, species, household_id: currentHousehold.id });

    const { data, error } = await supabase
      .from('pets')
      .insert({
        name,
        species,
        custom_species: customSpecies || null,
        avatar_emoji: avatarKey || 'img',
        household_id: currentHousehold.id,
        created_by: user.id,
      })
      .select()
      .single();

    console.log('[Pets] Insert result:', { data, error });

    if (data) {
      await fetchPets();
      setCurrentPetId(data.id);
    }
    return { data, error };
  };

  const updatePet = async (id, updates) => {
    const { error } = await supabase
      .from('pets')
      .update(updates)
      .eq('id', id);

    if (!error) await fetchPets();
    return { error };
  };

  const deletePet = async (id) => {
    await supabase.from('pets').delete().eq('id', id);
    await fetchPets();
  };

  const selectPet = (id) => setCurrentPetId(id);

  const hasPets = pets.length > 0;

  return {
    pets,
    currentPet,
    loading,
    hasPets,
    addPet,
    updatePet,
    deletePet,
    selectPet,
    fetchPets,
  };
}
