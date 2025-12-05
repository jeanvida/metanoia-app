// backend/services/pagbank.service.js
const fetch = require('node-fetch');

// ===================================
// Configuração PagBank (FIXO: PRODUÇÃO)
// ===================================
// Estes valores serão lidos do seu .env
const API_URL = process.env.PAGBANK_API_URL;
const AUTH_TOKEN = process.env.PAGBANK_TOKEN;

// ===================================
// Chamada à API PagBank (FIXO: PRODUÇÃO)
// ===================================
async function callPagBankApi(endpoint, method, data = null) {
    const headers = {
        "Authorization": `Bearer ${AUTH_TOKEN}`, // Token de Produção
        "Content-Type": "application/json"
    };

    const config = { method, headers };
    if (data) config.body = JSON.stringify(data);

    console.log("➡️ Chamando PagBank API (PROD):", method, `${API_URL}/${endpoint}`);
    console.log("📦 Corpo enviado:", JSON.stringify(data, null, 2));

    const response = await fetch(`${API_URL}/${endpoint}`, config);

    let responseData = {};
    try {
        responseData = await response.json();
    } catch {
        responseData = { error_description: response.statusText || "Resposta não JSON" };
    }

    console.log("⬅️ Resposta PagBank status:", response.status);
    console.log("⬅️ Resposta PagBank corpo:", JSON.stringify(responseData, null, 2));

    if (!response.ok) {
        console.error("❌ Erro PagBank Detalhado:", response.status, responseData);
        throw new Error(
            responseData?.error_description || 
            responseData?.message || 
            response.statusText
        );
    }

    return responseData;
}

// ===================================
// Cobrança PIX (FINALMENTE CORRIGIDO PARA PROD)
// ===================================
exports.criarCobrancaPix = async (dados) => {
    try {
        const { cliente, valor, descricao } = dados;
        
        // Define a expiração para 30 minutos (em milissegundos)
        const expirationDate = new Date(Date.now() + 30 * 60 * 1000).toISOString(); 

        const body = {
            reference_id: `PIX-${Date.now()}`,
            description: descricao || "Pedido Cardápio Digital",
            amount: { value: valor, currency: "BRL" },
            
            // DADOS DO CLIENTE
            customer: {
                name: cliente.nome || "Cliente PIX Teste",
                email: cliente.email || "clientefinal@teste.com", 
                tax_id: cliente.cpf || "33333333333", 
                phones: [
                    {
                        country: "55",
                        area: cliente.telefone ? cliente.telefone.substring(0, 2) : "11",
                        number: cliente.telefone ? cliente.telefone.substring(2) : "999999999",
                        type: "MOBILE"
                    }
                ]
            },
            
            // ✅ CORREÇÃO 1: Campo 'payment_method' REMOVIDO para que o PagBank infira o PIX pelo qr_codes.
            
            // qr_codes no nível superior do body
            qr_codes: [{
                amount: { value: valor }, // O PagBank exige o valor aqui também
                expiration_date: expirationDate,
            }]
        };

        // ✅ CORREÇÃO 2: Endpoint alterado de "charges" para "charges/create"
        const resultado = await callPagBankApi("charges/create", "POST", body);
        console.log("✅ PIX criado com sucesso:", JSON.stringify(resultado, null, 2));
        return resultado;

    } catch (err) {
        console.error("❌ Erro ao criar PIX:", err);
        throw err; 
    }
};

// ===================================
// Pagamento Cartão (FIXO: PRODUÇÃO)
// ===================================
exports.processarTransacaoCartao = async (dados) => {
    try {
        const { cliente, total, cartao } = dados;

        let [exp_month, exp_year] = cartao.validade.split("/");
        if (exp_year.length === 2) exp_year = `20${exp_year}`;

        const body = {
            reference_id: `PEDIDO-${Date.now()}`,
            description: "Compra no Cardápio Digital",
            amount: { value: total, currency: "BRL" },
            payment_method: {
                type: "CREDIT_CARD",
                capture: true,
                installments: 1,
                card: {
                    number: cartao.numero.replace(/\s/g, ""),
                    exp_month,
                    exp_year,
                    security_code: cartao.cvv,
                    holder: {
                        name: cartao.nome,
                        tax_id: cliente.cpf || "33333333333" 
                    }
                }
            },
            customer: {
                name: cliente.nome || "Cliente Teste",
                email: cliente.email || "clientefinal@teste.com",
                tax_id: cliente.cpf || "33333333333",
                type: "individual",
                phones: [
                    {
                        country: "55",
                        area: cliente.telefone ? cliente.telefone.substring(0, 2) : "11",
                        number: cliente.telefone ? cliente.telefone.substring(2) : "999999999",
                        type: "MOBILE"
                    }
                ]
            },
            shipping: {
                address: {
                    street: cliente.endereco || "Rua Teste",
                    number: cliente.numero || "0",
                    complement: cliente.ap || "",
                    neighborhood: cliente.bairro || "Centro",
                    city: cliente.cidade || "Cidade",
                    state: cliente.uf || "SC",
                    zip_code: cliente.cep ? cliente.cep.replace(/\D/g, "") : "88340000",
                    country: "BRA"
                }
            }
        };

        const resultado = await callPagBankApi("charges", "POST", body);
        console.log("✅ Cartão processado com sucesso:", JSON.stringify(resultado, null, 2));
        return resultado;

    } catch (err) {
        console.error("❌ Erro ao processar Cartão:", err);
        throw new Error("Falha ao processar pagamento com cartão.");
    }
};