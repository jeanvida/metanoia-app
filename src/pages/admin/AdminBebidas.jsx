import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import VoltarBtn from "../../components/VoltarBtn";

const API_URL = import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname === 'localhost' 
    ? "http://localhost:3001" 
    : "https://metanoia-app.onrender.com");

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
  const [categoriaId, setCategoriaId] = useState(null);
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    descricaoES: "",
    descricaoEN: "",
    preco: "",
    foto: "",
  });

  useEffect(() => {
    const inicializar = async () => {
      try {
        await fetch(`${API_URL}/api/init-categorias`, { method: "POST" });
        const catResponse = await fetch(`${API_URL}/api/categorias`);
        const categorias = await catResponse.json();
        const bebidaCategoria = categorias.find((c) => c.nome === "Bebidas");
        if (bebidaCategoria) setCategoriaId(bebidaCategoria.id);

        const response = await fetch(`${API_URL}/api/itens?categoria=Bebidas`);
        if (response.ok) {
          const data = await response.json();
          setBebidas(data);
        }
      } catch (error) {
        console.error("Erro ao inicializar:", error);
      }
    };
    inicializar();
  }, []);

  function salvar() {
    if (!form.nome || !form.preco) {
      alert("Preencha nome e preço");
      return;
    }

    const enviarBackend = async () => {
      try {
        const response = await fetch(`${API_URL}/api/itens`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: form.nome,
            descricao: form.descricao,
            descricaoES: form.descricaoES,
            descricaoEN: form.descricaoEN,
            preco: Number(form.preco),
            // img: form.foto || "", // Remover base64 muito grande
            categoriaId: categoriaId || 4,
          }),
        });

        if (response.ok) {
          alert("Bebida cadastrada com sucesso!");
          setBebidas((prev) => [...prev, form]);
          setForm({
            nome: "",
            descricao: "",
            descricaoES: "",
            descricaoEN: "",
            preco: "",
            foto: "",
          });
        } else {
          const errorData = await response.json();
          alert(`Erro ao cadastrar: ${errorData.error || "Tente novamente"}`);
        }
      } catch (error) {
        console.error("Erro:", error);
        alert(`Erro ao conectar com o servidor: ${error.message}`);
      }
    };

    enviarBackend();
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

        <textarea
          style={styles.textarea}
          placeholder="Descripción (ES)"
          value={form.descricaoES}
          onChange={(e) => setForm({ ...form, descricaoES: e.target.value })}
        />

        <textarea
          style={styles.textarea}
          placeholder="Description (EN)"
          value={form.descricaoEN}
          onChange={(e) => setForm({ ...form, descricaoEN: e.target.value })}
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
    padding: "60px 20px 20px 20px",
  },
  title: {
    fontSize: "32px",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: "20px",
  },
  subtitle: {
    marginTop: 0,
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
