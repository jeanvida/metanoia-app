// src/services/recaptcha.js

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LdSkSUsAAAAAEIa-AOORUmjlBOE_cDXht6nxNAM';

export function getRecaptchaToken() {
  if (!SITE_KEY) {
    console.warn('reCAPTCHA Site Key não configurada');
    return null;
  }

  try {
    // Para reCAPTCHA v2, retorna o token do valor do widget
    const token = window.grecaptcha.getResponse();
    if (!token) {
      console.warn('reCAPTCHA não foi completado pelo usuário');
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
