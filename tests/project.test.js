const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');

test('package and lockfile root dependencies stay in sync', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
  const lockedDeps = lock.packages[''].dependencies || {};

  for (const [name, version] of Object.entries(pkg.dependencies || {})) {
    assert.equal(lockedDeps[name], version, `${name} should match package-lock.json`);
  }
});

test('AI proxy function is documented and present', () => {
  assert.ok(fs.existsSync(path.join(root, 'supabase/functions/ai-advisor/index.ts')));
  const envExample = fs.readFileSync(path.join(root, '.env.example'), 'utf8');
  assert.match(envExample, /EXPO_PUBLIC_AI_PROXY_URL/);
});

test('password reset screens are wired into the app', () => {
  const app = fs.readFileSync(path.join(root, 'App.js'), 'utf8');
  const supabaseService = fs.readFileSync(path.join(root, 'src/services/supabase.js'), 'utf8');

  assert.match(app, /ForgotPassword/);
  assert.match(app, /ResetPassword/);
  assert.match(supabaseService, /resetPasswordForEmail/);
  assert.match(supabaseService, /updateUser\(\{ password \}\)/);
  assert.match(supabaseService, /auth\.resend/);
});

test('signup does not require a hardcoded frontend email redirect', () => {
  const supabaseService = fs.readFileSync(path.join(root, 'src/services/supabase.js'), 'utf8');

  assert.match(supabaseService, /EXPO_PUBLIC_AUTH_EMAIL_REDIRECT_URL/);
  assert.doesNotMatch(supabaseService, /emailRedirectTo: getEmailRedirectUrl/);
});

test('README reflects Gemini rather than stale OpenAI setup', () => {
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  assert.match(readme, /Gemini 2\.5 Flash/);
  assert.doesNotMatch(readme, /GPT-4o/);
});
