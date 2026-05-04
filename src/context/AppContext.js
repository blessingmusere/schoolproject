import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured, getProfile, getExpenses } from '../services/supabase';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Listen to auth state changes
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return undefined;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadUserData(session.user.id);
      else setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadUserData(session.user.id);
      else {
        setProfile(null);
        setExpenses([]);
        setLoading(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const loadUserData = async (userId) => {
    try {
      const [prof, exps] = await Promise.all([
        getProfile(userId),
        getExpenses(userId),
      ]);
      setProfile(prof);
      setExpenses(exps);
    } catch (e) {
      console.error('Load user data error:', e);
    } finally {
      setLoading(false);
    }
  };

  const refreshExpenses = async () => {
    if (!session) return;
    const exps = await getExpenses(session.user.id);
    setExpenses(exps);
  };

  const refreshProfile = async () => {
    if (!session) return;
    const prof = await getProfile(session.user.id);
    setProfile(prof);
  };

  // Computed helpers
  const getMonthExpenses = () => {
    const now = new Date();
    return expenses.filter((e) => {
      const d = new Date(e.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  };

  const getTotalSpent = () =>
    getMonthExpenses().reduce((sum, e) => sum + parseFloat(e.amount), 0);

  const getBalance = () => parseFloat(profile?.income || 0) - getTotalSpent();

  const getCategoryTotals = () => {
    const totals = {};
    getMonthExpenses().forEach((e) => {
      totals[e.category] = (totals[e.category] || 0) + parseFloat(e.amount);
    });
    return totals;
  };

  return (
    <AppContext.Provider
      value={{
        session,
        profile,
        expenses,
        loading,
        refreshExpenses,
        refreshProfile,
        getMonthExpenses,
        getTotalSpent,
        getBalance,
        getCategoryTotals,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};
