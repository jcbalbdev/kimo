import { supabase } from '../../lib/supabase';

/**
 * Look up a user's email by their KIMO code.
 * Uses a SECURITY DEFINER RPC because auth.users is not accessible from client.
 *
 * @param {string} code - The KIMO code (e.g. "A3F7K2")
 * @returns {{ email: string|null, error: string|null }}
 */
export async function resolveKimoCode(code) {
  if (!code || code.trim().length < 4) {
    return { email: null, error: 'Código KIMO inválido' };
  }

  const { data: email, error } = await supabase.rpc('lookup_email_by_kimo_code', {
    p_code: code.trim().toUpperCase(),
  });

  if (error) return { email: null, error: error.message };
  if (!email) return { email: null, error: 'No se encontró un usuario con ese código KIMO' };

  return { email, error: null };
}
