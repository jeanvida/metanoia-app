import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import VoltarBtn from "../../components/VoltarBtn";

export default function AdminCombos() {
  const navigate = useNavigate();

  // Proteção: se não estiver logado, voltar para login
  useEffect(() => {
    const logado = localStorage.getItem("adminLogado");
    if (logado !== "true") {
      navigate("/login");
    }
  }, [navigate]);

  const [combos, setCombos] = useState([]);
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    preco: "",
    itens: [],
    foto: "",
  });

  const [novoItem, setNovoItem] = useState({
    nome: "",
    detalhe: "",
  });

  useEffect(() => {
    const data = localStorage.getItem("combos");
    if (data) setCombos(JSON.parse(data));
  }, []);

  useEffect(() => {
    localStorage.setItem("combos", JSON.stringify(combos));
  }, [combos]);

  function adicionarItem() {
    if (!novoItem.nome) return;

    setForm({
      ...form,
      itens: [...form.itens, novoItem],
    });

    setNovoItem({ nome: "", detalhe: "" });
  }

  function salvarCombo() {
    if (!form.nome || !form.preco) {
      alert("Preencha nome e preço");
      return;
    }

    setCombos([...combos, form]);

    setForm({
      nome: "",
      descricao: "",
      preco: "",
      itens: [],
      foto: "",
    });

    alert("Combo cadastrado!");
  }

  return (
       <div style={{ ...styles.container, position: "relative" }}>
               <VoltarBtn />
      <h1 style={styles.title}>Gerenciar Combos</h1>

      <div style={styles.card}>
        <h2 style={styles.subtitle}>Adicionar Combo</h2>

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

        <h3>Itens do Combo</h3>

        <div style={styles.row}>
          <input
            style={styles.inputSmall}
            placeholder="Item"
            value={novoItem.nome}
            onChange={(e) =>
              setNovoItem({ ...novoItem, nome: e.target.value })
            }
          />

          <input
            style={styles.inputSmall}
            placeholder="Detalhe"
            value={novoItem.detalhe}
            onChange={(e) =>
              setNovoItem({ ...novoItem, detalhe: e.target.value })
            }
          />

          <button style={styles.buttonSmall} onClick={adicionarItem}>
            +
          </button>
        </div>

        <ul>
          {form.itens.map((item, i) => (
            <li key={i}>
              {item.nome} — {item.detalhe}
            </li>
          ))}
        </ul>

        <input
          style={styles.input}
          placeholder="URL da foto"
          value={form.foto}
          onChange={(e) => setForm({ ...form, foto: e.target.value })}
        />

        <button style={styles.saveBtn} onClick={salvarCombo}>
          Salvar Combo
        </button>
      </div>

      <h2 style={styles.subtitle}>Combos Cadastrados</h2>

      {combos.length === 0 && <p>Nenhum combo cadastrado.</p>}

      {combos.map((c, i) => (
        <div key={i} style={styles.itemCard}>
          <strong>{c.nome}</strong> — R${c.preco}
          <br />
          <small>{c.descricao}</small>
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
    marginTop: "20px",
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
