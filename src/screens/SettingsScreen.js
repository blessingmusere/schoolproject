import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { saveProfile, signOut } from '../services/supabase';
import { scheduleDailyReminder, cancelAllReminders } from '../services/notifications';
import { useApp } from '../context/AppContext';
import { Button, Card, Chip, Input, SectionTitle } from '../components/UI';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import { CURRENCIES, EXPENSE_CATEGORIES } from '../constants/finance';

const REMINDER_TIMES = ['Morning (8am)', 'Midday (12pm)', 'Evening (6pm)', 'Night (9pm)'];
const GOALS = ['Save money', 'Reduce spending', 'Buy something specific', 'Build emergency fund', 'Pay off debt'];

export default function SettingsScreen() {
  const { session, profile, refreshProfile } = useApp();
  const [form, setForm] = useState({
    income: String(profile?.income || ''),
    currency: profile?.currency || 'USD',
    goal: profile?.goal || 'Save money',
    monthly_savings_target: String(profile?.monthly_savings_target || ''),
    budget_limit: String(profile?.budget_limit || ''),
    reminder_time: profile?.reminder_time || 'Evening (6pm)',
    categories: profile?.categories || EXPENSE_CATEGORIES.map((category) => category.label),
  });
  const [saving, setSaving] = useState(false);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const toggleCategory = (category) => {
    setForm((prev) => {
      const exists = prev.categories.includes(category);
      return {
        ...prev,
        categories: exists
          ? prev.categories.filter((item) => item !== category)
          : [...prev.categories, category],
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveProfile(session.user.id, {
        income: Number.parseFloat(form.income || 0),
        currency: form.currency,
        goal: form.goal,
        monthly_savings_target: Number.parseFloat(form.monthly_savings_target || 0),
        budget_limit: Number.parseFloat(form.budget_limit || 0),
        reminder_time: form.reminder_time,
        categories: form.categories,
      });
      await scheduleDailyReminder(form.reminder_time);
      await refreshProfile();
      Alert.alert('Saved', 'Your SmartSense settings were updated.');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await cancelAllReminders();
    await signOut();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>

      <Card>
        <View style={styles.identityRow}>
          <View style={styles.avatar}>
            <Ionicons name="person-outline" size={22} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.name}>
              {session?.user?.user_metadata?.full_name || session?.user?.email || 'SmartSense user'}
            </Text>
            <Text style={styles.email}>{session?.user?.email || 'Guest session'}</Text>
          </View>
        </View>
      </Card>

      <SectionTitle>Money profile</SectionTitle>
      <Card>
        <Input
          label="Monthly income"
          value={form.income}
          onChangeText={(value) => setField('income', value)}
          keyboardType="decimal-pad"
          placeholder="0.00"
        />
        <Input
          label="Monthly savings target"
          value={form.monthly_savings_target}
          onChangeText={(value) => setField('monthly_savings_target', value)}
          keyboardType="decimal-pad"
          placeholder="0.00"
        />
        <Input
          label="Monthly spending limit"
          value={form.budget_limit}
          onChangeText={(value) => setField('budget_limit', value)}
          keyboardType="decimal-pad"
          placeholder="0.00"
        />
        <Text style={styles.helper}>These values drive your dashboard, budget progress, and AI advice.</Text>
      </Card>

      <SectionTitle>Currency</SectionTitle>
      <View style={styles.wrap}>
        {CURRENCIES.map((currency) => (
          <Chip
            key={currency}
            label={currency}
            selected={form.currency === currency}
            onPress={() => setField('currency', currency)}
          />
        ))}
      </View>

      <SectionTitle>Goal</SectionTitle>
      <View style={styles.wrap}>
        {GOALS.map((goal) => (
          <Chip key={goal} label={goal} selected={form.goal === goal} onPress={() => setField('goal', goal)} />
        ))}
      </View>

      <SectionTitle>Categories</SectionTitle>
      <View style={styles.wrap}>
        {EXPENSE_CATEGORIES.map((category) => (
          <Chip
            key={category.label}
            label={category.label}
            selected={form.categories.includes(category.label)}
            onPress={() => toggleCategory(category.label)}
          />
        ))}
      </View>

      <SectionTitle>Reminder</SectionTitle>
      <View style={styles.wrap}>
        {REMINDER_TIMES.map((time) => (
          <Chip
            key={time}
            label={time}
            selected={form.reminder_time === time}
            onPress={() => setField('reminder_time', time)}
          />
        ))}
      </View>

      <Button title="Save settings" onPress={handleSave} loading={saving} style={{ marginTop: 18 }} />

      <TouchableOpacity onPress={handleSignOut} style={styles.signOut}>
        <Ionicons name="log-out-outline" size={18} color={COLORS.danger} />
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 44 },
  title: { fontSize: SIZES.xl, color: COLORS.textPrimary, ...FONTS.bold, marginBottom: 20 },
  identityRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  name: { fontSize: SIZES.base, color: COLORS.textPrimary, ...FONTS.semibold },
  email: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  helper: { fontSize: SIZES.sm, color: COLORS.textSecondary },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14 },
  signOut: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 22,
    padding: 12,
  },
  signOutText: { color: COLORS.danger, fontSize: SIZES.base, ...FONTS.semibold },
});
