import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { addExpense } from '../services/supabase';
import { useApp } from '../context/AppContext';
import { Button, Input, Card } from '../components/UI';
import { COLORS, SIZES, FONTS } from '../constants/theme';

const CATEGORIES = [
  { label: 'Food', icon: '🍔' },
  { label: 'Transport', icon: '🚗' },
  { label: 'Rent', icon: '🏠' },
  { label: 'Airtime/Data', icon: '📱' },
  { label: 'Shopping', icon: '🛍️' },
  { label: 'Entertainment', icon: '🎬' },
  { label: 'Health', icon: '💊' },
  { label: 'Other', icon: '📌' },
];

export default function AddExpenseScreen() {
  const { session, refreshExpenses } = useApp();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [amountError, setAmountError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleAdd = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setAmountError('Please enter a valid amount');
      return;
    }
    setAmountError('');
    setLoading(true);
    try {
      await addExpense(session.user.id, {
        amount: parseFloat(amount),
        category,
        note: note.trim(),
      });
      await refreshExpenses();
      setAmount('');
      setNote('');
      setCategory('Food');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Add expense</Text>

        {success && (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>✓ Expense saved successfully!</Text>
          </View>
        )}

        <Input
          label="Amount ($)"
          value={amount}
          onChangeText={(v) => { setAmount(v); setAmountError(''); }}
          placeholder="0.00"
          keyboardType="decimal-pad"
          error={amountError}
        />

        <Text style={styles.catLabel}>Category</Text>
        <View style={styles.catGrid}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.label}
              style={[styles.catCard, category === c.label && styles.catCardSelected]}
              onPress={() => setCategory(c.label)}
              activeOpacity={0.75}
            >
              <Text style={styles.catIcon}>{c.icon}</Text>
              <Text style={[styles.catText, category === c.label && styles.catTextSelected]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input
          label="Note (optional)"
          value={note}
          onChangeText={setNote}
          placeholder="What was this for?"
          style={{ marginTop: 16 }}
        />

        <Button title="Save expense" onPress={handleAdd} loading={loading} style={{ marginTop: 8 }} />

        <Card style={styles.tipCard}>
          <Text style={styles.tipTitle}>💡 Tip</Text>
          <Text style={styles.tipText}>Log expenses right after spending to keep your data accurate.</Text>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: SIZES.xl, color: COLORS.textPrimary, ...FONTS.bold, marginBottom: 20 },
  successBanner: {
    backgroundColor: COLORS.successLight,
    borderRadius: SIZES.radiusSm,
    padding: 12,
    marginBottom: 16,
  },
  successText: { color: COLORS.success, fontSize: SIZES.base, ...FONTS.medium },
  catLabel: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginBottom: 10, ...FONTS.medium },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catCard: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  catCardSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  catIcon: { fontSize: 22, marginBottom: 4 },
  catText: { fontSize: 10, color: COLORS.textSecondary, textAlign: 'center' },
  catTextSelected: { color: COLORS.primary, ...FONTS.semibold },
  tipCard: { marginTop: 20, backgroundColor: COLORS.warningLight, borderColor: COLORS.warningLight },
  tipTitle: { fontSize: SIZES.sm, ...FONTS.semibold, color: COLORS.warning, marginBottom: 4 },
  tipText: { fontSize: SIZES.sm, color: COLORS.textSecondary, lineHeight: 18 },
});
