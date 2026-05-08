import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useApp } from '../context/AppContext';
import { buildFinancialContext, getWeeklySummary } from '../services/gemini';
import { Card, ProgressBar, Button, SectionTitle } from '../components/UI';
import { COLORS, SIZES, FONTS } from '../constants/theme';

const CAT_COLORS = [COLORS.primary, COLORS.success, COLORS.warning, COLORS.danger, '#9B59B6', '#1ABC9C'];

export default function InsightsScreen() {
  const { session, profile, expenses, getCategoryTotals, getTotalSpent, formatMoney } = useApp();
  const [summary, setSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);

  const income = Number.parseFloat(profile?.income || 0);
  const spent = getTotalSpent();
  const saved = Math.max(0, income - spent);
  const savingRate = income > 0 ? Math.round((saved / income) * 100) : 0;
  const budgetLimit = Number.parseFloat(profile?.budget_limit || 0);
  const dailyLimit = budgetLimit > 0 ? Math.max(0, (budgetLimit - spent) / Math.max(1, daysLeftInMonth())) : 0;
  const catTotals = getCategoryTotals();
  const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
  const topCategory = sortedCats[0];

  const handleGetSummary = async () => {
    setSummaryLoading(true);
    try {
      const ctx = buildFinancialContext(session?.user, profile, expenses);
      const text = await getWeeklySummary(ctx, session?.access_token);
      setSummary(text);
    } catch {
      setSummary('Could not generate summary. Check your internet connection and AI configuration.');
    } finally {
      setSummaryLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Insights</Text>

      <SectionTitle>This month</SectionTitle>
      <View style={styles.row}>
        <Card style={[styles.overviewCard, { marginRight: 8 }]}>
          <Text style={styles.overviewLabel}>Saved</Text>
          <Text style={[styles.overviewValue, { color: COLORS.success }]}>{formatMoney(saved)}</Text>
          <Text style={styles.overviewSub}>{savingRate}% of income</Text>
        </Card>
        <Card style={styles.overviewCard}>
          <Text style={styles.overviewLabel}>Spent</Text>
          <Text style={[styles.overviewValue, { color: COLORS.danger }]}>{formatMoney(spent)}</Text>
          <Text style={styles.overviewSub}>{income > 0 ? Math.round((spent / income) * 100) : 0}% of income</Text>
        </Card>
      </View>

      <SectionTitle>Next best action</SectionTitle>
      <Card>
        <Text style={styles.actionText}>{buildActionText(topCategory, spent, budgetLimit, dailyLimit, formatMoney)}</Text>
      </Card>

      <SectionTitle>Spending breakdown</SectionTitle>
      <Card>
        {sortedCats.length === 0 ? (
          <Text style={styles.empty}>No expenses this month yet.</Text>
        ) : (
          sortedCats.map(([cat, amt], index) => {
            const pct = spent > 0 ? Math.round((amt / spent) * 100) : 0;
            return (
              <View key={cat} style={styles.catRow}>
                <View style={styles.catMeta}>
                  <Text style={styles.catName}>{cat}</Text>
                  <Text style={styles.catAmt}>
                    {formatMoney(amt)} <Text style={styles.catPct}>{pct}%</Text>
                  </Text>
                </View>
                <ProgressBar pct={pct} color={CAT_COLORS[index % CAT_COLORS.length]} />
              </View>
            );
          })
        )}
      </Card>

      {profile?.goal && (
        <>
          <SectionTitle>Your goal</SectionTitle>
          <Card>
            <Text style={styles.goalTitle}>{profile.goal}</Text>
            <View style={{ marginTop: 10 }}>
              <View style={styles.goalRow}>
                <Text style={styles.goalLabel}>Progress towards saving</Text>
                <Text style={styles.goalPct}>{savingRate}%</Text>
              </View>
              <ProgressBar pct={savingRate} />
            </View>
          </Card>
        </>
      )}

      <SectionTitle>AI weekly summary</SectionTitle>
      <Card>
        {summaryLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.loadingText}>Generating your summary...</Text>
          </View>
        ) : summary ? (
          <>
            <Text style={styles.summaryText}>{summary}</Text>
            <Button title="Regenerate" variant="secondary" onPress={handleGetSummary} style={styles.regenBtn} />
          </>
        ) : (
          <Button title="Get AI weekly summary" onPress={handleGetSummary} />
        )}
      </Card>
    </ScrollView>
  );
}

const daysLeftInMonth = () => {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return lastDay - now.getDate() + 1;
};

const buildActionText = (topCategory, spent, budgetLimit, dailyLimit, formatMoney) => {
  if (!spent) return 'Log your first few expenses so SmartSense can find patterns worth acting on.';
  if (budgetLimit > 0 && spent > budgetLimit) {
    return `You are over your spending limit. Pause non-essential purchases and review the largest category today.`;
  }
  if (budgetLimit > 0) {
    return `Keep daily spending near ${formatMoney(dailyLimit)} for the rest of the month to stay inside your limit.`;
  }
  if (topCategory) {
    return `${topCategory[0]} is your biggest category this month. Set a simple cap before the next purchase.`;
  }
  return 'Keep tracking daily expenses; consistency is the quickest path to useful advice.';
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: SIZES.xl, color: COLORS.textPrimary, ...FONTS.bold, marginBottom: 20 },
  row: { flexDirection: 'row', marginBottom: 14 },
  overviewCard: { flex: 1, marginBottom: 0 },
  overviewLabel: { fontSize: SIZES.xs, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  overviewValue: { fontSize: 22, ...FONTS.bold, marginTop: 4 },
  overviewSub: { fontSize: SIZES.xs, color: COLORS.textMuted, marginTop: 2 },
  actionText: { fontSize: SIZES.base, color: COLORS.textPrimary, lineHeight: 22 },
  catRow: { marginBottom: 14 },
  catMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  catName: { fontSize: SIZES.base, color: COLORS.textPrimary },
  catAmt: { fontSize: SIZES.base, color: COLORS.textPrimary, ...FONTS.medium },
  catPct: { fontSize: SIZES.sm, color: COLORS.textSecondary, ...FONTS.regular },
  goalTitle: { fontSize: SIZES.md, color: COLORS.primary, ...FONTS.semibold },
  goalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  goalLabel: { fontSize: SIZES.sm, color: COLORS.textSecondary },
  goalPct: { fontSize: SIZES.sm, color: COLORS.primary, ...FONTS.semibold },
  loadingWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  loadingText: { fontSize: SIZES.base, color: COLORS.textSecondary },
  summaryText: { fontSize: SIZES.base, color: COLORS.textPrimary, lineHeight: 24, marginBottom: 14 },
  regenBtn: { height: 40 },
  empty: { fontSize: SIZES.base, color: COLORS.textSecondary, textAlign: 'center', paddingVertical: 10 },
});
