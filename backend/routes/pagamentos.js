// backend/routes/pagamentos.js

const express = require('express');
const router = express.Router(); // Cria a instância do roteador
const pagamentosController = require('../controllers/pagamentosController');

// Rota para processar pagamento com Cartão de Crédito
// POST /api/pagar/cartao
router.post('/pagar/cartao', pagamentosController.processarCartao);

// Rota para criar cobrança PIX
// POST /api/pagar/pix
router.post('/pagar/pix', pagamentosController.processarPix);

// A CORREÇÃO PRINCIPAL: Exportar a instância do router
module.exports = router;