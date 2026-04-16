import { createContext, useState, useEffect, useCallback, useContext, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../auth/hooks/useAuth';

const HouseholdContext = createContext(null);

export function HouseholdProvider({ children }) {
  const { user } = useAuth();
  const [households, setHouseholds] = useState([]);
  const [currentHousehold, setCurrentHousehold] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false);

  const fetchHouseholds = useCallback(async (force = false) => {
    if (!user || !supabase) { setLoading(false); return; }
    if (fetchingRef.current && !force) return; // Already in flight (bypass with force)
    fetchingRef.current = true;

    try {
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 5000)
      );
      const query = supabase
        .from('household_members')
        .select(`
          household_id,
          role,
          households (id, name, invite_code, created_by, created_at)
        `)
        .eq('user_id', user.id);

      const { data, error } = await Promise.race([query, timeout]);

      if (error) {
        console.error('[Household] Fetch error:', error.message);
      }

      if (data && data.length > 0) {
        const hhs = data.map((d) => ({ ...d.households, myRole: d.role }));
        setHouseholds(hhs);
        // Only auto-select if no household already selected
        setCurrentHousehold((prev) => prev ?? hhs[0]);
        await fetchMembers(hhs[0].id);
      } else if (force) {
        // Only clear if this is an explicit refresh, not a timeout
        setHouseholds([]);
        setCurrentHousehold(null);
      }
    } catch (err) {
      console.warn('[Household] Fetch aborted:', err.message);
      // Do NOT clear currentHousehold on timeout — keep existing state
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHouseholds();
  }, [fetchHouseholds]);

  const fetchMembers = async (householdId) => {
    if (!supabase) return;
    const { data } = await supabase
      .from('household_members')
      .select(`
        id, role, joined_at,
        profiles (id, display_name, avatar_emoji)
      `)
      .eq('household_id', householdId);

    if (data) {
      setMembers(data.map((m) => ({
        ...m.profiles,
        role: m.role,
        joinedAt: m.joined_at,
        memberId: m.id,
      })));
    }
  };

  const createHousehold = async (name) => {
    if (!user || !supabase) return { error: 'No user' };

    const { data: hh, error: hhErr } = await supabase
      .from('households')
      .insert({ name, created_by: user.id })
      .select()
      .single();

    if (hhErr) return { error: hhErr.message };

    const { error: memErr } = await supabase
      .from('household_members')
      .insert({
        household_id: hh.id,
        user_id: user.id,
        role: 'owner',
      });

    if (memErr) return { error: memErr.message };

    await fetchHouseholds();
    return { data: hh };
  };

  const joinHousehold = async (inviteCode) => {
    if (!user || !supabase) return { error: 'No user' };

    const { data: hh, error: findErr } = await supabase
      .from('households')
      .select('id, name')
      .eq('invite_code', inviteCode)
      .single();

    if (findErr || !hh) return { error: 'Código de invitación no válido' };

    const { data: existing } = await supabase
      .from('household_members')
      .select('id')
      .eq('household_id', hh.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) return { error: 'Ya eres miembro de este hogar' };

    const { error: joinErr } = await supabase
      .from('household_members')
      .insert({
        household_id: hh.id,
        user_id: user.id,
        role: 'member',
      });

    if (joinErr) return { error: joinErr.message };

    await fetchHouseholds();
    return { data: hh };
  };

  const leaveHousehold = async (householdId) => {
    if (!user || !supabase) return;
    await supabase
      .from('household_members')
      .delete()
      .eq('household_id', householdId)
      .eq('user_id', user.id);

    await fetchHouseholds();
  };

  const getInviteUrl = () => {
    if (!currentHousehold) return '';
    return `${window.location.origin}/unirse/${currentHousehold.invite_code}`;
  };

  const hasHousehold = households.length > 0;

  const value = {
    households,
    currentHousehold,
    members,
    loading,
    hasHousehold,
    createHousehold,
    joinHousehold,
    leaveHousehold,
    getInviteUrl,
    fetchHouseholds,
    selectHousehold: setCurrentHousehold,
  };

  return (
    <HouseholdContext.Provider value={value}>
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHousehold() {
  const context = useContext(HouseholdContext);
  if (!context) throw new Error('useHousehold must be used within HouseholdProvider');
  return context;
}
