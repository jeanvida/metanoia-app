const pagbankService = require('../services/pagbank.service');

// === Prisma 7: import do caminho customizado ===
const { PrismaClient } = require('../generated/prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL }
  }
});
// ============================================

// ====================
// Cartão (APENAS PROD)
// ====================
exports.processarCartao = async (req, res) => {
    try {
        const dadosTransacao = req.body;
        console.log('Recebida requisição Cartão com dados:', JSON.stringify(dadosTransacao, null, 2));

        // Chama o serviço PagBank
        const resultadoPagBank = await pagbankService.processarTransacaoCartao(dadosTransacao); 
        console.log("✅ Resultado PagBank Cartão:", JSON.stringify(resultadoPagBank, null, 2));

        // Salva no banco (exemplo)
        await prisma.itemCardapio.create({
            data: {
                nome: "Exemplo Registro Cartão",
                descricao: JSON.stringify(resultadoPagBank),
                preco: 0,
                categoria: "transacoes"
            }
        });

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
// PIX (APENAS PROD)
// ====================
exports.processarPix = async (req, res) => {
    try {
        const dadosTransacao = req.body;
        console.log('Recebida requisição PIX com dados:', JSON.stringify(dadosTransacao, null, 2));

        const resultadoPagBank = await pagbankService.criarCobrancaPix(dadosTransacao);
        console.log("✅ Resultado PagBank PIX:", JSON.stringify(resultadoPagBank, null, 2));

        // Salva no banco (exemplo)
        await prisma.itemCardapio.create({
            data: {
                nome: "Exemplo Registro PIX",
                descricao: JSON.stringify(resultadoPagBank),
                preco: 0,
                categoria: "transacoes"
            }
        });

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
