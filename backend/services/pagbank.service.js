// backend/services/pagbank.service.js
const fetch = require('node-fetch');

// ===================================
// CONFIGURAÇÃO PAGBANK PRODUÇÃO
// ===================================
const API_URL = process.env.PAGBANK_API_URL;
const AUTH_TOKEN = process.env.PAGBANK_TOKEN;

// ===================================
// FUNÇÃO GENÉRICA PAGBANK
// ===================================
async function callPagBankApi(endpoint, method, data = null) {
    const headers = {
        "Authorization": `Bearer ${AUTH_TOKEN}`,
        "Content-Type": "application/json"
    };

    const config = { method, headers };
    if (data) config.body = JSON.stringify(data);

    console.log("➡️ Chamando:", `${API_URL}/${endpoint}`);
    console.log("📦 Body:", JSON.stringify(data, null, 2));

    const response = await fetch(`${API_URL}/${endpoint}`, config);

    let responseData;
    try {
        responseData = await response.json();
    } catch {
        responseData = { error: "Resposta não JSON" };
    }

    console.log("⬅️ Status:", response.status);
    console.log("⬅️ Resposta:", JSON.stringify(responseData, null, 2));

    if (!response.ok) {
        throw new Error(
            responseData?.message?.description ||
            responseData?.error ||
            "Erro desconhecido"
        );
    }

    return responseData;
}

// ===================================
// 1) PAGAMENTO PIX (100% CORRETO)
// ===================================
exports.criarCobrancaPix = async (dados) => {
    try {
        const { cliente, valor, descricao } = dados;

        const expiration = new Date(Date.now() + 30 * 60 * 1000).toISOString();

        const body = {
            reference_id: `PIX-${Date.now()}`,
            customer: {
                name: cliente.nome,
                email: cliente.email,
                tax_id: cliente.cpf,
            },
            items: [
                {
                    name: descricao || "Pedido Cardápio Digital",
                    quantity: 1,
                    unit_amount: valor
                }
            ],
            shipping: {
                address: {
                    street: cliente.endereco,
                    number: cliente.numero,
                    complement: cliente.ap || "",
                    locality: cliente.bairro,
                    city: cliente.cidade,
                    region: cliente.uf,
                    country: "BRA",
                    postal_code: cliente.cep.replace(/\D/g, "")
                }
            },
            payment_method: {
                type: "PIX",
                expiration_date: expiration
            }
        };

        // PIX na API nova é criado via /orders
        return await callPagBankApi("orders", "POST", body);

    } catch (err) {
        console.error("❌ Erro PIX:", err);
        throw err;
    }
};

// ===================================
// 2) PAGAMENTO CARTÃO (100% CORRETO)
// ===================================
exports.processarTransacaoCartao = async (dados) => {
    try {
        const { cliente, total, cartao } = dados;

        let [exp_month, exp_year] = cartao.validade.split("/");
        if (exp_year.length === 2) exp_year = "20" + exp_year;

        const body = {
            reference_id: `CARTAO-${Date.now()}`,
            customer: {
                name: cliente.nome,
                email: cliente.email,
                tax_id: cliente.cpf,
            },
            items: [
                {
                    name: "Compra no Cardápio Digital",
                    quantity: 1,
                    unit_amount: total
                }
            ],
            shipping: {
                address: {
                    street: cliente.endereco,
                    number: cliente.numero,
                    complement: cliente.ap || "",
                    locality: cliente.bairro,
                    city: cliente.cidade,
                    region: cliente.uf,
                    country: "BRA",
                    postal_code: cliente.cep.replace(/\D/g, "")
                }
            },
            payment_method: {
                type: "CREDIT_CARD",
                installments: 1,
                capture: true,
                card: {
                    number: cartao.numero.replace(/\s/g, ""),
                    exp_month,
                    exp_year,
                    security_code: cartao.cvv,
                    holder: {
                        name: cartao.nome,
                        tax_id: cliente.cpf
                    }
                }
            }
        };

        // Cartão também usa o endpoint /orders
        return await callPagBankApi("orders", "POST", body);

    } catch (err) {
        console.error("❌ Erro cartão:", err);
        throw err;
    }
};
