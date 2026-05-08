import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useApp } from '../context/AppContext';
import { buildFinancialContext, getDashboardInsight } from '../services/gemini';
import { Card, MetricCard, InsightCard, ProgressBar, SectionTitle } from '../components/UI';
import { COLORS, SIZES, FONTS } from '../constants/theme';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const getExpenseDate = (expense) => new Date(expense.spent_at || expense.created_at);

export default function DashboardScreen() {
  const { session, profile, expenses, refreshExpenses, getTotalSpent, getBalance, formatMoney } = useApp();
  const [insight, setInsight] = useState('Loading your personalized insight...');
  const [insightLoading, setInsightLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const income = Number.parseFloat(profile?.income || 0);
  const spent = getTotalSpent();
  const balance = getBalance();
  const savingsTarget = Number.parseFloat(profile?.monthly_savings_target || 0);
  const budgetLimit = Number.parseFloat(profile?.budget_limit || 0);
  const goalPct =
    savingsTarget > 0
      ? Math.round((Math.max(0, balance) / savingsTarget) * 100)
      : income > 0
        ? Math.round((Math.max(0, balance) / income) * 100)
        : 0;
  const budgetPct = budgetLimit > 0 ? Math.round((spent / budgetLimit) * 100) : 0;

  const name = session?.user?.user_metadata?.full_name || 'there';
  const firstName = name.split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    loadInsight();
  }, [profile, expenses]);

  const loadInsight = async () => {
    if (!profile) return;
    setInsightLoading(true);
    try {
      const ctx = buildFinancialContext(session?.user, profile, expenses);
      const text = await getDashboardInsight(ctx, session?.access_token);
      setInsight(text);
    } catch {
      setInsight('Keep tracking your expenses to unlock personalized insights.');
    } finally {
      setInsightLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshExpenses();
    await loadInsight();
    setRefreshing(false);
  };

  const weeklyTotals = Array(7).fill(0);
  const now = new Date();
  const todayIdx = now.getDay() === 0 ? 6 : now.getDay() - 1;
  expenses.forEach((expense) => {
    const date = getExpenseDate(expense);
    const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diff >= 0 && diff < 7) {
      const idx = (todayIdx - (6 - diff) + 7) % 7;
      weeklyTotals[idx] += Number.parseFloat(expense.amount || 0);
    }
  });
  const maxWeekly = Math.max(...weeklyTotals, 1);
  const recent = [...expenses].slice(0, 5);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            {greeting}, {firstName}
          </Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{firstName[0]?.toUpperCase()}</Text>
        </View>
      </View>

      <Card style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Balance this month</Text>
        <Text style={[styles.balanceValue, balance < 0 && { color: COLORS.danger }]}>
          {formatMoney(balance)}
        </Text>
        <View style={{ marginTop: 12 }}>
          <View style={styles.goalRow}>
            <Text style={styles.goalLabel}>
              {savingsTarget > 0 ? 'Savings target progress' : 'Savings progress'}
            </Text>
            <Text style={styles.goalPct}>{goalPct}%</Text>
          </View>
          <ProgressBar pct={goalPct} />
        </View>
      </Card>

      <View style={styles.metricRow}>
        <MetricCard label="Income" value={formatMoney(income)} color={COLORS.success} style={{ marginRight: 8 }} />
        <MetricCard label="Spent" value={formatMoney(spent)} color={COLORS.danger} />
      </View>

      {budgetLimit > 0 && (
        <Card>
          <View style={styles.goalRow}>
            <Text style={styles.budgetLabel}>Monthly spending limit</Text>
            <Text style={[styles.budgetPct, budgetPct > 90 && { color: COLORS.danger }]}>
              {budgetPct}%
            </Text>
          </View>
          <ProgressBar pct={budgetPct} color={budgetPct > 90 ? COLORS.danger : COLORS.warning} />
          <Text style={styles.budgetHint}>
            {formatMoney(Math.max(0, budgetLimit - spent))} left before your limit.
          </Text>
        </Card>
      )}

      <InsightCard text={insight} loading={insightLoading} />

      <SectionTitle>Weekly spending</SectionTitle>
      <Card>
        <View style={styles.bars}>
          {weeklyTotals.map((value, index) => (
            <View key={DAYS[index]} style={styles.barCol}>
              <View
                style={[
                  styles.bar,
                  { height: Math.max(4, Math.round((value / maxWeekly) * 72)) },
                  index === todayIdx && styles.barToday,
                ]}
              />
              <Text style={[styles.barLabel, index === todayIdx && styles.barLabelToday]}>
                {DAYS[index]}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      <SectionTitle>Recent expenses</SectionTitle>
      <Card>
        {recent.length === 0 ? (
          <Text style={styles.empty}>No expenses yet. Add your first one.</Text>
        ) : (
          recent.map((expense, index) => (
            <View key={expense.id} style={[styles.expRow, index < recent.length - 1 && styles.expBorder]}>
              <View style={styles.expCatDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.expName}>{expense.merchant || expense.note || expense.category}</Text>
                <Text style={styles.expCat}>
                  {expense.category} · {getExpenseDate(expense).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.expAmt}>-{formatMoney(expense.amount)}</Text>
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: SIZES.lg, color: COLORS.textPrimary, ...FONTS.bold },
  date: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: SIZES.base, color: COLORS.primary, ...FONTS.semibold },
  balanceCard: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  balanceLabel: { fontSize: SIZES.sm, color: 'rgba(255,255,255,0.75)', ...FONTS.medium },
  balanceValue: { fontSize: 36, color: COLORS.white, ...FONTS.bold, marginTop: 4 },
  goalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  goalLabel: { fontSize: SIZES.xs, color: 'rgba(255,255,255,0.75)' },
  goalPct: { fontSize: SIZES.xs, color: COLORS.white, ...FONTS.semibold },
  budgetLabel: { fontSize: SIZES.sm, color: COLORS.textSecondary, ...FONTS.medium },
  budgetPct: { fontSize: SIZES.sm, color: COLORS.warning, ...FONTS.semibold },
  budgetHint: { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 8 },
  metricRow: { flexDirection: 'row', marginBottom: 14 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', height: 90 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: 90 },
  bar: { width: '65%', backgroundColor: '#CECBF6', borderRadius: 3 },
  barToday: { backgroundColor: COLORS.primary },
  barLabel: { fontSize: 9, color: COLORS.textMuted, marginTop: 5 },
  barLabelToday: { color: COLORS.primary, ...FONTS.semibold },
  expRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  expBorder: { borderBottomWidth: 0.5, borderBottomColor: COLORS.borderLight },
  expCatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: 12,
  },
  expName: { fontSize: SIZES.base, color: COLORS.textPrimary },
  expCat: { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  expAmt: { fontSize: SIZES.base, color: COLORS.danger, ...FONTS.semibold },
  empty: { fontSize: SIZES.base, color: COLORS.textSecondary, textAlign: 'center', paddingVertical: 10 },
});
