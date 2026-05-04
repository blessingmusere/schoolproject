// Google Gemini integration for SmartSense AI features

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_PROMPT = `You are SmartSense, a friendly and knowledgeable personal finance advisor.
You give concise, practical, and personalized financial advice based on the user's real data.
Keep responses short (2-4 sentences max unless asked for more).
Be warm, direct, and specific — never generic.
Use dollar amounts and percentages when relevant.
Never give investment advice about specific stocks. Focus on budgeting, saving, and spending habits.`;

/**
 * Build a financial context string from the user's data.
 */
export const buildFinancialContext = (user, profile, expenses) => {
  const now = new Date();
  const monthExpenses = expenses.filter((e) => {
    const d = new Date(e.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const totalSpent = monthExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const income = parseFloat(profile?.income || 0);
  const balance = income - totalSpent;
  const savingRate = income > 0 ? Math.round((balance / income) * 100) : 0;

  const categoryTotals = {};
  monthExpenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + parseFloat(e.amount);
  });
  const topCats = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cat, amt]) => `${cat}: $${Math.round(amt)}`)
    .join(', ');

  return `
User: ${user?.user_metadata?.full_name || 'User'}
Monthly income: $${Math.round(income)}
Total spent this month: $${Math.round(totalSpent)}
Remaining balance: $${Math.round(balance)}
Saving rate: ${savingRate}%
Spending by category: ${topCats || 'No expenses yet'}
Financial goal: ${profile?.goal || 'save money'}
Weaknesses: ${(profile?.weaknesses || []).join(', ') || 'not specified'}
  `.trim();
};

/**
 * Get a single AI insight for the dashboard.
 */
export const getDashboardInsight = async (financialContext) => {
  const prompt = `${financialContext}\n\nWrite a single personalized 1-2 sentence financial insight or tip for this user's dashboard. Be specific and encouraging.`;
  return await callGemini([{ role: 'user', content: prompt }]);
};

/**
 * Get an AI-generated weekly summary.
 */
export const getWeeklySummary = async (financialContext) => {
  const prompt = `${financialContext}\n\nWrite a friendly 3-4 sentence weekly financial summary for this user. Include specific observations about their spending and give 2 actionable tips. Be encouraging but honest.`;
  return await callGemini([{ role: 'user', content: prompt }]);
};

/**
 * Send a chat message to the AI advisor.
 * @param {string} financialContext - User's financial data context
 * @param {Array} history - Previous messages [{role, content}]
 * @param {string} userMessage - Latest user message
 */
export const sendChatMessage = async (financialContext, history, userMessage) => {
  const systemWithContext = `${SYSTEM_PROMPT}\n\nUser's current financial data:\n${financialContext}`;
  const messages = [
    ...history.slice(-12), // keep last 12 messages to stay within token limits
    { role: 'user', content: userMessage },
  ];
  return await callGemini(messages, systemWithContext);
};

/**
 * Core Gemini API caller.
 */
const callGemini = async (messages, systemOverride = SYSTEM_PROMPT) => {
  if (!GEMINI_API_KEY) {
    throw new Error('Missing EXPO_PUBLIC_GEMINI_API_KEY. Add your Google AI Studio API key to .env.');
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

    if (!text) {
      throw new Error('Gemini returned an empty response.');
    }

    return text;
  } catch (error) {
    console.error('Gemini error:', error);
    throw error;
  }
};
