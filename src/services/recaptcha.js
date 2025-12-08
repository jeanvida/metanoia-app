// src/services/recaptcha.js

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

export async function getRecaptchaToken(action = 'submit') {
  if (!SITE_KEY) {
    console.warn('reCAPTCHA Site Key não configurada');
    return null;
  }

  try {
    const token = await window.grecaptcha.execute(SITE_KEY, { action });
    return token;
  } catch (error) {
    console.error('Erro ao gerar token reCAPTCHA:', error);
    return null;
  }
}
