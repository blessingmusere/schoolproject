import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addExpense, deleteExpense, updateExpense } from '../services/supabase';
import { useApp } from '../context/AppContext';
import { Button, Input, Card } from '../components/UI';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../constants/finance';

const toDateInput = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
};

const newForm = () => ({
  amount: '',
  category: 'Food',
  merchant: '',
  payment_method: 'Cash',
  note: '',
  spent_at: toDateInput(),
});

export default function AddExpenseScreen() {
  const { session, expenses, refreshExpenses, formatMoney } = useApp();
  const [form, setForm] = useState(newForm());
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [amountError, setAmountError] = useState('');
  const [success, setSuccess] = useState('');

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === 'amount') setAmountError('');
  };

  const resetForm = () => {
    setForm(newForm());
    setEditingId(null);
    setAmountError('');
  };

  const handleEdit = (expense) => {
    setEditingId(expense.id);
    setForm({
      amount: String(expense.amount || ''),
      category: expense.category || 'Food',
      merchant: expense.merchant || '',
      payment_method: expense.payment_method || 'Cash',
      note: expense.note || '',
      spent_at: toDateInput(expense.spent_at || expense.created_at),
    });
  };

  const handleSave = async () => {
    if (!form.amount || Number.parseFloat(form.amount) <= 0) {
      setAmountError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        amount: Number.parseFloat(form.amount),
        spent_at: form.spent_at,
      };
      if (editingId) {
        await updateExpense(editingId, payload);
        setSuccess('Expense updated successfully.');
      } else {
        await addExpense(session.user.id, payload);
        setSuccess('Expense saved successfully.');
      }
      await refreshExpenses();
      resetForm();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (expense) => {
    Alert.alert('Delete expense?', 'This removes the expense from your records.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteExpense(expense.id);
            await refreshExpenses();
            if (editingId === expense.id) resetForm();
          } catch (err) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  const recent = expenses.slice(0, 8);

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
        <View style={styles.headerRow}>
          <Text style={styles.title}>{editingId ? 'Edit expense' : 'Add expense'}</Text>
          {editingId && (
            <TouchableOpacity onPress={resetForm} style={styles.clearBtn}>
              <Text style={styles.clearText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>

        {!!success && (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>{success}</Text>
          </View>
        )}

        <Input
          label="Amount"
          value={form.amount}
          onChangeText={(value) => setField('amount', value)}
          placeholder="0.00"
          keyboardType="decimal-pad"
          error={amountError}
        />

        <Text style={styles.catLabel}>Category</Text>
        <View style={styles.catGrid}>
          {EXPENSE_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.label}
              style={[styles.catCard, form.category === category.label && styles.catCardSelected]}
              onPress={() => setField('category', category.label)}
              activeOpacity={0.75}
            >
              <Ionicons
                name={category.icon}
                size={22}
                color={form.category === category.label ? COLORS.primary : COLORS.textSecondary}
              />
              <Text style={[styles.catText, form.category === category.label && styles.catTextSelected]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input
          label="Merchant"
          value={form.merchant}
          onChangeText={(value) => setField('merchant', value)}
          placeholder="Store, person, or service"
          style={{ marginTop: 16 }}
        />

        <Input
          label="Date"
          value={form.spent_at}
          onChangeText={(value) => setField('spent_at', value)}
          placeholder="YYYY-MM-DD"
        />

        <Text style={styles.catLabel}>Payment method</Text>
        <View style={styles.methodWrap}>
          {PAYMENT_METHODS.map((method) => (
            <TouchableOpacity
              key={method}
              style={[styles.methodChip, form.payment_method === method && styles.methodChipSelected]}
              onPress={() => setField('payment_method', method)}
            >
              <Text
                style={[
                  styles.methodText,
                  form.payment_method === method && styles.methodTextSelected,
                ]}
              >
                {method}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input
          label="Note"
          value={form.note}
          onChangeText={(value) => setField('note', value)}
          placeholder="What was this for?"
          style={{ marginTop: 16 }}
        />

        <Button
          title={editingId ? 'Update expense' : 'Save expense'}
          onPress={handleSave}
          loading={loading}
          style={{ marginTop: 8 }}
        />

        <Text style={[styles.title, styles.recentTitle]}>Recent expenses</Text>
        <Card>
          {recent.length === 0 ? (
            <Text style={styles.empty}>No expenses yet.</Text>
          ) : (
            recent.map((expense, index) => (
              <View
                key={expense.id}
                style={[styles.expRow, index < recent.length - 1 && styles.expBorder]}
              >
                <View style={styles.expInfo}>
                  <Text style={styles.expName}>{expense.merchant || expense.note || expense.category}</Text>
                  <Text style={styles.expMeta}>
                    {expense.category} · {toDateInput(expense.spent_at || expense.created_at)}
                  </Text>
                </View>
                <Text style={styles.expAmt}>{formatMoney(expense.amount)}</Text>
                <TouchableOpacity onPress={() => handleEdit(expense)} style={styles.iconBtn}>
                  <Ionicons name="create-outline" size={18} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(expense)} style={styles.iconBtn}>
                  <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: SIZES.xl, color: COLORS.textPrimary, ...FONTS.bold, marginBottom: 20 },
  clearBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  clearText: { color: COLORS.primary, ...FONTS.medium },
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
  catText: { fontSize: 10, color: COLORS.textSecondary, textAlign: 'center', marginTop: 4 },
  catTextSelected: { color: COLORS.primary, ...FONTS.semibold },
  methodWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  methodChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    marginRight: 8,
    marginBottom: 8,
  },
  methodChipSelected: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  methodText: { color: COLORS.textSecondary, fontSize: SIZES.sm },
  methodTextSelected: { color: COLORS.primary, ...FONTS.medium },
  recentTitle: { marginTop: 26, marginBottom: 12 },
  expRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  expBorder: { borderBottomWidth: 0.5, borderBottomColor: COLORS.borderLight },
  expInfo: { flex: 1, paddingRight: 8 },
  expName: { fontSize: SIZES.base, color: COLORS.textPrimary },
  expMeta: { fontSize: SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  expAmt: { fontSize: SIZES.base, color: COLORS.danger, ...FONTS.semibold, marginRight: 4 },
  iconBtn: { padding: 8 },
  empty: { fontSize: SIZES.base, color: COLORS.textSecondary, textAlign: 'center', paddingVertical: 10 },
});
