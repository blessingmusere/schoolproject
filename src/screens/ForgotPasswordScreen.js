import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input } from '../components/UI';
import { sendPasswordResetEmail } from '../services/supabase';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import { getFriendlyAuthError, withTimeout } from '../utils/authErrors';

export default function ForgotPasswordScreen({ navigation, route }) {
  const [email, setEmail] = useState(route?.params?.email || '');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = /\S+@\S+\.\S+/.test(email.trim());

  const handleSend = async () => {
    if (!canSubmit || loading) {
      setError('Enter a valid email address.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await withTimeout(sendPasswordResetEmail(email.trim().toLowerCase()), 'Password reset email');
      setSent(true);
      if (Platform.OS !== 'web') {
        Alert.alert('Reset email sent', 'Open the link in your email to create a new password.');
      }
    } catch (err) {
      const message = getFriendlyAuthError(
        err,
        'Could not send the reset email. Check the address and try again.',
      );
      setError(message);
      if (Platform.OS !== 'web') Alert.alert('Reset failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={18} color={COLORS.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Reset password</Text>
        <Text style={styles.subtitle}>
          Enter your account email and we will send a secure reset link.
        </Text>

        {sent && (
          <View style={styles.successBox}>
            <Ionicons name="mail-outline" size={20} color={COLORS.success} />
            <Text style={styles.successText}>
              Reset link sent. Check your inbox, then return here through the email link.
            </Text>
          </View>
        )}

        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Input
          label="Email"
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setError('');
          }}
          placeholder="you@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Button
          title={sent ? 'Resend reset link' : 'Send reset link'}
          onPress={handleSend}
          loading={loading}
          disabled={!canSubmit}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  inner: { flexGrow: 1, padding: 28, paddingTop: 60 },
  backBtn: { marginBottom: 28, flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { color: COLORS.primary, fontSize: SIZES.base, ...FONTS.medium },
  title: { fontSize: SIZES.xxl, color: COLORS.textPrimary, ...FONTS.bold, marginBottom: 6 },
  subtitle: { fontSize: SIZES.base, color: COLORS.textSecondary, marginBottom: 24, lineHeight: 22 },
  successBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: COLORS.successLight,
    borderRadius: SIZES.radiusSm,
    padding: 12,
    marginBottom: 16,
  },
  successText: { flex: 1, color: COLORS.success, fontSize: SIZES.sm, lineHeight: 18 },
  errorBox: {
    backgroundColor: COLORS.dangerLight,
    borderRadius: SIZES.radiusSm,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: COLORS.danger, fontSize: SIZES.sm, lineHeight: 18 },
});
