import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';

/**
 * useDirectory
 * Fetches organizations visible in the KIMO showcase and
 * provides a function to update an org's directory profile.
 */
export function useDirectory() {
  const [organizations, setOrganizations] = useState([]);
  const [loadingDir, setLoadingDir]       = useState(true);

  const fetchOrganizations = useCallback(async () => {
    setLoadingDir(true);
    const { data } = await supabase
      .from('public_organizations')
      .select('*')
      .order('created_at', { ascending: false });
    setOrganizations(data || []);
    setLoadingDir(false);
  }, []);

  useEffect(() => { fetchOrganizations(); }, [fetchOrganizations]);

  /**
   * Update an organization's directory profile.
   * @param {string} householdId
   * @param {object} fields  — any subset of directory_* columns
   */
  const updateDirectoryProfile = async (householdId, fields) => {
    const { error } = await supabase
      .from('households')
      .update(fields)
      .eq('id', householdId);
    if (!error) await fetchOrganizations();
    return { error };
  };

  return { organizations, loadingDir, fetchOrganizations, updateDirectoryProfile };
}
