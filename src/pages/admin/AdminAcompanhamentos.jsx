import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import VoltarBtn from "../../components/VoltarBtn";

export default function AdminAcompanhamentos() {
  const navigate = useNavigate();

  // Verifica se o admin está logado
  useEffect(() => {
    const logado = localStorage.getItem("adminLogado");
    if (logado !== "true") {
      navigate("/login");
    }
  }, [navigate]);

  const [acomp, setAcomp] = useState([]);
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    preco: "",
    foto: "",
  });

  // Carrega acompanhamentos do localStorage
  useEffect(() => {
    const data = localStorage.getItem("acompanhamentos");
    if (data) setAcomp(JSON.parse(data));
  }, []);

  // Salva acompanhamentos no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem("acompanhamentos", JSON.stringify(acomp));
  }, [acomp]);

  function salvar() {
    if (!form.nome || !form.preco) {
      alert("Preencha nome e preço");
      return;
    }

    setAcomp([...acomp, form]);

    setForm({
      nome: "",
      descricao: "",
      preco: "",
      foto: "",
    });

    alert("Acompanhamento cadastrado!");
  }

  return (
    <div style={{ ...styles.container, position: "relative" }}>
      <VoltarBtn />

      <h1 style={styles.title}>Gerenciar Acompanhamentos</h1>

      <div style={styles.card}>
        <h2 style={styles.subtitle}>Adicionar Acompanhamento</h2>

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
          Salvar
        </button>
      </div>

      <h2 style={styles.subtitle}>Acompanhamentos Cadastrados</h2>

      {acomp.length === 0 && <p>Nenhum acompanhamento cadastrado.</p>}

      {acomp.map((a, i) => (
        <div key={i} style={styles.itemCard}>
          <strong>{a.nome}</strong> — R${a.preco}
          <br />
          <small>{a.descricao}</small>
        </div>
      ))}
    </div>
  );
}

const styles = {
  container: {
    background: "#F1B100",
    minHeight: "100vh",
    padding: "60px 20px 20px 20px",
  },
  title: {
    fontSize: "32px",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: "20px",
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
    marginTop: "30px",
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
