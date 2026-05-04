import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const hasValidSupabaseUrl = /^https:\/\/.+\.supabase\.co$/.test(supabaseUrl || '');

const getAuthRedirectUrl = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/auth/callback`;
  }

  return Linking.createURL('auth/callback');
};

export const supabaseConfigError = !supabaseUrl
  ? 'Missing EXPO_PUBLIC_SUPABASE_URL. Create a .env file and add your Supabase project URL.'
  : !hasValidSupabaseUrl
    ? 'EXPO_PUBLIC_SUPABASE_URL must look like https://your-project-ref.supabase.co.'
    : !supabaseAnonKey
      ? 'Missing EXPO_PUBLIC_SUPABASE_ANON_KEY. Add your Supabase anon key to .env.'
      : null;

export const isSupabaseConfigured = !supabaseConfigError;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
      },
    })
  : null;

const requireSupabase = () => {
  if (!supabase) {
    throw new Error(supabaseConfigError);
  }

  return supabase;
};

// ── Auth helpers ──────────────────────────────────────────────

export const signUp = async (email, password, name) => {
  const client = requireSupabase();
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: getAuthRedirectUrl(),
    },
  });
  if (error) throw error;
  return data;
};

export const signIn = async (email, password) => {
  const client = requireSupabase();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const client = requireSupabase();
  const { error } = await client.auth.signOut();
  if (error) throw error;
};

export const getSession = async () => {
  const client = requireSupabase();
  const { data: { session } } = await client.auth.getSession();
  return session;
};

// ── Profile helpers ───────────────────────────────────────────

export const saveProfile = async (userId, profile) => {
  const client = requireSupabase();
  const { error } = await client
    .from('profiles')
    .upsert({ user_id: userId, ...profile, updated_at: new Date().toISOString() });
  if (error) throw error;
};

export const getProfile = async (userId) => {
  const client = requireSupabase();
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

// ── Expense helpers ───────────────────────────────────────────

export const addExpense = async (userId, expense) => {
  const client = requireSupabase();
  const { data, error } = await client
    .from('expenses')
    .insert({ user_id: userId, ...expense })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const getExpenses = async (userId) => {
  const client = requireSupabase();
  const { data, error } = await client
    .from('expenses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const deleteExpense = async (expenseId) => {
  const client = requireSupabase();
  const { error } = await client
    .from('expenses')
    .delete()
    .eq('id', expenseId);
  if (error) throw error;
};
