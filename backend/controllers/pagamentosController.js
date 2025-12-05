// backend/controllers/pagamentosController.js
const pagbankService = require('../services/pagbank.service');

// ====================
// Cartão (AGORA APENAS PROD)
// ====================
exports.processarCartao = async (req, res) => {
    try {
        const dadosTransacao = req.body;
        console.log('Recebida requisição Cartão com dados:', JSON.stringify(dadosTransacao, null, 2));

        // REMOVIDO: const ambiente = dadosTransacao.ambiente || "sandbox";

        // A chamada agora usa APENAS os dados. O serviço sabe que é PROD pelo .env
        const resultadoPagBank = await pagbankService.processarTransacaoCartao(dadosTransacao); 
        console.log("✅ Resultado PagBank Cartão:", JSON.stringify(resultadoPagBank, null, 2));

        return res.status(200).json({ 
            mensagem: "Transação enviada para PagBank.",
            transacao: resultadoPagBank 
        });

    } catch (error) {
        console.error('❌ Erro no processamento do Cartão:', error);
        return res.status(500).json({ 
            erro: 'Falha ao processar pagamento com cartão.', 
            detalhe: error.message 
        });
    }
};

// ====================
// PIX (AGORA APENAS PROD)
// ====================
exports.processarPix = async (req, res) => {
    try {
        const dadosTransacao = req.body;
        console.log('Recebida requisição PIX com dados:', JSON.stringify(dadosTransacao, null, 2));

        // REMOVIDO: const ambiente = dadosTransacao.ambiente || "sandbox";

        // A chamada agora usa APENAS os dados. O serviço sabe que é PROD pelo .env
        const resultadoPagBank = await pagbankService.criarCobrancaPix(dadosTransacao);
        console.log("✅ Resultado PagBank PIX:", JSON.stringify(resultadoPagBank, null, 2));

        return res.status(200).json({ 
            mensagem: "Cobrança PIX gerada com sucesso.",
            transacao: resultadoPagBank 
        });

    } catch (error) {
        console.error('❌ Erro na criação da cobrança PIX:', error);
        return res.status(500).json({ 
            erro: 'Falha ao gerar cobrança PIX.', 
            detalhe: error.message 
        });
    }
};