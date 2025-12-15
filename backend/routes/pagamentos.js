// backend/routes/pagamentos.js

const express = require('express');
const router = express.Router();

const { pagamentoLimiter } = require('../middleware/rateLimit');

const { validarPedido } = require('../validators/pedidoValidator');
const pagamentosController = require('../controllers/pagamentosController');



// Processar pagamento com Cartão de Crédito (rate limit + validação)
// POST /api/pagar/cartao
router.post('/pagar/cartao', pagamentoLimiter, validarPedido, pagamentosController.processarCartao);



// Criar cobrança PIX (rate limit + validação)
// POST /api/pagar/pix
router.post('/pagar/pix', pagamentoLimiter, validarPedido, pagamentosController.processarPix);

// Exporta o router para ser usado no index.js
module.exports = router;
