import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import VoltarBtn from "../../components/VoltarBtn";

export default function AdminBebidas() {
  const navigate = useNavigate();

  // Verifica se o admin está logado
  useEffect(() => {
    const logado = localStorage.getItem("adminLogado");
    if (logado !== "true") {
      navigate("/login");
    }
  }, [navigate]);

  const [bebidas, setBebidas] = useState([]);
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    preco: "",
    foto: "",
  });

  // Carrega bebidas do localStorage
  useEffect(() => {
    const data = localStorage.getItem("bebidas");
    if (data) setBebidas(JSON.parse(data));
  }, []);

  // Salva bebidas no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem("bebidas", JSON.stringify(bebidas));
  }, [bebidas]);

  function salvar() {
    if (!form.nome || !form.preco) {
      alert("Preencha nome e preço");
      return;
    }

    setBebidas([...bebidas, form]);
    setForm({
      nome: "",
      descricao: "",
      preco: "",
      foto: "",
    });

    alert("Bebida cadastrada!");
  }

  return (
      <div style={{ ...styles.container, position: "relative" }}>
             <VoltarBtn />
      <h1 style={styles.title}>Gerenciar Bebidas</h1>

      <div style={styles.card}>
        <h2 style={styles.subtitle}>Adicionar Bebida</h2>

        <input
          style={styles.input}
          placeholder="Nome"
          value={form.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
        />

        <textarea
          style={styles.textarea}
          placeholder="Descrição"
          value={form.descricao}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })}
        />

        <input
          style={styles.input}
          placeholder="Preço (R$)"
          value={form.preco}
          onChange={(e) => setForm({ ...form, preco: e.target.value })}
        />

        <input
          style={styles.input}
          placeholder="URL da foto"
          value={form.foto}
          onChange={(e) => setForm({ ...form, foto: e.target.value })}
        />

        <button style={styles.saveBtn} onClick={salvar}>
          Salvar Bebida
        </button>
      </div>

      <h2 style={styles.subtitle}>Bebidas Cadastradas</h2>

      {bebidas.length === 0 && <p>Nenhuma bebida cadastrada.</p>}

      {bebidas.map((b, i) => (
        <div key={i} style={styles.itemCard}>
          <strong>{b.nome}</strong> — R${b.preco}
          <br />
          <small>{b.descricao}</small>
        </div>
      ))}
    </div>
  );
}

const styles = {
  container: {
    background: "#F1B100",
    minHeight: "100vh",
    padding: "20px",
  },
  title: {
    fontSize: "32px",
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    marginTop: "50px",
    fontWeight: "bold",
  },
  card: {
    background: "#fff",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "30px",
  },
  itemCard: {
    background: "#fff",
    padding: "15px",
    marginTop: "10px",
    borderRadius: "10px",
    border: "2px solid #000",
  },
  input: {
    width: "100%",
    padding: "10px",
    marginTop: "10px",
    borderRadius: "10px",
    border: "2px solid #000",
  },
  textarea: {
    width: "100%",
    padding: "10px",
    marginTop: "10px",
    borderRadius: "10px",
    border: "2px solid #000",
    minHeight: "70px",
  },
  row: {
    display: "flex",
    gap: "10px",
    marginTop: "10px",
  },
  inputSmall: {
    flex: 1,
    padding: "10px",
    borderRadius: "10px",
    border: "2px solid #000",
  },
  buttonSmall: {
    background: "#000",
    color: "#F1B100",
    padding: "10px 14px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
  },
  saveBtn: {
    marginTop: "20px",
    width: "100%",
    background: "#000",
    color: "#F1B100",
    padding: "12px",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "bold",
    border: "none",
    cursor: "pointer",
  },
};
