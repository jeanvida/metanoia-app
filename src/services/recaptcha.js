// src/services/recaptcha.js

export const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

export function getRecaptchaToken() {
  if (!SITE_KEY) {
    console.warn('reCAPTCHA Site Key n�o configurada');
    return null;
  }

  try {
    const token = window.grecaptcha.getResponse();
    if (!token) {
      console.warn('reCAPTCHA n�o foi completado pelo usu�rio');
      return null;
    }
    return token;
  } catch (error) {
    console.error('Erro ao obter token reCAPTCHA:', error);
    return null;
  }
}

export function resetRecaptcha() {
  try {
    if (window.grecaptcha && typeof window.grecaptcha.reset === 'function') {
      window.grecaptcha.reset();
    }
  } catch (error) {
    // Ignorar erro silenciosamente - reCAPTCHA pode não estar carregado
  }
}
