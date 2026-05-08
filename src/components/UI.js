import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { COLORS, SIZES, SHADOWS, FONTS } from '../constants/theme';

export const Button = ({ title, onPress, variant = 'primary', loading, style, disabled }) => {
  const isPrimary = variant === 'primary';
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading || disabled}
      style={[
        styles.btn,
        isPrimary ? styles.btnPrimary : styles.btnSecondary,
        (loading || disabled) && { opacity: 0.6 },
        style,
      ]}
      activeOpacity={0.82}
    >
      {loading ? (
        <ActivityIndicator size="small" color={isPrimary ? COLORS.white : COLORS.primary} />
      ) : (
        <Text style={[styles.btnText, !isPrimary && { color: COLORS.primary }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

export const Input = ({ label, error, style, ...props }) => (
  <View style={[{ marginBottom: 16 }, style]}>
    {label && <Text style={styles.label}>{label}</Text>}
    <TextInput
      style={[styles.input, error && styles.inputError]}
      placeholderTextColor={COLORS.textMuted}
      {...props}
    />
    {error && <Text style={styles.inputErrorText}>{error}</Text>}
  </View>
);

export const Card = ({ children, style }) => (
  <View style={[styles.card, SHADOWS.small, style]}>{children}</View>
);

export const MetricCard = ({ label, value, color, style }) => (
  <View style={[styles.metric, style]}>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={[styles.metricValue, color && { color }]}>{value}</Text>
  </View>
);

export const InsightCard = ({ text, loading }) => (
  <View style={styles.insightCard}>
    <Text style={styles.insightLabel}>AI Insight</Text>
    {loading ? (
      <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 4 }} />
    ) : (
      <Text style={styles.insightText}>{text}</Text>
    )}
  </View>
);

export const ProgressBar = ({ pct, color = COLORS.primary }) => (
  <View style={styles.progressWrap}>
    <View
      style={[
        styles.progressFill,
        { width: `${Math.min(100, Math.max(0, pct))}%`, backgroundColor: color },
      ]}
    />
  </View>
);

export const Chip = ({ label, selected, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.chip, selected && styles.chipSelected]}
    activeOpacity={0.75}
  >
    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
  </TouchableOpacity>
);

export const Divider = ({ style }) => <View style={[styles.divider, style]} />;

export const SectionTitle = ({ children, style }) => (
  <Text style={[styles.sectionTitle, style]}>{children}</Text>
);

const styles = StyleSheet.create({
  btn: {
    height: 50,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  btnPrimary: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.medium,
  },
  btnSecondary: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  btnText: {
    color: COLORS.white,
    fontSize: SIZES.base,
    ...FONTS.semibold,
  },
  label: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 6,
    ...FONTS.medium,
  },
  input: {
    height: 48,
    borderRadius: SIZES.radiusSm,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    fontSize: SIZES.base,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.white,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  inputErrorText: {
    fontSize: SIZES.xs,
    color: COLORS.danger,
    marginTop: 4,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLg,
    padding: 16,
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: COLORS.borderLight,
  },
  metric: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius,
    padding: 14,
    flex: 1,
  },
  metricLabel: {
    fontSize: SIZES.xs,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    ...FONTS.medium,
  },
  metricValue: {
    fontSize: SIZES.xl,
    color: COLORS.textPrimary,
    ...FONTS.semibold,
  },
  insightCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: SIZES.radiusLg,
    padding: 16,
    marginBottom: 14,
  },
  insightLabel: {
    fontSize: SIZES.xs,
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    ...FONTS.semibold,
  },
  insightText: {
    fontSize: SIZES.base,
    color: COLORS.primaryDark,
    lineHeight: 22,
  },
  progressWrap: {
    height: 8,
    backgroundColor: COLORS.borderLight,
    borderRadius: 100,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 100,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: SIZES.base,
    color: COLORS.textSecondary,
  },
  chipTextSelected: {
    color: COLORS.primary,
    ...FONTS.medium,
  },
  divider: {
    height: 0.5,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: SIZES.md,
    color: COLORS.textPrimary,
    marginBottom: 10,
    ...FONTS.semibold,
  },
});
