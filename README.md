# SmartSense

SmartSense is a React Native and Expo personal finance app. It helps users log expenses, track monthly balance, review spending patterns, and chat with an AI advisor using their real financial context.

## Features

- Supabase email/password authentication
- Guided onboarding for income, currency, goals, categories, weaknesses, savings target, and reminders
- Dashboard with monthly balance, savings progress, budget progress, weekly chart, and recent expenses
- Expense create, edit, and delete flows
- Merchant, payment method, note, category, and spending date fields
- Spending breakdown and next-best-action insights
- AI dashboard insight, weekly summary, and chat advisor
- Daily Expo notification reminders
- Android APK build profile through EAS
- Optional Supabase Edge Function proxy so AI keys are kept server-side

## Tech Stack

| Layer | Technology |
| --- | --- |
| Mobile | React Native + Expo |
| Navigation | React Navigation |
| Auth + Database | Supabase |
| AI | Gemini 2.5 Flash through a Supabase Edge Function or local development fallback |
| Notifications | Expo Notifications |
| Build | EAS Build |

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a Supabase project.
2. Copy your project URL and anon public key from Settings > API.
3. Open `supabase-schema.sql`.
4. Run the full schema in the Supabase SQL editor.

### 3. Configure environment variables

Copy `.env.example` to `.env` and fill in your values:

```env
EXPO_PUBLIC_AI_PROXY_URL=https://your-project-ref.functions.supabase.co/ai-advisor
EXPO_PUBLIC_GEMINI_API_KEY=your_google_ai_studio_api_key
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

For production, prefer `EXPO_PUBLIC_AI_PROXY_URL` and keep `GEMINI_API_KEY` only as a Supabase Edge Function secret. The `EXPO_PUBLIC_GEMINI_API_KEY` fallback is only for local development.

### 4. Deploy the AI proxy

Install the Supabase CLI, then set the secret and deploy:

```bash
supabase secrets set GEMINI_API_KEY=your_google_ai_studio_api_key
supabase functions deploy ai-advisor
```

Use the deployed function URL as `EXPO_PUBLIC_AI_PROXY_URL`.

### 5. Run the app

```bash
npm start
```

Then open it in Expo Go or an emulator.

## Scripts

```bash
npm start
npm run android
npm run ios
npm run build:web
npm run build:apk
npm run lint
npm test
```

## Project Structure

```text
smartsense/
  App.js
  app.json
  supabase-schema.sql
  supabase/functions/ai-advisor/index.ts
  src/
    components/UI.js
    constants/finance.js
    constants/theme.js
    context/AppContext.js
    screens/
      AddExpenseScreen.js
      ChatScreen.js
      DashboardScreen.js
      InsightsScreen.js
      LoginScreen.js
      OnboardingScreen.js
      RegisterScreen.js
      SettingsScreen.js
    services/
      gemini.js
      notifications.js
      supabase.js
```

## Release Checklist

- Replace placeholder Supabase and AI proxy values in `.env`.
- Set `GEMINI_API_KEY` as a server-side Supabase secret.
- Confirm the Android package and iOS bundle ID in `app.json`.
- Test registration, login, onboarding, expense edit/delete, notifications, insights, and chat.
- Add a privacy policy before collecting real user financial data.
