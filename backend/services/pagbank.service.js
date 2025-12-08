// backend/services/pagbank.service.js

// No Node 18+, fetch já existe
const fetchFn = globalThis.fetch || require('node-fetch');

const API_URL = process.env.PAGBANK_API_URL;
const AUTH_TOKEN = process.env.PAGBANK_TOKEN;

async function callPagBankApi(endpoint, method, data = null) {
    const headers = {
        "Authorization": `Bearer ${AUTH_TOKEN}`,
        "Content-Type": "application/json"
    };

    const config = { method, headers };
    if (data) config.body = JSON.stringify(data);

    console.log("➡️ Chamando:", `${API_URL}/${endpoint}`);
    console.log("📦 Body:", JSON.stringify(data, null, 2));

    const response = await fetchFn(`${API_URL}/${endpoint}`, config);

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

exports.criarCobrancaPix = async (dados) => {
    try {
        const { cliente, valor, descricao } = dados;
        if (!cliente || !valor) throw new Error("Dados do cliente ou valor faltando");

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
                    street: cliente.endereco || "",
                    number: cliente.numero || "",
                    complement: cliente.ap || "",
                    locality: cliente.bairro || "",
                    city: cliente.cidade || "",
                    region: cliente.uf || "",
                    country: "BRA",
                    postal_code: (cliente.cep || "").replace(/\D/g, "")
                }
            },
            payment_method: {
                type: "PIX",
                expiration_date: expiration
            }
        };

        return await callPagBankApi("orders", "POST", body);

    } catch (err) {
        console.error("❌ Erro PIX:", err);
        throw err;
    }
};

exports.processarTransacaoCartao = async (dados) => {
    try {
        const { cliente, total, cartao } = dados;
        if (!cliente || !total || !cartao) throw new Error("Dados incompletos para cartão");

        // Validações robustas
        if (!cartao.validade) throw new Error("Validade do cartão é obrigatória");
        if (!cartao.numero) throw new Error("Número do cartão é obrigatório");
        if (!cartao.cvv) throw new Error("CVV é obrigatório");
        if (!cartao.nome) throw new Error("Nome do titular é obrigatório");

        let [exp_month, exp_year] = (cartao.validade || "01/30").split("/");
        if (exp_year && exp_year.length === 2) exp_year = "20" + exp_year;

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
                    street: cliente.endereco || "",
                    number: cliente.numero || "",
                    complement: cliente.ap || "",
                    locality: cliente.bairro || "",
                    city: cliente.cidade || "",
                    region: cliente.uf || "",
                    country: "BRA",
                    postal_code: (cliente.cep || "").replace(/\D/g, "")
                }
            },
            payment_method: {
                type: "CREDIT_CARD",
                installments: 1,
                capture: true,
                card: {
                    number: (cartao.numero || "").replace(/\s/g, ""),
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

        return await callPagBankApi("orders", "POST", body);

    } catch (err) {
        console.error("❌ Erro cartão:", err);
        throw err;
    }
};
