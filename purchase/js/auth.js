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

    const button = document.getElementById('google-login-button');

    if (button) {
      button.addEventListener('click', () => {
        google.accounts.id.prompt();
      });
    }

    const mainLoginButton = document.getElementById('login-button');

    if (mainLoginButton) {
      mainLoginButton.addEventListener('click', () => {
        google.accounts.id.prompt();
      });
    }
  } catch (error) {
    showLoginMessage(error.message);
  }
}

async function handleGoogleCredential(response) {
  if (!response?.credential) {
    showLoginMessage('Google login failed.');
    return;
  }

  try {
    showLoginMessage('Signing in...');

    const result = await fetch(`${WORKER_URL}/api/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idToken: response.credential,
      }),
    });

    const data = await result.json();

    if (!result.ok || !data.success) {
      throw new Error(data.message || data.error || 'Login failed.');
    }

    currentUser = data.user;

    localStorage.setItem(
      'geni_ai_user',
      JSON.stringify(currentUser)
    );

    showLoginMessage('Login successful.');

    if (window.location.pathname.endsWith('/login.html')) {
      window.location.href = 'store.html';
    }
  } catch (error) {
    showLoginMessage(error.message);
  }
}

function getCurrentUser() {
  if (currentUser) {
    return currentUser;
  }

  const savedUser = localStorage.getItem('geni_ai_user');

  if (!savedUser) {
    return null;
  }

  try {
    currentUser = JSON.parse(savedUser);
    return currentUser;
  } catch (_) {
    localStorage.removeItem('geni_ai_user');
    return null;
  }
}

function logoutUser() {
  currentUser = null;
  localStorage.removeItem('geni_ai_user');
  window.location.href = 'login.html';
}

function showLoginMessage(message) {
  const loginMessage = document.getElementById('login-message');
  const paymentMessage = document.getElementById('payment-message');

  if (loginMessage) {
    loginMessage.textContent = message;
  }

  if (paymentMessage) {
    paymentMessage.textContent = message;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initializeGoogleLogin();
});