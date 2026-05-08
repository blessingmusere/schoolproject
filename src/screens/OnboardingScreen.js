import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
} from 'react-native';
import { saveProfile } from '../services/supabase';
import { scheduleDailyReminder } from '../services/notifications';
import { useApp } from '../context/AppContext';
import { Button, Input, Chip, ProgressBar } from '../components/UI';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { CURRENCIES } from '../constants/finance';

const STEPS = [
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
    subtitle: 'SmartSense will format your dashboard and insights with this currency.',
    type: 'single-chip',
    options: CURRENCIES,
  },
  {
    key: 'categories',
    title: 'Main expense categories',
    subtitle: 'Select all that apply to your spending.',
    type: 'multi-chip',
    options: ['Transport', 'Food', 'Rent', 'Airtime/Data', 'Shopping', 'Entertainment', 'Health', 'Other'],
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
  const { session, refreshProfile } = useApp();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

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

  const isSelected = (val) => (answers[current.key] || []).includes(val);

  const canProceed = () => {
    if (current.type === 'number') return inputValue && parseFloat(inputValue) > 0;
    return (answers[current.key] || []).length > 0;
  };

  const handleNext = async () => {
    if (!canProceed()) {
      Alert.alert('Please complete this step', 'Fill in the field or select an option to continue.');
      return;
    }

    let newAnswers = { ...answers };
    if (current.type === 'number') {
      newAnswers[current.key] = parseFloat(inputValue);
      setInputValue('');
    }

    if (isLast) {
      setLoading(true);
      try {
        const profile = {
          income: newAnswers.income,
          currency: newAnswers.currency?.[0] || 'USD',
          categories: newAnswers.categories,
          goal: newAnswers.goal?.[0],
          monthly_savings_target: newAnswers.monthlySavingsTarget,
          budget_limit: Math.max(0, newAnswers.income - newAnswers.monthlySavingsTarget),
          weaknesses: newAnswers.weaknesses,
          reminder_time: newAnswers.reminderTime?.[0],
        };
        await saveProfile(session.user.id, profile);
        await scheduleDailyReminder(profile.reminder_time);
        await refreshProfile();
      } catch (err) {
        Alert.alert('Error', err.message);
      } finally {
        setLoading(false);
      }
    } else {
      setAnswers(newAnswers);
      setStep(step + 1);
    }
  };

  const pct = Math.round(((step) / STEPS.length) * 100);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepLabel}>Step {step + 1} of {STEPS.length}</Text>
        <ProgressBar pct={pct} />
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.subtitle}>{current.subtitle}</Text>

        {current.type === 'number' && (
          <Input
            label="Amount"
            value={inputValue}
            onChangeText={setInputValue}
            placeholder={current.placeholder}
            keyboardType="decimal-pad"
          />
        )}

        {(current.type === 'single-chip' || current.type === 'multi-chip') && (
          <View style={styles.chipWrap}>
            {current.options.map((opt) => (
              <Chip
                key={opt}
                label={opt}
                selected={isSelected(opt)}
                onPress={() => toggleChip(opt)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step > 0 && (
          <Button
            title="Back"
            variant="secondary"
            onPress={() => setStep(step - 1)}
            style={{ marginBottom: 10 }}
          />
        )}
        <Button
          title={isLast ? 'Get started' : 'Continue'}
          onPress={handleNext}
          loading={loading}
        />
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
  footer: { padding: 24, paddingBottom: 36 },
});
