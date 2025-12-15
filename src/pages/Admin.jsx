import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function Admin() {
  const [senha, setSenha] = useState("");
  const [logado, setLogado] = useState(false);
  const [novosPedidos, setNovosPedidos] = useState(0);
  const [ultimoCheck, setUltimoCheck] = useState(null);
  // Removido: const [audioReady, setAudioReady] = useState(false);
  const [notificacaoPermitida, setNotificacaoPermitida] = useState(false);
  const navigate = useNavigate();

  // Verificar status de notificação
  useEffect(() => {
    if (logado) {
      setNotificacaoPermitida(Notification.permission === 'granted');
    }
  }, [logado]);

  // Função para solicitar permissão
  const solicitarPermissao = async () => {
    const permission = await Notification.requestPermission();
    setNotificacaoPermitida(permission === 'granted');
    if (permission === 'granted') {
      alert('✅ Notificações ativadas! Você será notificado de novos pedidos.');
    } else {
      alert('❌ Notificações bloqueadas. Ative manualmente nas configurações do navegador.');
    }
  };



  const SENHA_CORRETA = "metanoia2025";


  // Verifica se já está logado (localStorage, sessionStorage, fallback)

  // Fallback: login em memória se storage falhar
  const [memLogado, setMemLogado] = useState(false);
  useEffect(() => {
    let logged = false;
    let storageErro = false;
    try {
      if (window.localStorage) {
        logged = localStorage.getItem("adminLogado") === "true";
      }
    } catch (e) {
      storageErro = true;
    }
    if (!logged) {
      try {
        if (window.sessionStorage) {
          logged = sessionStorage.getItem("adminLogado") === "true";
        }
      } catch (e) {
        storageErro = true;
      }
    }
    if (!logged && storageErro && memLogado) {
      logged = true;
    }
    setLogado(logged);
    // Só alerta se realmente não conseguir acessar NENHUM storage e não estiver logado em memória
    if (!logged && storageErro && !memLogado) {
      setTimeout(() => {
        alert("Seu navegador está bloqueando o login do admin. Tente sair do modo privado ou use outro navegador.");
      }, 300);
    }
    // eslint-disable-next-line
  }, [memLogado]);

  // Verificar novos pedidos a cada 10 segundos
  useEffect(() => {
    if (!logado) return;

    // Solicitar permissão para notificações
    if (window.Notification && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const verificarNovosPedidos = async () => {
      try {
        const response = await fetch(`${API_URL}/api/pedidos`);
        if (response.ok) {
          const pedidos = await response.json();
          // Na primeira execução, apenas seta o timestamp sem notificar
          if (ultimoCheck === null) {
            setUltimoCheck(Date.now());
            return;
          }
          // Filtrar pedidos novos desde último check
          const pedidosNovos = pedidos.filter(
            p => new Date(p.createdAt).getTime() > ultimoCheck && p.status === "SOLICITADO"
          );
          if (pedidosNovos.length > 0) {
            // Mostrar notificação do sistema
            if (window.Notification && Notification.permission === 'granted') {
              const notification = new Notification('🔔 Novo Pedido!', {
                body: `${pedidosNovos.length} novo(s) pedido(s) recebido(s)`,
                icon: '/logo.png',
                badge: '/logo.png',
                tag: 'novo-pedido',
                requireInteraction: false,
                silent: false
              });
              notification.onclick = () => {
                window.focus();
                notification.close();
              };
            }
            setNovosPedidos(prev => prev + pedidosNovos.length);
            setUltimoCheck(Date.now());
          }
        }
      } catch (error) {
        console.error('Erro ao verificar pedidos:', error);
      }
    };
    verificarNovosPedidos();
    const interval = setInterval(verificarNovosPedidos, 60000);
    return () => clearInterval(interval);
  }, [logado, ultimoCheck]);

  // Login



  function handleLogin() {
    if (senha === SENHA_CORRETA) {
      let ok = false;
      let storageErro = false;
      try {
        localStorage.setItem("adminLogado", "true");
        ok = true;
      } catch (e) {
        storageErro = true;
      }
      if (!ok) {
        try {
          sessionStorage.setItem("adminLogado", "true");
          ok = true;
        } catch (e) {
          storageErro = true;
        }
      }
      if (!ok && storageErro) {
        setMemLogado(true); // Fallback: login só em memória
      }
      setLogado(true);
      if (!ok && storageErro) {
        setTimeout(() => {
          alert("Seu navegador está bloqueando o login do admin. Tente sair do modo privado ou use outro navegador.");
        }, 300);
      }
    } else {
      alert("Senha incorreta!");
    }
  }

  // Botão sair (AGORA FUNCIONA)


  function sair() {
    try { localStorage.removeItem("adminLogado"); } catch (e) {}
    try { sessionStorage.removeItem("adminLogado"); } catch (e) {}
    setMemLogado(false);
    setLogado(false);
    navigate("/admin");
  }

  // Se NÃO estiver logado → mostra tela de login
  if (!logado) {
    return (
      <div style={styles.loginContainer}>
        <h2 style={styles.title}>Painel Administrativo</h2>

        <input
          type="password"
          placeholder="Digite a senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          style={styles.input}
        />

        <button onClick={handleLogin} style={styles.button}>
          Entrar
        </button>
      </div>
    );
  }

  // Se estiver logado → mostra painel admin
  const categorias = ["hamburgueres", "combos", "acompanhamentos", "bebidas"];
  const outros = ["ingredientes", "pedidos"];

  return (
    <div style={styles.adminContainer}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Admin — Metanoia Burger</h1>
          <p style={styles.subtitle}>Gerencie seu cardápio</p>
        </div>
        
        <div style={styles.headerActions}>
          {/* Botão ativar notificações */}
          {!notificacaoPermitida && (
            <button style={styles.notifBtn} onClick={solicitarPermissao}>
              🔔 Ativar Notificações
            </button>
          )}
          
          {/* Botão sair */}
          <button style={styles.sairBtn} onClick={sair}>
            Sair
          </button>
        </div>
      </div>

      <div style={styles.grid}>
        {categorias.map((cat) => {
          // Mapa para exibir nomes com acentuação correta
          const nomeExibicao = {
            hamburgueres: "Hambúrgueres",
            combos: "Combos",
            acompanhamentos: "Acompanhamentos",
            bebidas: "Bebidas"
          };
          
          return (
            <div key={cat} style={styles.card}>
              <h3 style={styles.cardTitle}>
                {nomeExibicao[cat] || cat.charAt(0).toUpperCase() + cat.slice(1)}
              </h3>

              <Link to={`/admin/${cat}`} style={styles.manageBtn}>
                Gerenciar
              </Link>
            </div>
          );
        })}
      </div>

      <h2 style={styles.sectionTitle}>Operações</h2>
      <div style={styles.grid}>
        {outros.map((item) => (
          <div key={item} style={styles.card}>
            <h3 style={styles.cardTitle}>
              {item === "pedidos" ? "Pedidos" : item === "ingredientes" ? "Ingredientes" : item}
              {item === "pedidos" && novosPedidos > 0 && (
                <span style={styles.badge}>{novosPedidos}</span>
              )}
            </h3>

            <button
              style={styles.manageBtn}
              onClick={() => {
                if (item === "pedidos") {
                  setNovosPedidos(0);
                  setUltimoCheck(Date.now());
                }
                navigate(`/admin/${item}`);
              }}
            >
              {item === "pedidos" ? "Visualizar" : "Gerenciar"}
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}

const styles = {
  loginContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F1B100",
  },
  adminContainer: {
    padding: "20px",
    backgroundColor: "#F1B100",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  notifBtn: {
    background: "#ff9800",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: "10px",
    cursor: "pointer",
    border: "none",
    fontWeight: "bold",
    animation: "pulse 2s infinite",
  },
  sairBtn: {
    background: "#000",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: "10px",
    cursor: "pointer",
    border: "none",
    fontWeight: "bold",
  },
  title: {
    fontSize: "32px",
    fontWeight: "bold",
    color: "#000",
    margin: 0,
  },
  subtitle: {
    fontSize: "18px",
    margin: "8px 0 0 0",
  },
  input: {
    padding: "12px",
    borderRadius: "10px",
    border: "2px solid #000",
    width: "250px",
    fontSize: "16px",
    marginBottom: "10px",
  },
  button: {
    backgroundColor: "#000",
    color: "#F1B100",
    padding: "10px 20px",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    border: "none",
  },
  grid: {
    marginTop: "30px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
  },
  '@media (max-width: 600px)': {
    grid: {
      gridTemplateColumns: '1fr',
      gap: '12px',
    },
    adminContainer: {
      padding: '8px',
    },
    card: {
      padding: '10px',
    },
    title: {
      fontSize: '22px',
    },
    cardTitle: {
      fontSize: '16px',
    },
    button: {
      fontSize: '14px',
      padding: '8px 12px',
    },
    input: {
      width: '90vw',
      fontSize: '14px',
    },
  },
  sectionTitle: {
    marginTop: "40px",
    fontSize: "24px",
    fontWeight: "bold",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "12px",
    border: "2px solid #000",
    textAlign: "center",
  },
  cardTitle: {
    fontWeight: "bold",
    fontSize: "20px",
    marginBottom: "10px",
  },
  manageBtn: {
    marginTop: "10px",
    backgroundColor: "#000",
    color: "#F1B100",
    padding: "10px 14px",
    borderRadius: "10px",
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-block",
    fontWeight: "bold",
  },
  badge: {
    backgroundColor: "#ff0000",
    color: "#fff",
    borderRadius: "50%",
    width: "24px",
    height: "24px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "bold",
    marginLeft: "8px",
    animation: "pulse 1.5s infinite",
  },
};
