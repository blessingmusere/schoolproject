import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useApp } from '../context/AppContext';
import { buildFinancialContext, getWeeklySummary } from '../services/gemini';
import { Card, ProgressBar, Button, SectionTitle } from '../components/UI';
import { COLORS, SIZES, FONTS } from '../constants/theme';

const fmt = (n) => '$' + Math.round(n).toLocaleString();

const CAT_COLORS = [COLORS.primary, COLORS.success, COLORS.warning, '#E24B4A', '#9B59B6', '#1ABC9C'];

export default function InsightsScreen() {
  const { session, profile, expenses, getCategoryTotals, getTotalSpent } = useApp();
  const [summary, setSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);

  const income = parseFloat(profile?.income || 0);
  const spent = getTotalSpent();
  const saved = Math.max(0, income - spent);
  const savingRate = income > 0 ? Math.round((saved / income) * 100) : 0;
  const catTotals = getCategoryTotals();
  const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);

  const handleGetSummary = async () => {
    setSummaryLoading(true);
    try {
      const ctx = buildFinancialContext(session?.user, profile, expenses);
      const text = await getWeeklySummary(ctx);
      setSummary(text);
    } catch {
      setSummary('Could not generate summary. Check your internet connection and API key.');
    } finally {
      setSummaryLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Insights</Text>

      {/* Monthly overview */}
      <SectionTitle>This month</SectionTitle>
      <View style={styles.row}>
        <Card style={[styles.overviewCard, { marginRight: 8 }]}>
          <Text style={styles.overviewLabel}>Saved</Text>
          <Text style={[styles.overviewValue, { color: COLORS.success }]}>{fmt(saved)}</Text>
          <Text style={styles.overviewSub}>{savingRate}% of income</Text>
        </Card>
        <Card style={styles.overviewCard}>
          <Text style={styles.overviewLabel}>Spent</Text>
          <Text style={[styles.overviewValue, { color: COLORS.danger }]}>{fmt(spent)}</Text>
          <Text style={styles.overviewSub}>{income > 0 ? Math.round((spent / income) * 100) : 0}% of income</Text>
        </Card>
      </View>

      {/* Spending by category */}
      <SectionTitle>Spending breakdown</SectionTitle>
      <Card>
        {sortedCats.length === 0 ? (
          <Text style={styles.empty}>No expenses this month yet.</Text>
        ) : (
          sortedCats.map(([cat, amt], i) => {
            const pct = spent > 0 ? Math.round((amt / spent) * 100) : 0;
            return (
              <View key={cat} style={styles.catRow}>
                <View style={styles.catMeta}>
                  <Text style={styles.catName}>{cat}</Text>
                  <Text style={styles.catAmt}>{fmt(amt)} <Text style={styles.catPct}>{pct}%</Text></Text>
                </View>
                <ProgressBar pct={pct} color={CAT_COLORS[i % CAT_COLORS.length]} />
              </View>
            );
          })
        )}
      </Card>

      {/* Goal progress */}
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

      {/* AI Weekly Summary */}
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
            <Button
              title="Regenerate ↗"
              variant="secondary"
              onPress={handleGetSummary}
              style={styles.regenBtn}
            />
          </>
        ) : (
          <Button title="Get AI weekly summary ↗" onPress={handleGetSummary} />
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: SIZES.xl, color: COLORS.textPrimary, ...FONTS.bold, marginBottom: 20 },
  row: { flexDirection: 'row', marginBottom: 14 },
  overviewCard: { flex: 1, marginBottom: 0 },
  overviewLabel: { fontSize: SIZES.xs, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  overviewValue: { fontSize: 22, ...FONTS.bold, marginTop: 4 },
  overviewSub: { fontSize: SIZES.xs, color: COLORS.textMuted, marginTop: 2 },
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
