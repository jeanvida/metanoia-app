// src/services/pagamentos.js

// ATENÇÃO: Mude esta URL para o endereço do seu servidor backend quando for para a Produção real.
const API_BASE_URL = 'http://localhost:3001/api';

// Função utilitária para tratar requisições POST para a API
async function callPaymentApi(endpoint, data) {
    // REMOVIDO: A lógica de adicionar 'ambiente' ao 'data'

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    });

    const responseData = await response.json();

    // Se o status HTTP não for 2xx (Sucesso), lançamos um erro
    if (!response.ok) {
        // Usa a mensagem de erro do backend ou uma mensagem padrão
        throw new Error(responseData.detalhe || responseData.erro || responseData.mensagem || 'Falha na comunicação com o servidor.');
    }

    return responseData;
}

// Funções exportadas que serão usadas no Cardapio.jsx
export async function efetuarPagamentoCartao(dadosPagamento) {
    // Apenas envia os dados, sem o parâmetro 'ambiente'
    return callPaymentApi(`${API_BASE_URL}/pagar/cartao`, dadosPagamento);
}

export async function efetuarPagamentoPix(dadosPagamento) {
    // Apenas envia os dados, sem o parâmetro 'ambiente'
    return callPaymentApi(`${API_BASE_URL}/pagar/pix`, dadosPagamento);
}