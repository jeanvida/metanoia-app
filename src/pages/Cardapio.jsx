import { useState, useEffect, useRef } from "react";
// 1. Importando as fun  es de servi o que se comunicar o com o backend
import { efetuarPagamentoCartao, efetuarPagamentoPix } from "../services/pagamentos";
import { getRecaptchaToken, resetRecaptcha, SITE_KEY } from "../services/recaptcha";
import { useLanguage } from "../contexts/LanguageContext";
import { translations, getTranslation } from "../i18n/translations";

// 1. Conectar ao backend: Definir uma constante API_URL no topo do arquivo
const API_URL = import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname === 'localhost' 
    ? "http://localhost:3001" 
    : "https://metanoia-app.onrender.com");

export default function Cardapio() {
  const { idioma, setIdioma } = useLanguage(); // Usar contexto de idioma
  const t = (key) => getTranslation(idioma, key); // Função helper
  
  const categorias = ["Hambúrgueres", "Combos", "Acompanhamentos", "Bebidas"];
  const [categoriaAtiva, setCategoriaAtiva] = useState("Hambúrgueres");
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
  const [mostrarFormCartao, setMostrarFormCartao] = useState(false);
  const [mostrarRecaptcha, setMostrarRecaptcha] = useState(false);
  const [mostrarBotaoPix, setMostrarBotaoPix] = useState(true);
  
  // Ponto 4: Hist rico de transa  es
  const [transacoes, setTransacoes] = useState([]);
  
  // Ref para o container do reCAPTCHA
  const recaptchaRef = useRef(null);

  // ===== Produtos =====
  // Produtos vêm 100% da API
  const produtosFixos = {
    Hamburgueres: [],
    Combos: [],
    Acompanhamentos: [],
    Bebidas: [],
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
          const categoriaNome = item.categoria?.nome || 'Outros';
          if (!acc[categoriaNome]) {
            acc[categoriaNome] = [];
          }
          // Ajusta a estrutura para corresponder ao formato esperado
          acc[categoriaNome].push({
            id: item.id,
            nome: item.nome,
            descricao: item.descricao,
            descricaoES: item.descricaoES,
            descricaoEN: item.descricaoEN,
            preco: Number(item.preco),
            img: item.img || "burger.png",
            selo: item.selo,
          });
          return acc;
        }, { ...produtosFixos }); // Come a com os fixos para garantir as categorias

        setProdutos(itensAgrupados);

      } catch (error) {
        console.error("Erro ao carregar cardápio da API:", error);
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
            if (!response.ok) throw new Error('Falha ao buscar histórico de transações');
            const txs = await response.json();
            setTransacoes(txs);
        } catch (error) {
            console.error("Erro ao carregar transações:", error);
        }
    };

    carregarItens();
    carregarTransacoes();
  }, []); // Executa apenas na montagem

  // Renderizar reCAPTCHA quando mostrarRecaptcha for true
  useEffect(() => {
    if (mostrarRecaptcha && SITE_KEY && recaptchaRef.current && !recaptchaRef.current.hasChildNodes()) {
      try {
        window.grecaptcha.render(recaptchaRef.current, {
          sitekey: SITE_KEY,
        });
      } catch (error) {
        console.error("Erro ao renderizar reCAPTCHA:", error);
      }
    }
  }, [mostrarRecaptcha]);

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
    setStatusPagamento("Validando segurança...");
    setPixData(null);

    // Obter token reCAPTCHA
    const recaptchaToken = getRecaptchaToken();
    if (!recaptchaToken) {
      setStatusPagamento("Erro: Complete a verificação do reCAPTCHA antes de continuar.");
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
      setStatusPagamento("Erro: Dados do cartão incompletos.");
      setLoadingPagamento(false);
      return;
    }

    try {
      setStatusPagamento("Processando pagamento com cartão...");
      const resultado = await efetuarPagamentoCartao(dadosParaBackend);
      const statusPagBank = resultado.transacao.status || "APROVADO";
      
      await criarPedidoBackend(statusPagBank); 

      setStatusPagamento(`Pagamento ${statusPagBank}! Transação ID: ${resultado.transacao.id}`);
      resetRecaptcha();
    } catch (err) {
      console.error("Erro ao pagar com cartão:", err);
      setStatusPagamento(`Falha: ${err.message}`);
      resetRecaptcha();
    } finally {
      setLoadingPagamento(false);
    }
  }

  async function pagarPIX() {
    setLoadingPagamento(true);
    setStatusPagamento("Validando segurança...");
    setPixData(null);

    // Obter token reCAPTCHA
    const recaptchaToken = getRecaptchaToken();
    if (!recaptchaToken) {
      setStatusPagamento("Erro: Complete a verificação do reCAPTCHA antes de continuar.");
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
      setStatusPagamento("Gerando cobrança PIX...");
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
        setStatusPagamento("Cobrança PIX gerada com sucesso! Escaneie o QR Code.");
        resetRecaptcha();
        
        await criarPedidoBackend('PENDENTE');

      } else {
        setStatusPagamento("Falha: Resposta de PIX inválida do PagBank.");
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

      {/* Seletor de Idioma */}
      <div style={styles.languageSelector}>
        <button 
          onClick={() => setIdioma("pt")} 
          style={{
            ...styles.flagBtn,
            ...(idioma === "pt" ? styles.flagBtnActivePT : {})
          }}
          title="Português"
        >
          PT
        </button>
        <button 
          onClick={() => setIdioma("es")} 
          style={{
            ...styles.flagBtn,
            ...(idioma === "es" ? styles.flagBtnActiveES : {})
          }}
          title="Español"
        >
          ES
        </button>
        <button 
          onClick={() => setIdioma("en")} 
          style={{
            ...styles.flagBtn,
            ...(idioma === "en" ? styles.flagBtnActiveEN : {})
          }}
          title="English"
        >
          EN
        </button>
      </div>

      {/* Ícone do Carrinho */}
      <button
        onClick={() => {
          setDrawerAberto(true);
          setAbaAtiva("carrinho");
        }}
        style={styles.carrinhoIconBtn}
      >
        <img src="/cart.png" alt="Carrinho" style={{ width: '30px', height: '30px' }} />
        {carrinho.length > 0 && (
          <span style={{ fontSize: '12px', marginLeft: '5px' }}>
            ({carrinho.reduce((acc, item) => acc + item.quantidade, 0)})
          </span>
        )}
      </button>

      <h1 style={styles.title}>{t("cardapio")}</h1>

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
            {t(cat)}
          </button>
        ))}
        {/* Resto do JSX continua inalterado... */}
      </div>

      {/* Produtos */}
      <div style={{
        ...styles.produtos,
        ...(produtos[categoriaAtiva] && produtos[categoriaAtiva].length === 1 ? styles.produtosUnico : {})
      }}>
        {produtos[categoriaAtiva] && produtos[categoriaAtiva].length === 0 ? (
          <p style={{ textAlign: "center" }}>
            Nenhum item nesta categoria ainda.
          </p>
        ) : (
          produtos[categoriaAtiva] && produtos[categoriaAtiva].map((item) => (
            <div key={item.id} style={styles.card}>
              <div style={styles.cardImageContainer}>
                {item.selo && (
                  <div style={{
                    ...styles.selo,
                    ...(item.selo === 'maisVendido' ? styles.seloMaisVendido : styles.seloEspecial)
                  }}>
                    {t(item.selo)}
                  </div>
                )}
                <img
                  src={item.img}
                  alt={item.nome}
                  style={styles.img}
                  onClick={() => setModalImg(item.img)}
                />
              </div>
              <div style={styles.cardContent}>
                <h3 style={styles.cardTitle}>{item.nome}</h3>
                {(item.descricao || item.descricaoES || item.descricaoEN) && (
                  <p style={styles.descricao}>
                    {idioma === 'es' ? (item.descricaoES || item.descricao) : 
                     idioma === 'en' ? (item.descricaoEN || item.descricao) : 
                     item.descricao}
                  </p>
                )}
                <div style={styles.cardFooter}>
                  <p style={styles.preco}>R$ {item.preco.toFixed(2)}</p>
                  <button
                    style={styles.addBtn}
                    onClick={() => adicionarAoCarrinho(item)}
                  >
                    {t("adicionar")}
                  </button>
                </div>
              </div>
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
        {/* Botão Fechar */}
        <button
          onClick={() => setDrawerAberto(false)}
          style={{
            ...styles.fecharDrawerBtn,
            opacity: drawerAberto ? 1 : 0,
            transition: "opacity 0.3s ease"
          }}
        >
          ▶
        </button>
        
        {/* Abas */}
        <div style={styles.abaContainer}>
          <button
            style={{
              ...styles.abaBtn,
              ...(abaAtiva === "carrinho" ? styles.abaAtiva : {}),
            }}
            onClick={() => setAbaAtiva("carrinho")}
          >
            {t("carrinho")}
          </button>
          <button
            style={{
              ...styles.abaBtn,
              ...(abaAtiva === "checkout" ? styles.abaAtiva : {}),
            }}
            onClick={() => setAbaAtiva("checkout")}
            disabled={carrinho.length === 0}
          >
            {t("checkout")}
          </button>
          <button
            style={{
              ...styles.abaBtn,
              ...(abaAtiva === "pagamento" ? styles.abaAtiva : {}),
            }}
            // Habilita o clique para voltar para a aba de pagamento
            onClick={() => setAbaAtiva("pagamento")}
          >
            {t("pagamento")}
          </button>
        </div>

        {/* Carrinho */}
        {abaAtiva === "carrinho" && (
          <div style={{
            maxHeight: '70vh',
            overflowY: 'auto',
            paddingRight: '10px'
          }}>
            <h2>{t("carrinho")}</h2>
            {carrinho.length === 0 ? (
              <p>{t("carrinhoVazio")}</p>
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
                        placeholder={t("quantidade")}
                      />
                    </span>
                    <span>R$ {(item.preco * item.quantidade).toFixed(2)}</span>
                    <button
                      onClick={() => removerDoCarrinho(item.id)}
                      style={styles.removerBtn}
                    >
                      x
                    </button>
                  </div>
                ))}
                <p style={{ fontWeight: "bold", marginTop: "10px" }}>
                  {t("total")}: R$ {total.toFixed(2)}
                </p>
                <button style={styles.finalizarBtn} onClick={() => setAbaAtiva("checkout")}>
                  {t("irParaCheckout")}
                </button>
              </>
            )}
          </div>
        )}

        {/* Checkout */}
        {abaAtiva === "checkout" && (
          <div style={styles.checkout}>
            <h2>{t("checkout")}</h2>
            <div style={styles.section}>
              <h3>{t("endereco")}</h3>
              <input
                type="text"
                placeholder={t("cep")}
                value={frete.cep || ""}
                onChange={(e) => setFrete({ ...frete, cep: e.target.value })}
                style={styles.input}
              />
              <input
                type="text"
                placeholder={t("rua")}
                value={cliente.endereco || ""}
                onChange={(e) =>
                  setCliente({ ...cliente, endereco: e.target.value })
                }
                style={styles.input}
              />
              <input
                type="text"
                placeholder={t("numero")}
                value={cliente.numero || ""}
                onChange={(e) =>
                  setCliente({ ...cliente, numero: e.target.value })
                }
                style={styles.input}
              />
              <input
                type="text"
                placeholder={t("apCasa")}
                value={cliente.ap || ""}
                onChange={(e) => setCliente({ ...cliente, ap: e.target.value })}
                style={styles.input}
              />
              <input
                type="text"
                placeholder={t("bairro")}
                value={cliente.bairro || ""}
                onChange={(e) =>
                  setCliente({ ...cliente, bairro: e.target.value })
                }
                style={styles.input}
              />
              <input
                type="text"
                placeholder={t("cidade")}
                value={cliente.cidade || ""}
                onChange={(e) =>
                  setCliente({ ...cliente, cidade: e.target.value })
                }
                style={styles.input}
              />
              <input
                type="text"
                placeholder={t("estado")}
                value={cliente.uf || ""}
                onChange={(e) => setCliente({ ...cliente, uf: e.target.value })}
                style={styles.input}
              />
            </div>
            <div style={styles.section}>
              <h3>{t("dadosPessoais")}</h3>
              <input
                type="text"
                placeholder={t("nome")}
                value={cliente.nome || ""}
                onChange={(e) =>
                  setCliente({ ...cliente, nome: e.target.value })
                }
                style={styles.input}
              />
<input
  type="email"
  placeholder={t("email")}
  value={cliente.email || ""}
  onChange={(e) => setCliente({ ...cliente, email: e.target.value })}
  style={styles.input}
/>
<input
  type="text"
  placeholder={t("cpf")}
  value={cliente.cpf || ""}
  onChange={(e) => setCliente({ ...cliente, cpf: e.target.value.replace(/\D/g, "") })}
  style={styles.input}
  maxLength="11"
/>
              <input
                type="tel"
                placeholder={t("telefone")}
                value={cliente.telefone || ""}
                onChange={(e) =>
                  setCliente({ ...cliente, telefone: e.target.value })
                }
                style={styles.input}
              />
            </div>
            <div style={styles.section}>
              <h3>{t("resumoPedido")}</h3>
              {carrinho.map((item) => (
                <div key={item.id} style={styles.resumoItem}>
                  <span>
                    {item.nome} x {item.quantidade}
                  </span>
                  <span>R$ {(item.preco * item.quantidade).toFixed(2)}</span>
                </div>
              ))}
              <div style={styles.resumoItem}>
                <span>{t("frete")} ({frete.km}km)</span>
                <span>R$ {frete.valor.toFixed(2)}</span>
              </div>
              <p style={styles.total}>
                {t("total")}: R$ {(total + frete.valor).toFixed(2)}
              </p>
              <button style={styles.finalizarBtn} onClick={irParaPagamento}>
                {t("irParaPagamento")}
              </button>
            </div>
          </div>
        )}

        {/* Pagamento */}
        {abaAtiva === "pagamento" && (
          <div style={{
            ...styles.checkout,
            maxHeight: '70vh',
            overflowY: 'auto',
            paddingRight: '10px'
          }}>
            <h2>{t("pagamento")}</h2>
            
            {/* Feedback de status */}
            <p style={{ fontWeight: 'bold', color: loadingPagamento ? 'blue' : (statusPagamento.includes('Falha') ? 'red' : 'green') }}>
                {loadingPagamento ? 'Aguarde...' : statusPagamento}
            </p>

            <div style={styles.section}>
              <h3>{t("cartaoCredito")}</h3>
              
              {!mostrarFormCartao ? (
                <button 
                  style={styles.finalizarBtn} 
                  onClick={() => {
                    setMostrarFormCartao(true);
                    setMostrarRecaptcha(true);
                  }}
                >
                  {t("pagarComCartao")}
                </button>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder={t("numeroCartao")}
                    value={cartao.numero || ""}
                    onChange={(e) =>
                      setCartao({ ...cartao, numero: e.target.value })
                    }
                    style={styles.input}
                  />
                  <input
                    type="text"
                    placeholder={t("nomeCartao")}
                    value={cartao.nome || ""}
                    onChange={(e) =>
                      setCartao({ ...cartao, nome: e.target.value })
                    }
                    style={styles.input}
                  />
                  <input
                    type="text"
                    placeholder={t("validade")}
                    value={cartao.validade || ""}
                    onChange={(e) =>
                      setCartao({ ...cartao, validade: e.target.value })
                    }
                    style={styles.input}
                  />
                  <input
                    type="text"
                    placeholder={t("cvv")}
                    value={cartao.cvv || ""}
                    onChange={(e) =>
                      setCartao({ ...cartao, cvv: e.target.value })
                    }
                    style={styles.input}
                  />

                  <button 
                    style={styles.finalizarBtn} 
                    onClick={pagarCartao}
                    disabled={loadingPagamento}
                  >
                    {t("confirmarPagamento")}
                  </button>
                  <button 
                    style={{ ...styles.finalizarBtn, backgroundColor: '#666', marginTop: '10px' }} 
                    onClick={() => {
                      setMostrarFormCartao(false);
                      setMostrarRecaptcha(false);
                      resetRecaptcha();
                    }}
                  >
                    {t("cancelar")}
                  </button>
                </>
              )}
            </div>
            <div style={styles.section}>
              <h3>{t("pix")}</h3>
              {mostrarBotaoPix ? (
                <button 
                  style={styles.finalizarBtn} 
                  onClick={() => {
                    setMostrarBotaoPix(false);
                    setMostrarRecaptcha(true);
                  }}
                  disabled={loadingPagamento}
                >
                  {t("pagarComPix")}
                </button>
              ) : (
                <>
                  <button 
                    style={styles.finalizarBtn} 
                    onClick={pagarPIX}
                    disabled={loadingPagamento}
                  >
                    {t("confirmarPagamento")}
                  </button>
                  <button 
                    style={{ ...styles.finalizarBtn, backgroundColor: '#666', marginTop: '10px' }} 
                    onClick={() => {
                      setMostrarBotaoPix(true);
                      setMostrarRecaptcha(false);
                      resetRecaptcha();
                    }}
                  >
                    {t("cancelar")}
                  </button>
                </>
              )}
            </div>

            {/* reCAPTCHA v2 - Central para ambas as opcoes */}
            {mostrarRecaptcha && SITE_KEY && (
              <div style={styles.section}>
                <div style={{ margin: '15px 0' }}>
                  <div ref={recaptchaRef}></div>
                </div>
              </div>
            )}

            {/* Exibicao do QR Code do PIX (se gerado) */}
            {pixData && pixData.qrCodeBase64 && (
                <div style={styles.section}>
                    <h4>Escaneie para Pagar</h4>
                    <img 
                        src={`data:image/png;base64,${pixData.qrCodeBase64}`} 
                        alt="QR Code PIX" 
                        style={{ width: '100%', maxWidth: '250px', margin: '10px auto', display: 'block' }}
                    />
                    <p>Ou use o código Pix Copia e Cola:</p>
                    <input 
                        type="text" 
                        value={pixData.qrCodeText} 
                        readOnly 
                        style={{ ...styles.input, marginTop: '5px' }}
                    />
                </div>
            )}
            
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
const isMobile = window.innerWidth <= 768;

const styles = {
// ... (Mantenha seus estilos originais aqui)
  container: { padding: isMobile ? "10px" : "20px", position: "relative" },
  languageSelector: { 
    position: "fixed", 
    top: isMobile ? "10px" : "20px", 
    left: isMobile ? "10px" : "20px", 
    display: "flex", 
    gap: isMobile ? "6px" : "10px", 
    zIndex: 999 
  },
  flagBtn: { 
    width: isMobile ? "40px" : "50px", 
    height: isMobile ? "40px" : "50px", 
    fontSize: isMobile ? "12px" : "14px", 
    fontWeight: "bold",
    background: "#fff", 
    border: "2px solid #000", 
    borderRadius: "10px", 
    cursor: "pointer", 
    transition: "all 0.3s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#000"
  },
  flagBtnActivePT: { 
    backgroundImage: "url('/flags/br.svg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    color: "#fff",
    border: "2px solid #000",
    fontWeight: "bold",
    textShadow: "2px 2px 4px rgba(0,0,0,0.9)"
  },
  flagBtnActiveES: { 
    backgroundImage: "url('/flags/es.svg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    color: "#fff",
    border: "2px solid #000",
    fontWeight: "bold",
    textShadow: "2px 2px 4px rgba(0,0,0,0.9)"
  },
  flagBtnActiveEN: { 
    backgroundImage: "url('/flags/us.svg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    color: "#fff",
    border: "2px solid #3c3b6e",
    fontWeight: "bold",
    textShadow: "2px 2px 4px rgba(0,0,0,0.9)"
  },
  carrinhoIconBtn: { 
    position: "fixed", 
    top: isMobile ? "10px" : "20px", 
    right: isMobile ? "10px" : "20px", 
    backgroundColor: "#000", 
    color: "#F1B100", 
    border: "2px solid #000", 
    borderRadius: "50%", 
    width: isMobile ? "50px" : "60px", 
    height: isMobile ? "50px" : "60px", 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center", 
    cursor: "pointer", 
    zIndex: 999, 
    fontWeight: "bold",
    fontSize: isMobile ? "12px" : "14px"
  },
  fecharDrawerBtn: { position: "absolute", top: "50%", left: "-32px", transform: "translateY(-50%)", backgroundColor: "#000", color: "#F1B100", border: "2px solid #000", borderRadius: "8px 0 0 8px", width: "32px", height: "32px", fontSize: "14px", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1001, lineHeight: "1" },
  title: { fontSize: isMobile ? "24px" : "32px", fontWeight: "bold", color: "#000", marginBottom: "20px" },
  tabs: { display: "flex", gap: isMobile ? "5px" : "10px", justifyContent: "center", marginBottom: isMobile ? "30px" : "60px", flexWrap: "wrap" },
  tabButton: { padding: isMobile ? "8px 12px" : "10px 18px", borderRadius: "10px", border: "2px solid #000", backgroundColor: "#fff", color: "#000", fontWeight: "bold", cursor: "pointer", fontSize: isMobile ? "14px" : "16px" },
  activeTab: { backgroundColor: "#000", color: "#F1B100" },
  produtos: { 
    display: "grid", 
    gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", 
    gap: isMobile ? "15px" : "20px",
    maxWidth: "1200px",
    margin: "0 auto"
  },
  produtosUnico: {
    gridTemplateColumns: "1fr",
    maxWidth: isMobile ? "100%" : "550px",
    justifyItems: "center"
  },
  card: { 
    backgroundColor: "#fff", 
    borderRadius: "20px", 
    overflow: "hidden",
    border: "none",
    boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    cursor: "pointer",
    "&:hover": {
      transform: "translateY(-8px)",
      boxShadow: "0 12px 36px rgba(0,0,0,0.35)"
    }
  },
  cardImageContainer: {
    width: "100%",
    height: isMobile ? "180px" : "220px",
    overflow: "hidden",
    backgroundColor: "#f5f5f5",
    position: "relative"
  },
  img: { 
    width: "100%", 
    height: "100%",
    objectFit: "cover",
    cursor: "pointer",
    transition: "transform 0.3s",
    "&:hover": {
      transform: "scale(1.05)"
    }
  },
  cardContent: {
    padding: isMobile ? "12px" : "15px",
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  cardTitle: { 
    fontSize: isMobile ? "18px" : "20px", 
    fontWeight: "bold", 
    color: "#000",
    margin: 0
  },
  descricao: { 
    fontSize: isMobile ? "13px" : "14px", 
    color: "#666",
    lineHeight: "1.5",
    margin: 0,
    minHeight: "65px"
  },
  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "8px",
    gap: "10px"
  },
  preco: { 
    fontSize: isMobile ? "18px" : "20px", 
    color: "#000",
    fontWeight: "bold",
    margin: 0
  },
  addBtn: { 
    padding: isMobile ? "8px 16px" : "10px 20px", 
    backgroundColor: "#000", 
    color: "#F1B100", 
    border: "2px solid #000", 
    borderRadius: "8px", 
    cursor: "pointer", 
    fontWeight: "bold", 
    fontSize: isMobile ? "13px" : "14px",
    transition: "all 0.2s",
    whiteSpace: "nowrap",
    "&:hover": {
      backgroundColor: "#F1B100",
      color: "#000"
    }
  },
  drawer: { position: "fixed", top: 0, right: 0, width: isMobile ? "100%" : "400px", maxWidth: isMobile ? "100%" : "400px", height: "100vh", backgroundColor: "#fff", borderLeft: "2px solid #000", padding: isMobile ? "10px 15px" : "10px 20px", boxShadow: "-4px 0 10px rgba(0,0,0,0.2)", zIndex: 1000, display: "flex", flexDirection: "column", transition: "transform 0.3s ease", overflowY: "auto", overflow: "visible" },
  abaContainer: { display: "flex", gap: "5px", marginBottom: "15px", flexWrap: isMobile ? "wrap" : "nowrap" },
  abaBtn: { flex: 1, padding: isMobile ? "6px 0" : "8px 0", fontWeight: "bold", cursor: "pointer", borderRadius: "6px", border: "1px solid #000", backgroundColor: "#fff", fontSize: isMobile ? "13px" : "14px", minWidth: isMobile ? "30%" : "auto" },
  abaAtiva: { backgroundColor: "#000", color: "#F1B100" },
  carrinhoItem: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", fontSize: isMobile ? "14px" : "16px", flexWrap: isMobile ? "wrap" : "nowrap" },
  quantInput: { width: isMobile ? "40px" : "50px", padding: "3px", marginLeft: "5px", textAlign: "center", fontSize: isMobile ? "13px" : "14px" },
  removerBtn: { background: "#000", color: "#F1B100", border: "none", borderRadius: "5px", padding: isMobile ? "4px 8px" : "5px 10px", cursor: "pointer", marginLeft: "10px", fontSize: isMobile ? "12px" : "14px" },
  finalizarBtn: { marginTop: "10px", padding: isMobile ? "10px" : "12px", backgroundColor: "#000", color: "#F1B100", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", fontSize: isMobile ? "14px" : "16px" },
  checkout: { display: "flex", flexDirection: "column", gap: isMobile ? "12px" : "15px" },
  section: { marginBottom: isMobile ? "12px" : "15px", display: "flex", flexDirection: "column", gap: "5px" },
  input: { padding: isMobile ? "6px" : "8px", borderRadius: "6px", border: "1px solid #000", fontSize: isMobile ? "14px" : "16px" },
  resumoItem: { display: "flex", justifyContent: "space-between", marginBottom: "5px", fontSize: isMobile ? "14px" : "16px" },
  total: { fontWeight: "bold", marginTop: "10px", fontSize: isMobile ? "16px" : "18px" },
  modalOverlay: { position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 999, padding: isMobile ? "10px" : "0" },
  modalContent: { position: "relative", backgroundColor: "#fff", padding: isMobile ? "15px" : "20px", borderRadius: "15px", border: "3px solid #000", maxWidth: isMobile ? "95%" : "auto" },
  modalImg: { width: "100%", maxWidth: isMobile ? "100%" : "600px", height: "auto", borderRadius: "12px" },
  closeBtn: { position: "absolute", top: "10px", right: "10px", background: "#000", color: "#F1B100", border: "none", padding: isMobile ? "4px 8px" : "5px 10px", cursor: "pointer", borderRadius: "5px", fontWeight: "bold", fontSize: isMobile ? "12px" : "14px" },
  selo: {
    position: "absolute",
    top: "10px",
    right: "10px",
    padding: isMobile ? "5px 10px" : "6px 12px",
    borderRadius: "20px",
    fontWeight: "bold",
    fontSize: isMobile ? "10px" : "11px",
    zIndex: 10,
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },
  seloMaisVendido: {
    backgroundColor: "#F1B100",
    color: "#000"
  },
  seloEspecial: {
    backgroundColor: "#FF4444",
    color: "#fff"
  }
};

