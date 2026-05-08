# SmartSense App Explanation

SmartSense is a personal finance tracking app built with React Native and Expo. It helps users create an account, set up a basic financial profile, record expenses, understand spending habits, and get AI-powered financial guidance based on their own data.

The app is designed to work as a mobile app through Expo and as a web app through Expo web export, which is why it can also be deployed to Netlify.

## Main Purpose

SmartSense helps a user answer practical money questions like:

- How much money do I have left this month?
- Where is my money going?
- Which category am I spending the most on?
- Am I staying inside my budget?
- Can I still reach my savings goal?
- What should I do next to improve my finances?

The app combines manual expense tracking with simple dashboard calculations and AI advice.

## User Flow

### 1. Account Creation

A new user starts on the Register screen.

They enter:

- Full name
- Email address
- Password
- Password confirmation

The app creates the account through Supabase Auth. If email confirmation is enabled in Supabase, the user may need to confirm their email before signing in.

### 2. Login

An existing user signs in with email and password.

After login, the app checks Supabase for that user’s saved profile. If the profile already exists, the user goes straight into the main app. If the profile does not exist yet, the user is sent to onboarding.

This prevents returning users from answering the onboarding questions again.

### 3. Onboarding

Onboarding collects the information needed to personalize the dashboard and AI advice.

The user answers:

- Monthly income
- Preferred currency
- Main expense categories
- Financial goal
- Monthly savings target
- Financial weaknesses
- Reminder time

The user can also add their own currency code and custom spending categories.

After onboarding, the profile is saved in Supabase and the user enters the main app.

## Main Screens

### Dashboard

The Dashboard is the home screen. It summarizes the user’s current month.

It shows:

- Greeting and date
- Monthly balance
- Savings progress
- Income
- Total spent
- Monthly spending limit progress
- AI insight
- Weekly spending chart
- Recent expenses

The balance is calculated as:

```text
monthly income - total expenses this month
```

The dashboard uses the user’s selected currency when displaying money.

### Add Expense

The Add Expense screen lets the user record spending.

Each expense can include:

- Amount
- Category
- Merchant
- Date
- Payment method
- Note

The user can choose from default categories, categories saved during onboarding, or add a new custom category.

This screen also shows recent expenses and allows the user to:

- Edit an expense
- Delete an expense

### Insights

The Insights screen helps the user understand spending patterns.

It shows:

- Amount saved this month
- Amount spent this month
- Saving rate
- Next best action
- Spending breakdown by category
- Goal progress
- AI weekly summary

The “next best action” gives simple guidance based on the user’s spending limit, total spending, and biggest spending category.

### Chat

The Chat screen is an AI financial advisor.

The user can ask questions like:

- Can I afford my savings target this month?
- Where am I overspending?
- What daily spending limit should I follow?
- Give me a weekly spending plan

The AI receives a financial context summary containing:

- User name
- Currency
- Monthly income
- Monthly spending limit
- Savings target
- Total spent this month
- Spending in the last 7 days
- Remaining balance
- Saving rate
- Spending by category
- Recent expenses
- Financial goal
- Weaknesses

The AI is instructed to give practical budgeting and saving advice, not risky investment advice.

### Settings

The Settings screen lets the user update their financial profile after onboarding.

The user can edit:

- Monthly income
- Monthly savings target
- Monthly spending limit
- Currency
- Financial goal
- Categories
- Reminder time

The user can also:

- Add a custom currency
- Add a custom category
- Sign out

## Backend and Database

SmartSense uses Supabase for:

- User authentication
- Profile storage
- Expense storage
- Row-level security

The database has two main tables.

### profiles

Stores one financial profile per user.

Important fields:

- `user_id`
- `income`
- `currency`
- `goal`
- `monthly_savings_target`
- `budget_limit`
- `categories`
- `weaknesses`
- `reminder_time`

### expenses

Stores the user’s expenses.

Important fields:

- `user_id`
- `amount`
- `category`
- `merchant`
- `payment_method`
- `note`
- `spent_at`
- `created_at`
- `updated_at`

The schema also includes row-level security policies so users can only access their own data.

## AI System

The AI feature is powered by Gemini.

The app supports two AI setups:

### Recommended Production Setup

Use the Supabase Edge Function:

```text
supabase/functions/ai-advisor/index.ts
```

This keeps the Gemini API key on the server instead of exposing it in the app.

The app calls:

```env
EXPO_PUBLIC_AI_PROXY_URL
```

The Edge Function uses the secret:

```env
GEMINI_API_KEY
```

### Local Development Fallback

For quick local testing, the app can use:

```env
EXPO_PUBLIC_GEMINI_API_KEY
```

This is not recommended for production because public Expo environment variables can be exposed in the web or mobile bundle.

## Notifications

SmartSense uses Expo Notifications for daily reminders.

The user chooses a reminder time during onboarding or in Settings:

- Morning
- Midday
- Evening
- Night

On web, notification scheduling is skipped safely because Expo notification behavior differs from native mobile platforms.

## Important Files

### App.js

Defines the main navigation structure.

It decides whether to show:

- Login/Register screens
- Onboarding
- Main app tabs

The main tabs are:

- Dashboard
- Add
- Insights
- Chat
- Settings

### src/context/AppContext.js

Stores shared app state:

- Current session
- User profile
- Expenses
- Loading state

It also provides helper functions for:

- Refreshing expenses
- Refreshing profile
- Calculating monthly expenses
- Calculating total spent
- Calculating balance
- Calculating category totals
- Formatting money

### src/services/supabase.js

Contains Supabase functions for:

- Signing up
- Signing in
- Signing out
- Getting the session
- Saving the profile
- Getting the profile
- Adding expenses
- Updating expenses
- Getting expenses
- Deleting expenses

It also includes fallback behavior for older database schemas.

### src/services/gemini.js

Builds the user’s financial context and sends prompts to the AI advisor.

It supports both:

- Supabase Edge Function proxy
- Direct Gemini API fallback for local development

### src/services/notifications.js

Handles notification permission requests and daily reminder scheduling.

### src/constants/finance.js

Defines finance-related defaults:

- Supported currencies
- Default expense categories
- Payment methods
- Helpers for adding unique custom values

### supabase-schema.sql

Contains the SQL needed to create and update the Supabase database tables and security policies.

### netlify.toml

Tells Netlify how to build and publish the web version.

Build command:

```bash
npm run build:web
```

Publish folder:

```text
dist
```

## Deployment

The app can be deployed to Netlify as a web app.

Netlify runs:

```bash
npm run build:web
```

Expo exports the web build into:

```text
dist
```

Netlify then publishes the `dist` folder.

## Environment Variables

The app needs these values:

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_AI_PROXY_URL=
EXPO_PUBLIC_GEMINI_API_KEY=
```

For production, use `EXPO_PUBLIC_AI_PROXY_URL` and keep the actual Gemini key as a Supabase secret.

## Current Strengths

- The app has a complete user flow from registration to dashboard.
- Users can edit and delete expenses.
- Users can customize currencies and categories.
- Existing users should not be forced through onboarding again.
- The app supports both mobile and web.
- AI advice uses real user spending context.
- Supabase row-level security protects user data.

## Things To Improve Later

Good future improvements would be:

- Password reset flow
- Email confirmation screen
- Better charts
- Export expenses to CSV
- Recurring expenses
- Income history instead of one monthly income value
- Category budgets
- Dark mode
- More detailed error messages for Supabase setup problems
- Admin-free deployment checklist inside the app
- Better mobile notification testing

## Summary

SmartSense is a budgeting and expense-tracking app with AI guidance. It lets users create an account, set up their financial profile, track expenses, review insights, chat with an AI advisor, and update their settings over time.

The main value of the app is that it turns simple expense entries into useful financial feedback, helping users understand where their money goes and what action to take next.
