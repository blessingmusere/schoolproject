import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signIn } from '../services/supabase';
import { Button, Input } from '../components/UI';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { getFriendlyAuthError, withTimeout } from '../utils/authErrors';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState('');

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate() || loading) return;
    setLoading(true);
    setNotice('');
    try {
      await withTimeout(signIn(email.trim().toLowerCase(), password), 'Sign in');
    } catch (err) {
      const message = getFriendlyAuthError(err, 'Could not sign in. Check your details and try again.');
      setNotice(message);
      if (Platform.OS !== 'web') Alert.alert('Login failed', message);
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
        <View style={styles.logoWrap}>
          <View style={styles.logoIcon}>
            <Ionicons name="analytics-outline" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.logoText}>SmartSense</Text>
          <Text style={styles.tagline}>Your personal financial advisor</Text>
        </View>

        <View style={styles.form}>
          {!!notice && (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>{notice}</Text>
            </View>
          )}

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
            error={errors.password}
          />

          <Button title="Sign in" onPress={handleLogin} loading={loading} />

          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword', { email: email.trim().toLowerCase() })}
            style={styles.forgotWrap}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.linkWrap}>
            <Text style={styles.linkText}>
              No account? <Text style={styles.link}>Create one</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  inner: { flexGrow: 1, justifyContent: 'center', padding: 28 },
  logoWrap: { alignItems: 'center', marginBottom: 40 },
  logoIcon: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  logoText: { fontSize: SIZES.xxl, color: COLORS.primary, ...FONTS.bold },
  tagline: { fontSize: SIZES.base, color: COLORS.textSecondary, marginTop: 4 },
  form: { width: '100%' },
  notice: {
    backgroundColor: COLORS.dangerLight,
    borderRadius: SIZES.radiusSm,
    padding: 12,
    marginBottom: 16,
  },
  noticeText: { color: COLORS.danger, fontSize: SIZES.sm, lineHeight: 18 },
  forgotWrap: { alignItems: 'center', marginTop: 14 },
  forgotText: { color: COLORS.primary, fontSize: SIZES.sm, ...FONTS.semibold },
  linkWrap: { alignItems: 'center', marginTop: 20 },
  linkText: { fontSize: SIZES.base, color: COLORS.textSecondary },
  link: { color: COLORS.primary, ...FONTS.semibold },
});
