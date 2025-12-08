// Cartão
exports.processarCartao = async (req, res) => {
    try {
        const dadosTransacao = req.body;
        const resultadoPagBank = await pagbankService.processarTransacaoCartao(dadosTransacao);

        await prisma.transacaoPagamento.create({
            data: {
                tipo: "CARTAO",
                dados: JSON.stringify(resultadoPagBank),
            }
        });

        return res.status(200).json({ 
            mensagem: "Transação enviada para PagBank.",
            transacao: resultadoPagBank 
        });

    } catch (error) {
        console.error('Erro no processamento do Cartão:', error);
        return res.status(500).json({ 
            erro: 'Falha ao processar pagamento com cartão.', 
            detalhe: error.message 
        });
    }
};

// PIX
exports.processarPix = async (req, res) => {
    try {
        const dadosTransacao = req.body;
        const resultadoPagBank = await pagbankService.criarCobrancaPix(dadosTransacao);

        await prisma.transacaoPagamento.create({
            data: {
                tipo: "PIX",
                dados: JSON.stringify(resultadoPagBank),
            }
        });

        return res.status(200).json({ 
            mensagem: "Cobrança PIX gerada com sucesso.",
            transacao: resultadoPagBank 
        });

    } catch (error) {
        console.error('Erro na criação da cobrança PIX:', error);
        return res.status(500).json({ 
            erro: 'Falha ao gerar cobrança PIX.', 
            detalhe: error.message 
        });
    }
};
