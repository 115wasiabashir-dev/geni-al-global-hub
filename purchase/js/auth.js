const GOOGLE_CLIENT_ID =
  '1021298502273-bdsucooa24a2pfdtckcicnq98o929jj2.apps.googleusercontent.com';

const WORKER_URL =
  'https://geni-ai-backend.wasiabashir115.workers.dev';

let currentUser = null;

function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Google Sign-In failed to load.'));
    document.head.appendChild(script);
  });
}

async function initializeGoogleLogin() {
  try {
    await loadGoogleScript();

    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
    });

    renderGoogleButton('google-login-button');
    renderGoogleButton('login-button');
  } catch (error) {
    showLoginMessage(error.message);
  }
}

function renderGoogleButton(elementId) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const container = document.createElement('div');
  container.id = `${elementId}-container`;
  element.replaceWith(container);

  google.accounts.id.renderButton(container, {
    type: 'standard',
    theme: 'filled_black',
    size: 'large',
    text: 'continue_with',
    shape: 'rectangular',
    width: 300,
  });
}

async function handleGoogleCredential(response) {
  if (!response?.credential) {
    showLoginMessage('Google login failed.');
    return;
  }

  try {
    showLoginMessage('Signing in...');

    const result = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idToken: response.credential,
        action: 'sync_user'
      }),
    });

    const data = await result.json();

    if (!result.ok || data.success === false) {
      throw new Error(data.message || data.error || 'Login failed.');
    }

    // ایک جیسی کیز سیو کرو جو store.js استعمال کرتا ہے
    const userId = data.userId || data.user_id || data.user?.userId || '';
    const coins = data.coins ?? data.coinBalance ?? 0;
    const currency = data.currencyBalance ?? data.currency_balance ?? 0;

    localStorage.setItem('geni_user_id', userId);
    localStorage.setItem('geni_coins', String(coins));
    localStorage.setItem('geni_currency', String(currency));

    currentUser = { userId, coins, currency };
    localStorage.setItem('geni_ai_user', JSON.stringify(currentUser));

    showLoginMessage('Login successful.');

    if (window.location.pathname.endsWith('/login.html')) {
      window.location.href = 'store.html';
    } else {
      // اگر سٹور پر ہی ہیں تو ری لوڈ
      window.location.reload();
    }
  } catch (error) {
    showLoginMessage(error.message);
  }
}

function getCurrentUser() {
  if (currentUser) return currentUser;

  const saved = localStorage.getItem('geni_ai_user');
  if (!saved) return null;

  try {
    currentUser = JSON.parse(saved);
    return currentUser;
  } catch {
    localStorage.removeItem('geni_ai_user');
    return null;
  }
}

function logoutUser() {
  currentUser = null;
  localStorage.removeItem('geni_ai_user');
  localStorage.removeItem('geni_user_id');
  localStorage.removeItem('geni_coins');
  localStorage.removeItem('geni_currency');
  window.location.href = 'login.html';
}

function showLoginMessage(message) {
  const el = document.getElementById('login-message') || document.getElementById('payment-message');
  if (el) el.textContent = message;
}

document.addEventListener('DOMContentLoaded', () => {
  initializeGoogleLogin();
});