import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

const IS_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isInviteToken(code) {
  return IS_UUID.test(code);
}

export function useInvitations() {
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [loading, setLoading] = useState(true);

  /** Fetch invitations where the current user's email is the target */
  const fetchPending = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from('household_invitations')
      .select(`
        id, status, created_at, invited_email,
        households ( id, name ),
        inviter:profiles!invited_by ( display_name )
      `)
      .eq('invited_email', user.email)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    setPendingInvitations(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  /** Case 1 — invite by email (user already has account) */
  const inviteByEmail = async (householdId, email) => {
    const { data: { user } } = await supabase.auth.getUser();

    // Check if invitation already pending for same household+email
    const { data: existing } = await supabase
      .from('household_invitations')
      .select('id, status')
      .eq('household_id', householdId)
      .eq('invited_email', email.toLowerCase().trim())
      .eq('status', 'pending')
      .maybeSingle();

    if (existing) return { error: null, alreadySent: true };

    const { data, error } = await supabase
      .from('household_invitations')
      .insert({
        household_id: householdId,
        invited_by:   user.id,
        invited_email: email.toLowerCase().trim(),
      })
      .select()
      .single();

    return { data, error, alreadySent: false };
  };

  /** Case 2 — generate a shareable link (no email required) */
  const generateInviteLink = async (householdId) => {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('household_invitations')
      .insert({
        household_id: householdId,
        invited_by:   user.id,
        invited_email: null,
      })
      .select()
      .single();

    if (error) return { link: null, error };
    const link = `${window.location.origin}/unirse/${data.token}`;
    return { link, error: null };
  };

  /** Look up an invitation by its UUID token (for /unirse/:token page) */
  const getInvitationByToken = async (token) => {
    const { data, error } = await supabase
      .from('household_invitations')
      .select(`
        id, status, invited_email, token,
        households ( id, name ),
        inviter:profiles!invited_by ( display_name )
      `)
      .eq('token', token)
      .maybeSingle();

    return { data, error };
  };

  /** Accept an invitation — joins the household and marks status=accepted */
  const acceptInvitation = async (invId, householdId) => {
    const { data: { user } } = await supabase.auth.getUser();

    // Join household (ignore if already member)
    const { error: joinErr } = await supabase
      .from('household_members')
      .insert({ household_id: householdId, user_id: user.id, role: 'member' });

    if (joinErr && joinErr.code !== '23505') return { error: joinErr };

    // Mark invitation accepted
    const { error: updErr } = await supabase
      .from('household_invitations')
      .update({ status: 'accepted' })
      .eq('id', invId);

    if (updErr) return { error: updErr };

    await fetchPending();
    return { error: null };
  };

  /** Decline an invitation — marks status=declined, no notification sent */
  const declineInvitation = async (invId) => {
    await supabase
      .from('household_invitations')
      .update({ status: 'declined' })
      .eq('id', invId);

    await fetchPending();
  };

  return {
    pendingInvitations,
    loading,
    inviteByEmail,
    generateInviteLink,
    getInvitationByToken,
    acceptInvitation,
    declineInvitation,
    refetch: fetchPending,
  };
}
