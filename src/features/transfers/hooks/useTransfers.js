import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { resolveKimoCode } from '../../../shared/utils/kimoCode';

/**
 * Hook for managing pet transfers (incoming & outgoing).
 *
 * Uses getSession() (local, no network) instead of getUser()
 * to avoid Navigator Lock contention with other hooks.
 */
export function useTransfers() {
  const [incomingTransfers, setIncomingTransfers] = useState([]);
  const [outgoingTransfers, setOutgoingTransfers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper: get current user from session (no network call)
  const getSessionUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user ?? null;
  }, []);

  // ── Fetch incoming transfers (where I am the recipient) ──
  const fetchIncoming = useCallback(async () => {
    const user = await getSessionUser();
    if (!user) return;

    const { data } = await supabase
      .from('pet_transfers')
      .select(`
        id, status, created_at, to_email, token,
        pets ( id, name, species, avatar_emoji ),
        from_household:households!from_household ( id, name, type ),
        initiator:profiles!initiated_by ( display_name )
      `)
      .eq('to_email', user.email)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    setIncomingTransfers(data || []);
    setLoading(false);
  }, [getSessionUser]);

  // ── Fetch outgoing transfers (I initiated) ──
  const fetchOutgoing = useCallback(async () => {
    const user = await getSessionUser();
    if (!user) return;

    const { data } = await supabase
      .from('pet_transfers')
      .select(`
        id, status, created_at, to_email, completed_at,
        pets ( id, name, species, avatar_emoji ),
        to_household:households!to_household ( id, name )
      `)
      .eq('initiated_by', user.id)
      .in('status', ['pending', 'accepted'])
      .order('created_at', { ascending: false });

    setOutgoingTransfers(data || []);
  }, [getSessionUser]);

  // ── Initial fetch ──
  useEffect(() => {
    fetchIncoming();
    fetchOutgoing();
  }, [fetchIncoming, fetchOutgoing]);

  // ── Realtime: listen for new/updated transfers targeting me ──
  useEffect(() => {
    let channel;

    async function setupRealtime() {
      const user = await getSessionUser();
      if (!user?.email) return;

      channel = supabase
        .channel(`transfers-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'pet_transfers',
            filter: `to_email=eq.${user.email}`,
          },
          () => { fetchIncoming(); }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'pet_transfers',
            filter: `initiated_by=eq.${user.id}`,
          },
          () => { fetchOutgoing(); }
        )
        .subscribe();
    }

    setupRealtime();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [fetchIncoming, fetchOutgoing, getSessionUser]);

  // ── Initiate a transfer (by KIMO code) ──
  const initiateTransfer = async (petId, fromHouseholdId, kimoCode) => {
    const { email: recipientEmail, error: lookupErr } = await resolveKimoCode(kimoCode);
    if (lookupErr) return { error: { message: lookupErr }, alreadySent: false };

    const user = await getSessionUser();

    // Check duplicate pending transfer for same pet+email
    const { data: existing } = await supabase
      .from('pet_transfers')
      .select('id')
      .eq('pet_id', petId)
      .eq('to_email', recipientEmail.toLowerCase().trim())
      .eq('status', 'pending')
      .maybeSingle();

    if (existing) return { error: null, alreadySent: true };

    const { data, error } = await supabase
      .from('pet_transfers')
      .insert({
        pet_id: petId,
        from_household: fromHouseholdId,
        to_email: recipientEmail.toLowerCase().trim(),
        initiated_by: user.id,
      })
      .select()
      .single();

    if (!error) await fetchOutgoing();
    return { data, error, alreadySent: false };
  };

  // ── Accept a transfer (via RPC) ──
  const acceptTransfer = async (transferId, toHouseholdId) => {
    const { error } = await supabase.rpc('accept_pet_transfer', {
      p_transfer_id: transferId,
      p_to_household_id: toHouseholdId,
    });

    if (!error) await fetchIncoming();
    return { error };
  };

  // ── Decline a transfer ──
  const declineTransfer = async (transferId) => {
    const { error } = await supabase
      .from('pet_transfers')
      .update({ status: 'declined' })
      .eq('id', transferId);

    if (!error) await fetchIncoming();
    return { error };
  };

  // ── Cancel a transfer I initiated ──
  const cancelTransfer = async (transferId) => {
    const { error } = await supabase
      .from('pet_transfers')
      .update({ status: 'cancelled' })
      .eq('id', transferId);

    if (!error) await fetchOutgoing();
    return { error };
  };

  return {
    incomingTransfers,
    outgoingTransfers,
    loading,
    initiateTransfer,
    acceptTransfer,
    declineTransfer,
    cancelTransfer,
    refetchIncoming: fetchIncoming,
    refetchOutgoing: fetchOutgoing,
  };
}
