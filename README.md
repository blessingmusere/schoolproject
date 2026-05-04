# 💡 SmartSense – AI Financial Advisor App

A production-ready React Native mobile app that tracks your income & expenses and uses **GPT-4o** to give you personalized financial advice, daily insights, and a conversational AI advisor.

---

## 📱 Features

- ✅ Register / Login (Supabase Auth)
- ✅ 5-step onboarding (income, categories, goal, weaknesses, reminder time)
- ✅ Dashboard with real-time balance, goal progress, weekly chart
- ✅ Add expenses with categories and notes
- ✅ AI-powered daily insight on dashboard (GPT-4o)
- ✅ Spending breakdown with category bars
- ✅ AI weekly summary generator
- ✅ Full AI chat advisor (context-aware, knows your real data)
- ✅ Daily push notification reminders
- ✅ Builds to a real Android APK

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native + Expo |
| Auth + Database | Supabase |
| AI | OpenAI GPT-4o |
| Notifications | Expo Notifications |
| Build | EAS Build (APK) |

---

## ⚡ Quick Setup (Follow Every Step)

### Step 1 — Install Prerequisites

Make sure you have these installed:

```bash
# Node.js (v18 or higher)
node --version

# Install Expo CLI globally
npm install -g expo-cli

# Install EAS CLI (for APK builds)
npm install -g eas-cli
```

---

### Step 2 — Clone & Install Dependencies

```bash
# Navigate to the project folder
cd smartsense

# Install all packages
npm install
```

---

### Step 3 — Set Up Supabase (Free)

1. Go to [https://supabase.com](https://supabase.com) and create a **free account**
2. Click **New Project** → fill in name and password → click Create
3. Wait ~2 minutes for it to start
4. Go to **Settings → API** and copy:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key
5. Go to **SQL Editor → New query**
6. Open the file `supabase-schema.sql` from this project
7. Paste the entire contents and click **Run**
8. You should see: ✅ *Success. No rows returned.*

---

### Step 4 — Get Your OpenAI API Key

1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Click **Create new secret key**
3. Copy the key (starts with `sk-...`)
4. Make sure your account has **GPT-4o access** (requires adding a payment method — usage is pay-per-use, very cheap for personal use)

> 💡 Typical usage: 1,000 messages ≈ $0.10–$0.30

---

### Step 5 — Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env
```

Open `.env` and fill in your real values:

```env
EXPO_PUBLIC_OPENAI_API_KEY=sk-your-real-key-here
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

> ⚠️ Never share your `.env` file or commit it to GitHub.

---

### Step 6 — Run the App (Development)

```bash
# Start the Expo dev server
npm start
```

This opens **Expo DevTools** in your browser. Then:

**Option A – On your phone (recommended):**
1. Download the **Expo Go** app from Play Store / App Store
2. Scan the QR code shown in the terminal
3. The app loads on your phone instantly

**Option B – On Android emulator:**
```bash
npm run android
```

---

### Step 7 — Build a Real APK (Optional)

To generate an installable `.apk` file you can share:

```bash
# Login to your Expo account (create free at expo.dev)
eas login

# Configure the project (first time only)
eas build:configure

# Build APK (takes ~10–15 minutes on EAS servers)
npm run build:apk
```

When done, EAS gives you a **download link** for your `.apk` file.

---

## 📁 Project Structure

```
smartsense/
├── App.js                        # Root — navigation & auth routing
├── app.json                      # Expo config
├── eas.json                      # Build profiles (APK, production)
├── .env.example                  # Environment variable template
├── supabase-schema.sql           # Run this in Supabase SQL editor
└── src/
    ├── constants/
    │   └── theme.js              # Colors, fonts, spacing
    ├── context/
    │   └── AppContext.js         # Global state (auth, expenses, profile)
    ├── services/
    │   ├── supabase.js           # All database & auth operations
    │   ├── openai.js             # GPT-4o API calls
    │   └── notifications.js     # Push notification scheduling
    ├── components/
    │   └── UI.js                 # Reusable components (Button, Card, etc.)
    └── screens/
        ├── LoginScreen.js
        ├── RegisterScreen.js
        ├── OnboardingScreen.js
        ├── DashboardScreen.js
        ├── AddExpenseScreen.js
        ├── InsightsScreen.js
        └── ChatScreen.js
```

---

## 🎨 Customization

### Change the app name
Edit `app.json`:
```json
"name": "YourAppName",
"slug": "yourappname"
```

### Change colors
Edit `src/constants/theme.js`:
```js
primary: '#6C63FF',   // Change to any hex color
```

### Change AI model
Edit `src/services/openai.js`:
```js
model: 'gpt-4o',      // or 'gpt-4o-mini' (cheaper & faster)
```

### Add expense categories
Edit the `CATEGORIES` array in `src/screens/AddExpenseScreen.js`

---

## 🔧 Troubleshooting

| Problem | Fix |
|---|---|
| `npm install` fails | Make sure Node v18+ is installed |
| App won't load on Expo Go | Make sure phone and computer are on same WiFi |
| "Invalid API key" error | Check your `.env` file has the correct OpenAI key |
| AI features not working | Confirm GPT-4o access on your OpenAI account |
| Supabase login fails | Make sure you ran `supabase-schema.sql` in SQL editor |
| Build fails | Run `eas build:configure` first, then try again |

---

## 🚀 Deployment Checklist

Before releasing to others:

- [ ] Replace `com.yourname.smartsense` in `app.json` with your real bundle ID
- [ ] Add a real `assets/icon.png` (1024×1024 px)
- [ ] Add a real `assets/splash.png` (1284×2778 px)
- [ ] Test login, onboarding, expense adding, and AI chat
- [ ] Set spending limits on your OpenAI account

---

## 📄 License

MIT — free to use, modify, and distribute.
