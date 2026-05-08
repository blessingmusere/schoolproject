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
import { signUp } from '../services/supabase';
import { Button, Input } from '../components/UI';
import { COLORS, SIZES, FONTS } from '../constants/theme';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Minimum 6 characters';
    if (password !== confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await signUp(email.trim().toLowerCase(), password, name.trim());
      Alert.alert('Account created', 'Check your email to confirm your account, then sign in.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err) {
      Alert.alert('Registration failed', err.message);
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

        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Join SmartSense and take control of your finances</Text>

        <Input label="Full name" value={name} onChangeText={setName} placeholder="John Doe" error={errors.name} />
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
          placeholder="Min 6 characters"
          secureTextEntry
          error={errors.password}
        />
        <Input
          label="Confirm password"
          value={confirm}
          onChangeText={setConfirm}
          placeholder="Repeat password"
          secureTextEntry
          error={errors.confirm}
        />

        <Button title="Create account" onPress={handleRegister} loading={loading} />
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
  subtitle: { fontSize: SIZES.base, color: COLORS.textSecondary, marginBottom: 28 },
});
