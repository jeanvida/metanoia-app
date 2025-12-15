// backend/middleware/rateLimit.js
const rateLimit = require('express-rate-limit');

// Limite padrão: 20 requisições por 10 minutos por IP
const defaultLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 20,
  message: { error: 'Muitas requisições, tente novamente em alguns minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limite mais restrito para pagamentos: 5 por 10 minutos
const pagamentoLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { error: 'Muitas tentativas de pagamento, tente novamente em alguns minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { defaultLimiter, pagamentoLimiter };
