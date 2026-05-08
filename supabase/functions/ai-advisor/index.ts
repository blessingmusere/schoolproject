const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (!GEMINI_API_KEY) {
    return json({ error: 'Missing GEMINI_API_KEY server secret.' }, 500);
  }

  try {
    const { messages, systemInstruction } = await req.json();

    if (!Array.isArray(messages)) {
      return json({ error: 'messages must be an array.' }, 400);
    }

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemInstruction || 'You are SmartSense, a personal finance advisor.' }],
        },
        contents: messages.map((message) => ({
          role: message.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: String(message.content || '') }],
        })),
        generationConfig: {
          maxOutputTokens: 400,
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => null);
      return json({ error: err?.error?.message || 'Gemini API error.' }, response.status);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || '')
      .join('')
      .trim();

    return json({ text });
  } catch (error) {
    return json({ error: error.message || 'AI advisor failed.' }, 500);
  }
});

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
