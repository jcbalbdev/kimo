import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false);
  const lastFetchedId = useRef(null);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const newUser = session?.user ?? null;
        setUser(newUser);
        if (newUser) {
          // Skip if already fetched/fetching for this user
          if (lastFetchedId.current === newUser.id && !fetchingRef.current) return;
          await fetchProfile(newUser.id);
        } else {
          setProfile(null);
          setLoading(false);
          lastFetchedId.current = null;
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    if (!supabase) { setLoading(false); return; }
    // Don't re-fetch if already fetching or already fetched for this user
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    lastFetchedId.current = userId;
    try {
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 5000)
      );
      const query = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const { data, error } = await Promise.race([query, timeout]);

      if (error) {
        console.warn('[Auth] Profile error:', error.message);
        setProfile(null);
      } else if (data) {
        setProfile(data);
      }
    } catch (err) {
      console.warn('[Auth] Profile fetch aborted:', err.message);
      setProfile(null);
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email, password, displayName) => {
    if (!supabase) return { error: { message: 'Supabase no configurado' } };
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: displayName },
      },
    });
    return { data, error };
  };

  const signInWithEmail = async (email, password) => {
    if (!supabase) return { error: { message: 'Supabase no configurado' } };
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signInWithGoogle = async () => {
    if (!supabase) return { error: { message: 'Supabase no configurado' } };
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    return { data, error };
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (updates) => {
    if (!user || !supabase) return { error: 'No user' };
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (data) setProfile(data);
    return { data, error };
  };

  const resetPasswordForEmail = async (email, redirectTo) => {
    if (!supabase) return { error: { message: 'Supabase no configurado' } };
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    return { data, error };
  };

  const updatePassword = async (newPassword) => {
    if (!supabase) return { error: { message: 'Supabase no configurado' } };
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { data, error };
  };

  const value = {
    user,
    profile,
    loading,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    signOut,
    updateProfile,
    resetPasswordForEmail,
    updatePassword,
    isAuthenticated: !!user,
    isConfigured: isSupabaseConfigured,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
