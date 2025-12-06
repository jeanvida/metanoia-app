// backend/routes/pagamentos.js

const express = require('express');
const router = express.Router();
const pagamentosController = require('../controllers/pagamentosController');

// Processar pagamento com Cartão de Crédito
// POST /api/pagar/cartao
router.post('/pagar/cartao', pagamentosController.processarCartao);

// Criar cobrança PIX
// POST /api/pagar/pix
router.post('/pagar/pix', pagamentosController.processarPix);

// Exporta o router para ser usado no index.js
module.exports = router;
