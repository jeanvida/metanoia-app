// src/services/pagamentos.js

// URL do backend em produção
const API_URL = "https://metanoia-app.onrender.com/api";

// Função utilitária para requisições POST
async function callPaymentApi(endpoint, data) {
    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (!response.ok) {
        throw new Error(
            responseData.detalhe ||
            responseData.erro ||
            responseData.mensagem ||
            "Falha na comunicação com o servidor."
        );
    }

    return responseData;
}

// Pagamento Cartão
export async function efetuarPagamentoCartao(dadosPagamento) {
    return callPaymentApi(`${API_URL}/pagar/cartao`, dadosPagamento);
}

// Pagamento PIX
export async function efetuarPagamentoPix(dadosPagamento) {
    return callPaymentApi(`${API_URL}/pagar/pix`, dadosPagamento);
}
