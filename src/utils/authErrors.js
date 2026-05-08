export const getFriendlyAuthError = (error, fallback = 'Something went wrong. Please try again.') => {
  const message = String(error?.message || '').toLowerCase();

  if (!message) return fallback;
  if (message.includes('invalid login') || message.includes('invalid credentials')) {
    return 'The email or password is incorrect.';
  }
  if (message.includes('email not confirmed')) {
    return 'Please confirm your email before signing in.';
  }
  if (message.includes('rate limit') || message.includes('too many')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return 'Connection problem. Check your internet and try again.';
  }
  if (message.includes('password')) {
    return 'Please use a stronger password and try again.';
  }

  return fallback;
};

export const withTimeout = (promise, label, timeoutMs = 20000) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} is taking too long.`)), timeoutMs),
    ),
  ]);
