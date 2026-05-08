import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { saveProfile } from '../services/supabase';
import { scheduleDailyReminder } from '../services/notifications';
import { useApp } from '../context/AppContext';
import { Button, Input, Chip, ProgressBar } from '../components/UI';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { CURRENCIES, EXPENSE_CATEGORIES, addUniqueValue, normalizeListValue } from '../constants/finance';

const BASE_STEPS = [
  {
    key: 'income',
    title: 'What is your monthly income?',
    subtitle: 'This helps us calculate your saving rate and budget.',
    type: 'number',
    placeholder: 'e.g. 1500',
  },
  {
    key: 'currency',
    title: 'Which currency do you use?',
    subtitle: 'Pick one or add your own currency code.',
    type: 'single-chip',
  },
  {
    key: 'categories',
    title: 'Main expense categories',
    subtitle: 'Select your spending categories or add your own.',
    type: 'multi-chip',
  },
  {
    key: 'goal',
    title: 'What is your financial goal?',
    subtitle: 'Pick the one that matters most right now.',
    type: 'single-chip',
    options: ['Save money', 'Reduce spending', 'Buy something specific', 'Build emergency fund', 'Pay off debt'],
  },
  {
    key: 'monthlySavingsTarget',
    title: 'Monthly savings target',
    subtitle: 'Set a realistic amount to protect before spending.',
    type: 'number',
    placeholder: 'e.g. 300',
  },
  {
    key: 'weaknesses',
    title: 'Your financial weaknesses',
    subtitle: 'Honest answers help us give better advice.',
    type: 'multi-chip',
    options: ['Overspending', 'No budgeting', 'Impulse buying', 'Eating out too much', 'No savings habit'],
  },
  {
    key: 'reminderTime',
    title: 'When should we remind you?',
    subtitle: 'Daily reminders help you log expenses consistently.',
    type: 'single-chip',
    options: ['Morning (8am)', 'Midday (12pm)', 'Evening (6pm)', 'Night (9pm)'],
  },
];

export default function OnboardingScreen() {
  const { session, refreshProfile, completeProfile } = useApp();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [inputValue, setInputValue] = useState('');
  const [customValue, setCustomValue] = useState('');
  const [currencyOptions, setCurrencyOptions] = useState(CURRENCIES);
  const [categoryOptions, setCategoryOptions] = useState(
    EXPENSE_CATEGORIES.map((category) => category.label),
  );
  const [loading, setLoading] = useState(false);

  const steps = useMemo(
    () =>
      BASE_STEPS.map((item) => {
        if (item.key === 'currency') return { ...item, options: currencyOptions };
        if (item.key === 'categories') return { ...item, options: categoryOptions };
        return item;
      }),
    [currencyOptions, categoryOptions],
  );

  const current = steps[step];
  const isLast = step === steps.length - 1;
  const selectedCurrency = answers.currency?.[0] || 'USD';

  const toggleChip = (val) => {
    const key = current.key;
    if (current.type === 'single-chip') {
      setAnswers({ ...answers, [key]: [val] });
    } else {
      const cur = answers[key] || [];
      const idx = cur.indexOf(val);
      const next = idx > -1 ? cur.filter((v) => v !== val) : [...cur, val];
      setAnswers({ ...answers, [key]: next });
    }
  };

  const addCustomOption = () => {
    const normalized =
      current.key === 'currency'
        ? normalizeListValue(customValue).toUpperCase()
        : normalizeListValue(customValue);
    if (!normalized) return;

    if (current.key === 'currency') {
      setCurrencyOptions((prev) => addUniqueValue(prev, normalized));
      setAnswers({ ...answers, currency: [normalized] });
    }

    if (current.key === 'categories') {
      setCategoryOptions((prev) => addUniqueValue(prev, normalized));
      setAnswers((prev) => ({
        ...prev,
        categories: addUniqueValue(prev.categories || [], normalized),
      }));
    }

    setCustomValue('');
  };

  const isSelected = (val) => (answers[current.key] || []).includes(val);

  const canProceed = () => {
    if (current.type === 'number') {
      const value = Number.parseFloat(inputValue);
      if (current.key === 'income') return value > 0;
      return value >= 0;
    }
    return (answers[current.key] || []).length > 0;
  };

  const handleNext = async () => {
    if (!canProceed()) {
      Alert.alert('Please complete this step', 'Fill in the field or select an option to continue.');
      return;
    }

    const newAnswers = { ...answers };
    if (current.type === 'number') {
      newAnswers[current.key] = Number.parseFloat(inputValue);
      setInputValue('');
    }

    if (isLast) {
      setLoading(true);
      try {
        const profile = {
          user_id: session.user.id,
          income: newAnswers.income,
          currency: newAnswers.currency?.[0] || 'USD',
          categories: newAnswers.categories,
          goal: newAnswers.goal?.[0],
          monthly_savings_target: newAnswers.monthlySavingsTarget,
          budget_limit: Math.max(0, newAnswers.income - newAnswers.monthlySavingsTarget),
          weaknesses: newAnswers.weaknesses,
          reminder_time: newAnswers.reminderTime?.[0],
          updated_at: new Date().toISOString(),
        };
        await saveProfile(session.user.id, profile);
        completeProfile(profile);
        scheduleDailyReminder(profile.reminder_time).catch((error) => {
          console.warn('Reminder scheduling skipped:', error?.message || error);
        });
        refreshProfile().catch((error) => {
          console.warn('Profile refresh skipped:', error?.message || error);
        });
      } catch (err) {
        Alert.alert('Error', err.message);
      } finally {
        setLoading(false);
      }
    } else {
      setAnswers(newAnswers);
      setCustomValue('');
      setStep(step + 1);
    }
  };

  const pct = Math.round((step / steps.length) * 100);
  const numberLabel = current.key === 'income' || current.key === 'monthlySavingsTarget'
    ? `Amount (${selectedCurrency})`
    : 'Amount';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepLabel}>
          Step {step + 1} of {steps.length}
        </Text>
        <ProgressBar pct={pct} />
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.subtitle}>{current.subtitle}</Text>

        {current.type === 'number' && (
          <Input
            label={numberLabel}
            value={inputValue}
            onChangeText={setInputValue}
            placeholder={current.placeholder}
            keyboardType="decimal-pad"
          />
        )}

        {(current.type === 'single-chip' || current.type === 'multi-chip') && (
          <>
            <View style={styles.chipWrap}>
              {current.options.map((opt) => (
                <Chip key={opt} label={opt} selected={isSelected(opt)} onPress={() => toggleChip(opt)} />
              ))}
            </View>

            {(current.key === 'currency' || current.key === 'categories') && (
              <View style={styles.customBox}>
                <Input
                  label={current.key === 'currency' ? 'Add currency code' : 'Add custom category'}
                  value={customValue}
                  onChangeText={setCustomValue}
                  placeholder={current.key === 'currency' ? 'e.g. MZN' : 'e.g. School fees'}
                  autoCapitalize={current.key === 'currency' ? 'characters' : 'sentences'}
                  style={{ marginBottom: 10 }}
                />
                <Button
                  title={current.key === 'currency' ? 'Add currency' : 'Add category'}
                  variant="secondary"
                  onPress={addCustomOption}
                  disabled={!customValue.trim()}
                />
              </View>
            )}
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step > 0 && (
          <Button
            title="Back"
            variant="secondary"
            onPress={() => {
              setCustomValue('');
              setStep(step - 1);
            }}
            style={{ marginBottom: 10 }}
          />
        )}
        <Button title={isLast ? 'Get started' : 'Continue'} onPress={handleNext} loading={loading} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 10 },
  stepLabel: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginBottom: 8, ...FONTS.medium },
  body: { flexGrow: 1, padding: 24 },
  title: { fontSize: 24, color: COLORS.textPrimary, ...FONTS.bold, marginBottom: 8 },
  subtitle: { fontSize: SIZES.base, color: COLORS.textSecondary, marginBottom: 28, lineHeight: 22 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  customBox: {
    marginTop: 18,
    padding: 14,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  footer: { padding: 24, paddingBottom: 36 },
});
