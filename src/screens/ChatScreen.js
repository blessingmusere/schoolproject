import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { buildFinancialContext, sendChatMessage } from '../services/gemini';
import { COLORS, SIZES, FONTS } from '../constants/theme';

const QUICK_QUESTIONS = [
  'Can I afford my savings target this month?',
  'Where am I overspending?',
  'What daily spending limit should I follow?',
  'Give me a weekly spending plan',
];

export default function ChatScreen() {
  const { session, profile, expenses, formatMoney } = useApp();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatRef = useRef(null);
  const historyRef = useRef([]);

  const name = session?.user?.user_metadata?.full_name?.split(' ')[0] || 'there';

  useEffect(() => {
    if (messages.length === 0) {
      const income = Number.parseFloat(profile?.income || 0);
      const goal = profile?.goal || 'manage your finances';
      setMessages([
        {
          id: 'intro',
          role: 'ai',
          text: `Hi ${name}. I know your income is ${formatMoney(income)} per month and your goal is to ${goal.toLowerCase()}. Ask me anything about your budget.`,
        },
      ]);
    }
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg = { id: Date.now().toString(), role: 'user', text: msg };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    scrollToBottom();

    try {
      const ctx = buildFinancialContext(session?.user, profile, expenses);
      const reply = await sendChatMessage(ctx, historyRef.current, msg, session?.access_token);
      historyRef.current = [
        ...historyRef.current,
        { role: 'user', content: msg },
        { role: 'assistant', content: reply },
      ].slice(-16);
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}ai`, role: 'ai', text: reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}err`,
          role: 'ai',
          text: 'I could not connect to the advisor service. Check your AI proxy or local API key.',
        },
      ]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const renderItem = ({ item }) => (
    <View style={[styles.bubbleWrap, item.role === 'user' && styles.bubbleWrapUser]}>
      <View style={[styles.bubble, item.role === 'user' ? styles.bubbleUser : styles.bubbleAI]}>
        <Text style={[styles.bubbleText, item.role === 'user' && styles.bubbleTextUser]}>
          {item.text}
        </Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <View style={styles.aiAvatar}>
          <Ionicons name="sparkles-outline" size={18} color={COLORS.primary} />
        </View>
        <View>
          <Text style={styles.aiName}>SmartSense Advisor</Text>
          <Text style={styles.aiSub}>Personalized from your spending data</Text>
        </View>
      </View>

      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.messages}
        onContentSizeChange={scrollToBottom}
      />

      {loading && (
        <View style={styles.typingWrap}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.typingText}>Thinking...</Text>
        </View>
      )}

      {messages.length === 1 && (
        <View style={styles.quickWrap}>
          {QUICK_QUESTIONS.map((question) => (
            <TouchableOpacity
              key={question}
              style={styles.quickBtn}
              onPress={() => send(question)}
              activeOpacity={0.75}
            >
              <Text style={styles.quickText}>{question}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask about your finances..."
          placeholderTextColor={COLORS.textMuted}
          onSubmitEditing={() => send()}
          returnKeyType="send"
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || loading) && { opacity: 0.5 }]}
          onPress={() => send()}
          disabled={!input.trim() || loading}
        >
          <Ionicons name="arrow-up" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    paddingTop: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  aiAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiName: { fontSize: SIZES.base, color: COLORS.textPrimary, ...FONTS.semibold },
  aiSub: { fontSize: SIZES.xs, color: COLORS.textSecondary },
  messages: { padding: 16, paddingBottom: 8 },
  bubbleWrap: { marginBottom: 10 },
  bubbleWrapUser: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    backgroundColor: COLORS.white,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  bubbleUser: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 4,
  },
  bubbleText: { fontSize: SIZES.base, color: COLORS.textPrimary, lineHeight: 22 },
  bubbleTextUser: { color: COLORS.white },
  typingWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  typingText: { fontSize: SIZES.sm, color: COLORS.textSecondary },
  quickWrap: { paddingHorizontal: 16, paddingBottom: 8 },
  quickBtn: {
    backgroundColor: COLORS.white,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    padding: 10,
    marginBottom: 8,
  },
  quickText: { fontSize: SIZES.sm, color: COLORS.primary },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    padding: 12,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 100,
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: SIZES.base,
    color: COLORS.textPrimary,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
