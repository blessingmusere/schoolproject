import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input } from '../components/UI';
import { signOut, updatePassword } from '../services/supabase';
import { useApp } from '../context/AppContext';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import { getFriendlyAuthError, withTimeout } from '../utils/authErrors';

export default function ResetPasswordScreen() {
  const { completePasswordRecovery } = useApp();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const validate = () => {
    if (password.length < 8) return 'Use at least 8 characters.';
    if (password !== confirm) return 'Passwords do not match.';
    return '';
  };

  const handleUpdate = async () => {
    const validationError = validate();
    if (validationError || loading) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');
    try {
      await withTimeout(updatePassword(password), 'Password update');
      setDone(true);
      await signOut().catch(() => undefined);
      completePasswordRecovery();
      if (Platform.OS !== 'web') {
        Alert.alert('Password updated', 'Sign in again with your new password.');
      }
    } catch (err) {
      const message = getFriendlyAuthError(
        err,
        'Could not update your password. Open the latest reset link and try again.',
      );
      setError(message);
      if (Platform.OS !== 'web') Alert.alert('Update failed', message);
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
        <View style={styles.iconWrap}>
          <Ionicons name={done ? 'checkmark-circle-outline' : 'lock-closed-outline'} size={32} color={COLORS.primary} />
        </View>

        <Text style={styles.title}>{done ? 'Password updated' : 'Create new password'}</Text>
        <Text style={styles.subtitle}>
          {done
            ? 'Your password has been changed. You can sign in again with the new password.'
            : 'Choose a strong password for your SmartSense account.'}
        </Text>

        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {!done && (
          <>
            <Input
              label="New password"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                setError('');
              }}
              placeholder="At least 8 characters"
              secureTextEntry
            />
            <Input
              label="Confirm password"
              value={confirm}
              onChangeText={(value) => {
                setConfirm(value);
                setError('');
              }}
              placeholder="Repeat new password"
              secureTextEntry
            />
            <Button title="Update password" onPress={handleUpdate} loading={loading} />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  inner: { flexGrow: 1, justifyContent: 'center', padding: 28 },
  iconWrap: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: { fontSize: SIZES.xxl, color: COLORS.textPrimary, ...FONTS.bold, marginBottom: 6 },
  subtitle: { fontSize: SIZES.base, color: COLORS.textSecondary, marginBottom: 24, lineHeight: 22 },
  errorBox: {
    backgroundColor: COLORS.dangerLight,
    borderRadius: SIZES.radiusSm,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: COLORS.danger, fontSize: SIZES.sm, lineHeight: 18 },
});
