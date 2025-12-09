import { useState, useEffect } from "react";
// 1. Importando as fun  es de servi o que se comunicar o com o backend
import { efetuarPagamentoCartao, efetuarPagamentoPix } from "../services/pagamentos";
import { getRecaptchaToken, resetRecaptcha, SITE_KEY } from "../services/recaptcha";

// 1. Conectar ao backend: Definir uma constante API_URL no topo do arquivo
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export default function Cardapio() {
  const categorias = ["Hamburgueres", "Combos", "Acompanhamentos", "Bebidas"];
  const [categoriaAtiva, setCategoriaAtiva] = useState("Hamburgueres");
  const [modalImg, setModalImg] = useState(null);

  // ===== Checkout / Carrinho =====
  const [cliente, setCliente] = useState({});
  const [frete, setFrete] = useState({ cep: "", valor: 0, km: 0 });
  const [drawerAberto, setDrawerAberto] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState("carrinho"); // carrinho, checkout, pagamento

  // ===== Pagamento =====
  const [cartao, setCartao] = useState({
    numero: "",
    nome: "",
    validade: "",
    cvv: "",
  });

  // NOVOS STATES PARA FEEDBACK DE PAGAMENTO
  const [statusPagamento, setStatusPagamento] = useState("");
  const [loadingPagamento, setLoadingPagamento] = useState(false);
  const [pixData, setPixData] = useState(null);
  
  // Ponto 4: Hist rico de transa  es
  const [transacoes, setTransacoes] = useState([]);

  // ===== Produtos =====
  // Mantemos o estado inicial vazio/fixo, mas a l gica de carregamento ser  alterada no useEffect
  const produtosFixos = {
    Hamburgueres: [],
    Combos: [
      { id: 1, nome: "Combo Smash Simples", preco: 32, img: "combo.png" },
      { id: 2, nome: "Combo Duplo", preco: 37, img: "combo.png" },
    ],
    Acompanhamentos: [
      { id: 3, nome: "Fritas", preco: 12, img: "fritas.png" },
      { id: 4, nome: "Fritas Grande", preco: 18, img: "fritas.png" },
    ],
    Bebidas: [
      { id: 5, nome: "Coca-Cola", preco: 6, img: "coca.png" },
      { id: 6, nome: " gua", preco: 4, img: "coca.png" },
    ],
  };
  const [produtos, setProdutos] = useState(produtosFixos);

  // 2. Carregar itens do card pio via API e Ponto 4: Carregar hist rico de transa  es
  useEffect(() => {
    // Fun  o para carregar itens da API
    const carregarItens = async () => {
      try {
        // Substituir o carregamento do localStorage
        const response = await fetch(`${API_URL}/api/itens`);
        if (!response.ok) throw new Error('Falha ao buscar itens da API');
        const itens = await response.json();

        // Agrupar os itens por categoria e salvar no state produtos.
        const itensAgrupados = itens.reduce((acc, item) => {
          const categoria = item.categoria || 'Outros';
          if (!acc[categoria]) {
            acc[categoria] = [];
          }
          // Ajusta a estrutura para corresponder ao formato esperado
          acc[categoria].push({
            id: item.id,
            nome: item.nome,
            descricao: item.descricao,
            preco: Number(item.preco),
            img: item.foto || "burger.png",
          });
          return acc;
        }, { ...produtosFixos }); // Come a com os fixos para garantir as categorias

        setProdutos(itensAgrupados);

      } catch (error) {
        console.error("Erro ao carregar card pio da API:", error);
        // Mant m o fallback de localStorage (anteriormente apenas para Hamburgueres), mas agora vazio para seguir a instru  o.
        // O c digo original que carregava do localStorage (para Hamburgueres) foi removido daqui:
        /*
        const hamburgueresLS = localStorage.getItem("hamburgueres");
        if (hamburgueresLS) { ... }
        */
        // Se houver necessidade de manter os produtos fixos em caso de falha da API, descomente a linha abaixo:
        // setProdutos(produtosFixos); 
      }
    };
    
	// Ponto 4: Carregar e salvar hist rico de transa  es
    const carregarTransacoes = async () => {
        try {
            const response = await fetch(`${API_URL}/api/transacoes`);
            if (!response.ok) throw new Error('Falha ao buscar hist rico de transa  es');
            const txs = await response.json();
            setTransacoes(txs);
        } catch (error) {
            console.error("Erro ao carregar transa  es:", error);
        }
    };

    carregarItens();
    carregarTransacoes();
  }, []); // Executa apenas na montagem

  // ===== Carrinho (L gica de localStorage mantida) =====
  const [carrinho, setCarrinho] = useState([]);

  useEffect(() => {
    const carrinhoLS = localStorage.getItem("carrinho");
    if (carrinhoLS) setCarrinho(JSON.parse(carrinhoLS));
  }, []);

  useEffect(() => {
    localStorage.setItem("carrinho", JSON.stringify(carrinho));
  }, [carrinho]);

  function adicionarAoCarrinho(produto) {
    const existe = carrinho.find((item) => item.id === produto.id);
    if (existe) {
      setCarrinho(
        carrinho.map((item) =>
          item.id === produto.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        )
      );
    } else {
      setCarrinho([...carrinho, { ...produto, quantidade: 1 }]);
    }
    setDrawerAberto(true);
    setAbaAtiva("carrinho");
  }

  function removerDoCarrinho(id) {
    setCarrinho(carrinho.filter((item) => item.id !== id));
  }

  function alterarQuantidade(id, quantidade) {
    if (quantidade < 1) return;
    setCarrinho(
      carrinho.map((item) => (item.id === id ? { ...item, quantidade } : item))
    );
  }

  const total = carrinho.reduce(
    (acc, item) => acc + item.preco * item.quantidade,
    0
  );

  // ===== Frete autom tico / ViaCEP (Mantida) =====
  useEffect(() => {
    if (frete.cep.length === 8 || frete.cep.length === 9) {
      calcularFrete();
      buscarEnderecoPorCep(frete.cep);
    }
  }, [frete.cep]);

  function calcularFrete() {
    const cepCliente = frete.cep.replace(/\D/g, "");
    const cepBase = "88340000";
    const diferenca = Math.abs(Number(cepCliente) - Number(cepBase));
    const km = Math.max(1, Math.floor(diferenca / 1000));
    let valor = 5;
    if (km > 3) valor += (km - 3) * 2;
    setFrete({ ...frete, valor, km });
  }

  async function buscarEnderecoPorCep(cep) {
    const cepLimpo = cep.replace(/\D/g, "");
    if (cepLimpo.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setCliente({
          ...cliente,
          endereco: data.logradouro,
          bairro: data.bairro,
          cidade: data.localidade,
          uf: data.uf,
        });
      }
    } catch (err) {
      console.error("Erro ao buscar CEP:", err);
    }
  }

  // Fun  o Auxiliar para Criar Pedido no Backend (Ponto 3)
  async function criarPedidoBackend(statusPagamento) {
    const dadosPedido = {
      clienteNome: cliente.nome,
      clienteTelefone: cliente.telefone,
      itens: carrinho.map(item => ({
        itemId: item.id,
        quantidade: item.quantidade,
        precoUnit: item.preco
      })),
      valorTotal: total + frete.valor,
      tipoPagamento: statusPagamento.includes('PIX') ? 'PIX' : 'CARTAO',
      status: statusPagamento,
    };

    try {
      const response = await fetch(`${API_URL}/api/pedidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosPedido),
      });

      if (!response.ok) {
        throw new Error('Falha ao registrar pedido no backend.');
      }
      
      return await response.json(); // Retorna o pedido criado, se necess rio
    } catch (err) {
      console.error("Erro ao criar pedido:", err);
      return null;
    }
  }

  // ===== Pagamento - Fun  es de A  o =====

  function irParaPagamento() {
    setAbaAtiva("pagamento");
    setStatusPagamento(""); // Limpa o status ao entrar na aba
    setPixData(null); // Limpa os dados do PIX
  }

  async function pagarCartao() {
    setLoadingPagamento(true);
    setStatusPagamento("Validando seguran a...");
    setPixData(null);

    // Obter token reCAPTCHA
    const recaptchaToken = getRecaptchaToken();
    if (!recaptchaToken) {
      setStatusPagamento("Erro: Complete a verifica  o reCAPTCHA antes de continuar.");
      setLoadingPagamento(false);
      return;
    }

    const totalEmCentavos = Math.round((total + frete.valor) * 100);

    const dadosParaBackend = {
      cliente,
      total: totalEmCentavos,
      cartao,
      recaptchaToken,
    };

    if (cartao.numero.length < 16 || !cartao.cvv) {
      setStatusPagamento("Erro: Dados do cart o incompletos.");
      setLoadingPagamento(false);
      return;
    }

    try {
      setStatusPagamento("Processando pagamento com cart o...");
      const resultado = await efetuarPagamentoCartao(dadosParaBackend);
      const statusPagBank = resultado.transacao.status || "APROVADO";
      
      await criarPedidoBackend(statusPagBank); 

      setStatusPagamento(`Pagamento ${statusPagBank}! Transa  o ID: ${resultado.transacao.id}`);
      resetRecaptcha();
    } catch (err) {
      console.error("Erro ao pagar com Cart o:", err);
      setStatusPagamento(`Falha: ${err.message}`);
      resetRecaptcha();
    } finally {
      setLoadingPagamento(false);
    }
  }

  async function pagarPIX() {
    setLoadingPagamento(true);
    setStatusPagamento("Validando seguran a...");
    setPixData(null);

    // Obter token reCAPTCHA
    const recaptchaToken = getRecaptchaToken();
    if (!recaptchaToken) {
      setStatusPagamento("Erro: Complete a verifica  o reCAPTCHA antes de continuar.");
      setLoadingPagamento(false);
      return;
    }

    const totalEmCentavos = Math.round((total + frete.valor) * 100);

    const dadosParaBackend = {
      cliente,
      valor: totalEmCentavos,
      descricao: `Pedido #WEB-${Date.now()}`,
      recaptchaToken,
    };

    try {
      setStatusPagamento("Gerando cobran a PIX...");
      const resultado = await efetuarPagamentoPix(dadosParaBackend);
      const transacao = resultado.transacao || resultado;

      if (transacao && transacao.qr_codes && transacao.qr_codes.length > 0) {
        const pixCode = transacao.qr_codes[0];
        const qrCodeLink = pixCode.links.find(link => link.rel === 'qrcode');

        const pixDataFormatado = {
          qrCodeText: pixCode.text,
          qrCodeBase64: qrCodeLink.href.split(',')[1] 
        };

        setPixData(pixDataFormatado);
        setStatusPagamento("Cobran a PIX gerada com sucesso! Escaneie o QR Code.");
        resetRecaptcha();
        
        await criarPedidoBackend('PENDENTE');

      } else {
        setStatusPagamento("Falha: Resposta de PIX inv lida do PagBank.");
        resetRecaptcha();
      }
    } catch (err) {
      console.error("Erro ao pagar com PIX:", err);
      setStatusPagamento(`Falha ao gerar PIX: ${err.message}`);
    } finally {
      setLoadingPagamento(false);
    }
  }  return (
    <div style={styles.container}>

      {/* REMOVIDO: Seletor de Ambiente */}
      {/* ... */}

      <h1 style={styles.title}>Card pio</h1>

      {/* Tabs */}
      <div style={styles.tabs}>
        {categorias.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoriaAtiva(cat)}
            style={{
              ...styles.tabButton,
              ...(categoriaAtiva === cat ? styles.activeTab : {}),
            }}
          >
            {cat}
          </button>
        ))}
        {/* Resto do JSX continua inalterado... */}
      </div>

      {/* Produtos */}
      <div style={styles.produtos}>
        {produtos[categoriaAtiva] && produtos[categoriaAtiva].length === 0 ? (
          <p style={{ textAlign: "center" }}>
            Nenhum item nesta categoria ainda.
          </p>
        ) : (
          produtos[categoriaAtiva] && produtos[categoriaAtiva].map((item) => (
            <div key={item.id} style={styles.card}>
              <img
                src={item.img}
                alt={item.nome}
                style={styles.img}
                onClick={() => setModalImg(item.img)}
              />
              <h3 style={styles.cardTitle}>{item.nome}</h3>
              {item.descricao && (
                <p style={styles.descricao}>{item.descricao}</p>
              )}
              <p style={styles.preco}>R$ {item.preco.toFixed(2)}</p>
              <button
                style={styles.addBtn}
                onClick={() => adicionarAoCarrinho(item)}
              >
                Adicionar ao carrinho
              </button>
            </div>
          ))
        )}
      </div>

      {/* Drawer */}
      <div
        style={{
          ...styles.drawer,
          transform: drawerAberto ? "translateX(0)" : "translateX(100%)",
        }}
      >
        {/* Abas */}
        <div style={styles.abaContainer}>
          <button
            style={{
              ...styles.abaBtn,
              ...(abaAtiva === "carrinho" ? styles.abaAtiva : {}),
            }}
            onClick={() => setAbaAtiva("carrinho")}
          >
            Carrinho
          </button>
          <button
            style={{
              ...styles.abaBtn,
              ...(abaAtiva === "checkout" ? styles.abaAtiva : {}),
            }}
            onClick={() => setAbaAtiva("checkout")}
            disabled={carrinho.length === 0}
          >
            Checkout
          </button>
          <button
            style={{
              ...styles.abaBtn,
              ...(abaAtiva === "pagamento" ? styles.abaAtiva : {}),
            }}
            // Habilita o clique para voltar para a aba de pagamento
            onClick={() => setAbaAtiva("pagamento")}
          >
            Pagamento
          </button>
        </div>

        {/* Carrinho */}
        {abaAtiva === "carrinho" && (
          <>
            <h2>Carrinho</h2>
            {carrinho.length === 0 ? (
              <p>O carrinho est  vazio.</p>
            ) : (
              <>
                {carrinho.map((item) => (
                  <div key={item.id} style={styles.carrinhoItem}>
                    <span>
                      {item.nome} x{" "}
                      <input
                        type="number"
                        value={item.quantidade}
                        min={1}
                        onChange={(e) =>
                          alterarQuantidade(item.id, Number(e.target.value))
                        }
                        style={styles.quantInput}
                      />
                    </span>
                    <span>R$ {(item.preco * item.quantidade).toFixed(2)}</span>
                    <button
                      onClick={() => removerDoCarrinho(item.id)}
                      style={styles.removerBtn}
                    >
                      ?
                    </button>
                  </div>
                ))}
                <p style={{ fontWeight: "bold", marginTop: "10px" }}>
                  Total: R$ {total.toFixed(2)}
                </p>
                <button style={styles.finalizarBtn} onClick={() => setAbaAtiva("checkout")}>
                  Ir para Checkout
                </button>
              </>
            )}
          </>
        )}

        {/* Checkout */}
        {abaAtiva === "checkout" && (
          <div style={styles.checkout}>
            <h2>Checkout</h2>
            <div style={styles.section}>
              <h3>Endere o</h3>
              <input
                type="text"
                placeholder="CEP"
                value={frete.cep || ""}
                onChange={(e) => setFrete({ ...frete, cep: e.target.value })}
                style={styles.input}
              />
              <input
                type="text"
                placeholder="Rua"
                value={cliente.endereco || ""}
                onChange={(e) =>
                  setCliente({ ...cliente, endereco: e.target.value })
                }
                style={styles.input}
              />
              <input
                type="text"
                placeholder="N mero"
                value={cliente.numero || ""}
                onChange={(e) =>
                  setCliente({ ...cliente, numero: e.target.value })
                }
                style={styles.input}
              />
              <input
                type="text"
                placeholder="Ap / Casa"
                value={cliente.ap || ""}
                onChange={(e) => setCliente({ ...cliente, ap: e.target.value })}
                style={styles.input}
              />
              <input
                type="text"
                placeholder="Bairro"
                value={cliente.bairro || ""}
                onChange={(e) =>
                  setCliente({ ...cliente, bairro: e.target.value })
                }
                style={styles.input}
              />
              <input
                type="text"
                placeholder="Cidade"
                value={cliente.cidade || ""}
                onChange={(e) =>
                  setCliente({ ...cliente, cidade: e.target.value })
                }
                style={styles.input}
              />
              <input
                type="text"
                placeholder="UF"
                value={cliente.uf || ""}
                onChange={(e) => setCliente({ ...cliente, uf: e.target.value })}
                style={styles.input}
              />
            </div>
            <div style={styles.section}>
              <h3>Cliente</h3>
              <input
                type="text"
                placeholder="Nome"
                value={cliente.nome || ""}
                onChange={(e) =>
                  setCliente({ ...cliente, nome: e.target.value })
                }
                style={styles.input}
              />
<input
  type="email"
  placeholder="Email"
  value={cliente.email || ""}
  onChange={(e) => setCliente({ ...cliente, email: e.target.value })}
  style={styles.input}
/>
<input
  type="text"
  placeholder="CPF (somente n meros)"
  value={cliente.cpf || ""}
  onChange={(e) => setCliente({ ...cliente, cpf: e.target.value.replace(/\D/g, "") })}
  style={styles.input}
  maxLength="11"
/>
              <input
                type="tel"
                placeholder="Telefone"
                value={cliente.telefone || ""}
                onChange={(e) =>
                  setCliente({ ...cliente, telefone: e.target.value })
                }
                style={styles.input}
              />
            </div>
            <div style={styles.section}>
              <h3>Resumo do Pedido</h3>
              {carrinho.map((item) => (
                <div key={item.id} style={styles.resumoItem}>
                  <span>
                    {item.nome} x {item.quantidade}
                  </span>
                  <span>R$ {(item.preco * item.quantidade).toFixed(2)}</span>
                </div>
              ))}
              <div style={styles.resumoItem}>
                <span>Frete ({frete.km}km)</span>
                <span>R$ {frete.valor.toFixed(2)}</span>
              </div>
              <p style={styles.total}>
                Total: R$ {(total + frete.valor).toFixed(2)}
              </p>
              <button style={styles.finalizarBtn} onClick={irParaPagamento}>
                Ir para Pagamento
              </button>
            </div>
          </div>
        )}

        {/* Pagamento */}
        {abaAtiva === "pagamento" && (
          <div style={styles.checkout}>
            <h2>Pagamento</h2>
            
            {/* Feedback de status */}
            <p style={{ fontWeight: 'bold', color: loadingPagamento ? 'blue' : (statusPagamento.includes('Falha') ? 'red' : 'green') }}>
                {loadingPagamento ? 'Aguarde...' : statusPagamento}
            </p>

            <div style={styles.section}>
              <h3>Cart o de Cr dito</h3>
              <input
                type="text"
                placeholder="N mero do cart o"
                value={cartao.numero || ""}
                onChange={(e) =>
                  setCartao({ ...cartao, numero: e.target.value })
                }
                style={styles.input}
              />
              <input
                type="text"
                placeholder="Nome no cart o"
                value={cartao.nome || ""}
                onChange={(e) =>
                  setCartao({ ...cartao, nome: e.target.value })
                }
                style={styles.input}
              />
              <input
                type="text"
                placeholder="MM/AA"
                value={cartao.validade || ""}
                onChange={(e) =>
                  setCartao({ ...cartao, validade: e.target.value })
                }
                style={styles.input}
              />
              <input
                type="text"
                placeholder="CVV"
                value={cartao.cvv || ""}
                onChange={(e) =>
                  setCartao({ ...cartao, cvv: e.target.value })
                }
                style={styles.input}
              />

              {/* reCAPTCHA v2 */}
              {SITE_KEY && (
                <div style={{ margin: '15px 0' }}>
                  <div className="g-recaptcha" data-sitekey={SITE_KEY}></div>
                </div>
              )}

              <button 
                style={styles.finalizarBtn} 
                onClick={pagarCartao}
                disabled={loadingPagamento} // Desabilita durante o processamento
              >
                Pagar com Cart o
              </button>
            </div>
            <div style={styles.section}>
              <h3>PIX</h3>
              <button 
                style={styles.finalizarBtn} 
                onClick={pagarPIX}
                disabled={loadingPagamento} // Desabilita durante o processamento
              >
                Pagar com PIX
              </button>
            </div>

            {/* Exibi  o do QR Code do PIX (se gerado) */}
            {pixData && pixData.qrCodeBase64 && (
                <div style={styles.section}>
                    <h4>Escaneie para Pagar</h4>
                    <img 
                        src={`data:image/png;base64,${pixData.qrCodeBase64}`} 
                        alt="QR Code PIX" 
                        style={{ width: '100%', maxWidth: '250px', margin: '10px auto', display: 'block' }}
                    />
                    <p>Ou use o c digo Pix Copia e Cola:</p>
                    <input 
                        type="text" 
                        value={pixData.qrCodeText} 
                        readOnly 
                        style={{ ...styles.input, marginTop: '5px' }}
                    />
                </div>
            )}
            
            {/* Ponto 4: Hist rico de transa  es */}
            <div style={styles.section}>
              <h3>Hist rico de Transa  es</h3>
              <ul>
                {transacoes.length === 0 ? (
                    <p>Nenhuma transa  o encontrada.</p>
                ) : (
                    transacoes.map(tx => (
                      // Adaptei para mostrar campos comuns em transa  es, assumindo que h  id, tipo, e createdAt
                      <li key={tx.id}>
                        {tx.tipo} - {new Date(tx.createdAt).toLocaleString()}
                      </li>
                    ))
                )}
              </ul>
            </div>

          </div>
        )}
      </div>

      {/* Modal (Mantido) */}
      {modalImg && (
        <div style={styles.modalOverlay} onClick={() => setModalImg(null)}>
          <div
            style={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <img src={modalImg} alt="" style={styles.modalImg} />
            <button
              style={styles.closeBtn}
              onClick={() => setModalImg(null)}
            >
              X
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== ESTILOS (Sem altera  es) =====
const styles = {
// ... (Mantenha seus estilos originais aqui)
  container: { padding: "20px", position: "relative" },
  title: { fontSize: "32px", fontWeight: "bold", color: "#000", marginBottom: "20px" },
  tabs: { display: "flex", gap: "10px", justifyContent: "center", marginBottom: "25px", flexWrap: "wrap" },
  tabButton: { padding: "10px 18px", borderRadius: "10px", border: "2px solid #000", backgroundColor: "#fff", color: "#000", fontWeight: "bold", cursor: "pointer", fontSize: "16px" },
  activeTab: { backgroundColor: "#000", color: "#F1B100" },
  produtos: { display: "flex", flexDirection: "column", gap: "20px" },
  card: { backgroundColor: "#fff", borderRadius: "15px", padding: "15px", textAlign: "center", border: "2px solid #000" },
  img: { width: "100%", maxWidth: "300px", height: "auto", borderRadius: "12px", cursor: "pointer" },
  cardTitle: { marginTop: "10px", fontSize: "20px", fontWeight: "bold", color: "#000" },
  descricao: { marginTop: "5px", fontSize: "16px", color: "#333" },
  preco: { marginTop: "5px", fontSize: "18px", color: "#000" },
  addBtn: { marginTop: "10px", padding: "10px 20px", backgroundColor: "#000", color: "#F1B100", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" },
  drawer: { position: "fixed", top: 0, right: 0, width: "100%", maxWidth: "400px", height: "100vh", backgroundColor: "#fff", borderLeft: "2px solid #000", padding: "10px 20px", boxShadow: "-4px 0 10px rgba(0,0,0,0.2)", zIndex: 1000, display: "flex", flexDirection: "column", transition: "transform 0.3s ease", overflowY: "auto" },
  abaContainer: { display: "flex", gap: "5px", marginBottom: "15px" },
  abaBtn: { flex: 1, padding: "8px 0", fontWeight: "bold", cursor: "pointer", borderRadius: "6px", border: "1px solid #000", backgroundColor: "#fff" },
  abaAtiva: { backgroundColor: "#000", color: "#F1B100" },
  carrinhoItem: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" },
  quantInput: { width: "50px", padding: "3px", marginLeft: "5px", textAlign: "center" },
  removerBtn: { background: "#000", color: "#F1B100", border: "none", borderRadius: "5px", padding: "5px 10px", cursor: "pointer", marginLeft: "10px" },
  finalizarBtn: { marginTop: "10px", padding: "12px", backgroundColor: "#000", color: "#F1B100", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: "pointer" },
  checkout: { display: "flex", flexDirection: "column", gap: "15px" },
  section: { marginBottom: "15px", display: "flex", flexDirection: "column", gap: "5px" },
  input: { padding: "8px", borderRadius: "6px", border: "1px solid #000" },
  resumoItem: { display: "flex", justifyContent: "space-between", marginBottom: "5px" },
  total: { fontWeight: "bold", marginTop: "10px", fontSize: "18px" },
  modalOverlay: { position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 999 },
  modalContent: { position: "relative", backgroundColor: "#fff", padding: "20px", borderRadius: "15px", border: "3px solid #000" },
  modalImg: { width: "100%", maxWidth: "600px", height: "auto", borderRadius: "12px" },
  closeBtn: { position: "absolute", top: "10px", right: "10px", background: "#000", color: "#F1B100", border: "none", padding: "5px 10px", cursor: "pointer", borderRadius: "5px", fontWeight: "bold" },
};

