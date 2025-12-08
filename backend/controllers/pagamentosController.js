const pagbankService = require('../services/pagbank.service');
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

// Função auxiliar para validar reCAPTCHA
async function validarRecaptcha(token) {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey || !token) {
        console.warn('reCAPTCHA não configurado ou token ausente');
        return true; // Permite se não estiver configurado
    }

    try {
        const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `secret=${secretKey}&response=${token}`
        });

        const data = await response.json();
        console.log('reCAPTCHA response:', { success: data.success, score: data.score });

        // Score 0.0 = bot, 1.0 = legítimo. Threshold: 0.5
        return data.success && data.score > 0.5;
    } catch (error) {
        console.error('Erro ao validar reCAPTCHA:', error);
        return false;
    }
}

// Cartão
exports.processarCartao = async (req, res) => {
    try {
        const dadosTransacao = req.body;
        
        // Validar reCAPTCHA
        const isValid = await validarRecaptcha(dadosTransacao.recaptchaToken);
        if (!isValid) {
            return res.status(403).json({ 
                erro: 'Validação de segurança falhou. Tente novamente.' 
            });
        }

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
        
        // Validar reCAPTCHA
        const isValid = await validarRecaptcha(dadosTransacao.recaptchaToken);
        if (!isValid) {
            return res.status(403).json({ 
                erro: 'Validação de segurança falhou. Tente novamente.' 
            });
        }

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
