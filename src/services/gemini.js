const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const AI_PROXY_URL = process.env.EXPO_PUBLIC_AI_PROXY_URL;
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_PROMPT = `You are SmartSense, a friendly and knowledgeable personal finance advisor.
Give concise, practical, personalized financial advice based on the user's real data.
Prefer specific observations, simple budget actions, and behavioral tips.
Keep responses short unless asked for more.
Use the user's currency when relevant.
Never recommend specific stocks, crypto tokens, or high-risk investments.`;

const getExpenseDate = (expense) => new Date(expense.spent_at || expense.created_at);
const toNumber = (value) => Number.parseFloat(value || 0) || 0;

export const buildFinancialContext = (user, profile, expenses) => {
  const now = new Date();
  const monthExpenses = expenses.filter((expense) => {
    const date = getExpenseDate(expense);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });

  const last7Days = expenses.filter((expense) => {
    const diff = Math.floor((now - getExpenseDate(expense)) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff < 7;
  });

  const totalSpent = monthExpenses.reduce((sum, expense) => sum + toNumber(expense.amount), 0);
  const weeklySpent = last7Days.reduce((sum, expense) => sum + toNumber(expense.amount), 0);
  const income = toNumber(profile?.income);
  const balance = income - totalSpent;
  const budgetLimit = toNumber(profile?.budget_limit);
  const savingsTarget = toNumber(profile?.monthly_savings_target);
  const savingRate = income > 0 ? Math.round((balance / income) * 100) : 0;

  const categoryTotals = {};
  monthExpenses.forEach((expense) => {
    categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + toNumber(expense.amount);
  });
  const topCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, amount]) => `${category}: ${Math.round(amount)}`)
    .join(', ');

  const recentExpenses = expenses
    .slice(0, 8)
    .map((expense) => {
      const label = expense.merchant || expense.note || expense.category;
      return `${label} (${expense.category}): ${Math.round(toNumber(expense.amount))}`;
    })
    .join(', ');

  return `
User: ${user?.user_metadata?.full_name || 'User'}
Currency: ${profile?.currency || 'USD'}
Monthly income: ${Math.round(income)}
Monthly spending limit: ${Math.round(budgetLimit)}
Monthly savings target: ${Math.round(savingsTarget)}
Total spent this month: ${Math.round(totalSpent)}
Spent in last 7 days: ${Math.round(weeklySpent)}
Remaining balance: ${Math.round(balance)}
Saving rate: ${savingRate}%
Spending by category: ${topCategories || 'No expenses yet'}
Recent expenses: ${recentExpenses || 'No expenses yet'}
Financial goal: ${profile?.goal || 'save money'}
Weaknesses: ${(profile?.weaknesses || []).join(', ') || 'not specified'}
  `.trim();
};

export const getDashboardInsight = async (financialContext, accessToken) => {
  const prompt = `${financialContext}\n\nWrite one personalized dashboard insight. Mention a concrete category, limit, or next action when possible.`;
  return await callAdvisor([{ role: 'user', content: prompt }], SYSTEM_PROMPT, accessToken);
};

export const getWeeklySummary = async (financialContext, accessToken) => {
  const prompt = `${financialContext}\n\nWrite a 3-4 sentence weekly financial summary with two actionable tips. Be encouraging but honest.`;
  return await callAdvisor([{ role: 'user', content: prompt }], SYSTEM_PROMPT, accessToken);
};

export const sendChatMessage = async (financialContext, history, userMessage, accessToken) => {
  const systemWithContext = `${SYSTEM_PROMPT}\n\nUser's current financial data:\n${financialContext}`;
  const messages = [...history.slice(-12), { role: 'user', content: userMessage }];
  return await callAdvisor(messages, systemWithContext, accessToken);
};

const callAdvisor = async (messages, systemOverride = SYSTEM_PROMPT, accessToken) => {
  if (AI_PROXY_URL) {
    return callProxy(messages, systemOverride, accessToken);
  }

  return callGeminiDirect(messages, systemOverride);
};

const callProxy = async (messages, systemInstruction, accessToken) => {
  const headers = { 'Content-Type': 'application/json' };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const response = await fetch(AI_PROXY_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ messages, systemInstruction }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.error || 'AI proxy error');
  }

  const data = await response.json();
  if (!data.text) throw new Error('AI proxy returned an empty response.');
  return data.text;
};

const callGeminiDirect = async (messages, systemOverride = SYSTEM_PROMPT) => {
  if (!GEMINI_API_KEY) {
    throw new Error(
      'Missing AI configuration. Set EXPO_PUBLIC_AI_PROXY_URL for production or EXPO_PUBLIC_GEMINI_API_KEY for local development.',
    );
  }

  try {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemOverride }],
        },
        contents: messages.map((message) => ({
          role: message.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: message.content }],
        })),
        generationConfig: {
          maxOutputTokens: 400,
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => null);
      throw new Error(err?.error?.message || 'Gemini API error');
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || '')
      .join('')
      .trim();

    if (!text) throw new Error('Gemini returned an empty response.');
    return text;
  } catch (error) {
    console.error('Gemini error:', error);
    throw error;
  }
};
