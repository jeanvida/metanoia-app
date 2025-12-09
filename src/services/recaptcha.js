// src/services/recaptcha.js

export const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LeVmCUsAAAAAM4lZhsVEJJdpJkgub9y6xpd-0Cb';

export function getRecaptchaToken() {
  if (!SITE_KEY) {
    console.warn('reCAPTCHA Site Key n o configurada');
    return null;
  }

  try {
    // Para reCAPTCHA v2, retorna o token do valor do widget
    const token = window.grecaptcha.getResponse();
    if (!token) {
      console.warn('reCAPTCHA n o foi completado pelo usu rio');
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
    window.grecaptcha.reset();
  } catch (error) {
    console.error('Erro ao resetar reCAPTCHA:', error);
  }
}

