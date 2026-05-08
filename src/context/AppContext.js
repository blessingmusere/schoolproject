import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured, getProfile, getExpenses } from '../services/supabase';

const AppContext = createContext(null);

const getExpenseDate = (expense) => new Date(expense.spent_at || expense.created_at);
const toNumber = (value) => Number.parseFloat(value || 0) || 0;

export const AppProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

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
      const [prof, exps] = await Promise.all([getProfile(userId), getExpenses(userId)]);
      setProfile(prof);
      setExpenses(exps);
    } catch (e) {
      console.error('Load user data error:', e);
    } finally {
      setLoading(false);
    }
  };

  const refreshExpenses = async () => {
    if (!session) return [];
    const exps = await getExpenses(session.user.id);
    setExpenses(exps);
    return exps;
  };

  const refreshProfile = async () => {
    if (!session) return null;
    const prof = await getProfile(session.user.id);
    setProfile(prof);
    return prof;
  };

  const getMonthExpenses = () => {
    const now = new Date();
    return expenses.filter((expense) => {
      const date = getExpenseDate(expense);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
  };

  const getTotalSpent = () =>
    getMonthExpenses().reduce((sum, expense) => sum + toNumber(expense.amount), 0);

  const getBalance = () => toNumber(profile?.income) - getTotalSpent();

  const getCategoryTotals = () => {
    const totals = {};
    getMonthExpenses().forEach((expense) => {
      totals[expense.category] = (totals[expense.category] || 0) + toNumber(expense.amount);
    });
    return totals;
  };

  const formatMoney = (value) => {
    const currency = profile?.currency || 'USD';
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      }).format(toNumber(value));
    } catch {
      return `${currency} ${Math.round(toNumber(value)).toLocaleString()}`;
    }
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
        formatMoney,
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
