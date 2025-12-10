import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Admin() {
  const [senha, setSenha] = useState("");
  const [logado, setLogado] = useState(false);
  const navigate = useNavigate();

  const SENHA_CORRETA = "metanoia2025";

  // Verifica se já está logado
  useEffect(() => {
    const isLogged = localStorage.getItem("adminLogado");
    if (isLogged === "true") {
      setLogado(true);
    }
  }, []);

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
      <h1 style={styles.title}>Admin — Metanoia Burger</h1>
      <p style={styles.subtitle}>Gerencie seu cardápio</p>

      {/* Botão sair — canto superior direito */}
      <button style={styles.sairBtn} onClick={sair}>
        Sair
      </button>

      <div style={styles.grid}>
        {categorias.map((cat) => (
          <div key={cat} style={styles.card}>
            <h3 style={styles.cardTitle}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </h3>

            <Link to={`/admin/${cat}`} style={styles.manageBtn}>
              Gerenciar
            </Link>
          </div>
        ))}
      </div>

      <h2 style={styles.sectionTitle}>Operações</h2>
      <div style={styles.grid}>
        {outros.map((item) => (
          <div key={item} style={styles.card}>
            <h3 style={styles.cardTitle}>
              {item === "pedidos" ? "Pedidos" : item === "ingredientes" ? "Ingredientes" : item}
            </h3>

            <Link to={`/admin/${item}`} style={styles.manageBtn}>
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
    position: "relative",
  },
  sairBtn: {
    position: "absolute",
    right: "20px",
    top: "20px",
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
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    fontSize: "18px",
    marginBottom: "20px",
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
};
