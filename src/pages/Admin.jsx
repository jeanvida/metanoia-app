import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function Admin() {
  const [senha, setSenha] = useState("");
  const [logado, setLogado] = useState(false);
  const [novosPedidos, setNovosPedidos] = useState(0);
  const [ultimoCheck, setUltimoCheck] = useState(null); // Inicializa como null
  const [audioContext, setAudioContext] = useState(null);
  const navigate = useNavigate();

  // Criar contexto de áudio ao fazer login
  useEffect(() => {
    if (logado && !audioContext) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      setAudioContext(ctx);
    }
  }, [logado, audioContext]);

  // Função para tocar sino usando Web Audio API
  const tocarSino = () => {
    if (!audioContext) return;

    try {
      // Garantir que o contexto está rodando
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      // Criar oscilador para simular sino
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Configurar som de sino (frequências harmônicas)
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.5);

      // Envelope de volume (fade out)
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2);

      // Tocar
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 2);

      // Segundo sino (harmônico)
      setTimeout(() => {
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(600, audioContext.currentTime);
        gain2.gain.setValueAtTime(0.2, audioContext.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.5);
        osc2.start(audioContext.currentTime);
        osc2.stop(audioContext.currentTime + 1.5);
      }, 200);
    } catch (error) {
      console.error('Erro ao tocar sino:', error);
    }
  };

  const SENHA_CORRETA = "metanoia2025";

  // Verifica se já está logado
  useEffect(() => {
    const isLogged = localStorage.getItem("adminLogado");
    if (isLogged === "true") {
      setLogado(true);
    }
  }, []);

  // Verificar novos pedidos a cada 10 segundos
  useEffect(() => {
    if (!logado) return;

    // Solicitar permissão para notificações
    if (Notification.permission === 'default') {
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
            // Tocar sino
            tocarSino();
            
            // Mostrar notificação do sistema
            if (Notification.permission === 'granted') {
              const notification = new Notification('🔔 Novo Pedido!', {
                body: `${pedidosNovos.length} novo(s) pedido(s) recebido(s)`,
                icon: '/logo.png',
                badge: '/logo.png',
                tag: 'novo-pedido',
                requireInteraction: false,
                silent: false // Vai tocar o som padrão do sistema também
              });
              
              // Clicar na notificação foca na janela
              notification.onclick = () => {
                window.focus();
                notification.close();
              };
            }
            
            // Atualizar contador
            setNovosPedidos(prev => prev + pedidosNovos.length);
            setUltimoCheck(Date.now());
          }
        }
      } catch (error) {
        console.error('Erro ao verificar pedidos:', error);
      }
    };

    verificarNovosPedidos();
    const interval = setInterval(verificarNovosPedidos, 10000); // 10 segundos
    return () => clearInterval(interval);
  }, [logado, ultimoCheck]);

  // Login
  function handleLogin() {
    if (senha === SENHA_CORRETA) {
      localStorage.setItem("adminLogado", "true");
      setLogado(true);
    } else {
      alert("Senha incorreta!");
    }
  }

  // Botão sair (AGORA FUNCIONA)
  function sair() {
    localStorage.removeItem("adminLogado");
    setLogado(false);
    navigate("/login");
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
          {/* Botão testar som */}
          <button style={styles.testSoundBtn} onClick={tocarSino}>
            🔔 Testar Som
          </button>
          
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

            <Link 
              to={`/admin/${item}`} 
              style={styles.manageBtn}
              onClick={() => {
                if (item === "pedidos") {
                  setNovosPedidos(0);
                  setUltimoCheck(Date.now());
                }
              }}
            >
              {item === "pedidos" ? "Visualizar" : "Gerenciar"}
            </Link>
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
  testSoundBtn: {
    background: "#2196f3",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: "10px",
    cursor: "pointer",
    border: "none",
    fontWeight: "bold",
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
