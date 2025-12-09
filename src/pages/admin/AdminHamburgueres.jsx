import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import VoltarBtn from "../../components/VoltarBtn";

const API_URL = import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname === 'localhost' 
    ? "http://localhost:3001" 
    : "https://metanoia-app.onrender.com");

export default function AdminHamburgueres() {
  const navigate = useNavigate();

  // Proteção: se não estiver logado, redireciona
  useEffect(() => {
    const logado = localStorage.getItem("adminLogado");
    if (logado !== "true") {
      navigate("/login");
    }
  }, [navigate]);

  const [hamburgueres, setHamburgueres] = useState([]);
  const [categoriaId, setCategoriaId] = useState(null);
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    peso: "",
    preco: "",
    ingredientes: [],
    foto: "",
  });

  const [novoIngrediente, setNovoIngrediente] = useState({
    nome: "",
    peso: "",
    custo: "",
  });

  // Inicializar categorias e carregar hambúrgueres do backend
  useEffect(() => {
    const inicializar = async () => {
      try {
        // Inicializar categorias
        const initRes = await fetch(`${API_URL}/api/init-categorias`, { method: "POST" });
        console.log("Init categorias response:", initRes.status, initRes.statusText);
        
        if (!initRes.ok) {
          const text = await initRes.text();
          console.error("Init categorias error:", text);
        }

        // Buscar ID da categoria Hamburgueres
        const catResponse = await fetch(`${API_URL}/api/categorias`);
        console.log("Categorias response:", catResponse.status);
        
        if (!catResponse.ok) {
          throw new Error(`Erro ao buscar categorias: ${catResponse.status}`);
        }
        
        const categorias = await catResponse.json();
        const hamburguesCategoria = categorias.find((c) => c.nome === "Hamburgueres");
        if (hamburguesCategoria) {
          setCategoriaId(hamburguesCategoria.id);
        }

        // Carregar hambúrgueres
        const response = await fetch(`${API_URL}/api/itens?categoria=Hamburgueres`);
        if (response.ok) {
          const data = await response.json();
          setHamburgueres(data);
        }
      } catch (error) {
        console.error("Erro ao inicializar:", error);
      }
    };
    inicializar();
  }, []);

  function adicionarIngrediente() {
    if (!novoIngrediente.nome) {
      alert("Preencha o nome do ingrediente");
      return;
    }

    setForm((prev) => ({
      ...prev,
      ingredientes: [...prev.ingredientes, { ...novoIngrediente }],
    }));

    setNovoIngrediente({ nome: "", peso: "", custo: "" });
  }

  function removerIngrediente(index) {
    setForm((prev) => {
      const lista = [...prev.ingredientes];
      lista.splice(index, 1);
      return { ...prev, ingredientes: lista };
    });
  }

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({ ...prev, foto: reader.result }));
    };

    reader.readAsDataURL(file);
  }

  function salvarHamburguer() {
    if (!form.nome || !form.descricao || !form.preco) {
      alert("Preencha nome, descrição e preço");
      return;
    }

    const novoHamburguer = {
      nome: form.nome,
      descricao: form.descricao,
      peso: form.peso,
      preco: Number(form.preco),
      ingredientes: form.ingredientes,
      img: form.foto || "",
    };

    // Enviar para o backend
    const enviarBackend = async () => {
      try {
        console.log("🚀 Enviando para:", `${API_URL}/api/itens`);
        const response = await fetch(`${API_URL}/api/itens`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: form.nome,
            descricao: form.descricao,
            preco: Number(form.preco),
            peso: form.peso,
            // img: form.foto || "", // Remover base64 muito grande - usar URL depois
            categoriaId: categoriaId || 1,
          }),
        });

        console.log("Response status:", response.status);
        const responseText = await response.text();
        console.log("Response body:", responseText);

        if (response.ok) {
          alert("Hambúrguer cadastrado com sucesso!");
          setHamburgueres((prev) => [...prev, novoHamburguer]);
          setForm({
            nome: "",
            descricao: "",
            peso: "",
            preco: "",
            ingredientes: [],
            foto: "",
          });
          setNovoIngrediente({ nome: "", peso: "", custo: "" });
        } else {
          try {
            const errorData = JSON.parse(responseText);
            alert(`Erro ao cadastrar: ${errorData.error || "Erro desconhecido"}`);
          } catch {
            alert(`Erro ao cadastrar (${response.status}): ${responseText.substring(0, 100)}`);
          }
        }
      } catch (error) {
        console.error("Erro ao enviar para backend:", error);
        alert(`Erro ao conectar: ${error.message}`);
      }
    };

    enviarBackend();
  }

  return (
    <div style={{ ...styles.container, position: "relative" }}>
         <VoltarBtn />
      <h1 style={styles.title}>Gerenciar Hambúrgueres</h1>

      <div style={styles.card}>
        <h2 style={styles.subtitle}>Adicionar / Editar Hambúrguer</h2>

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

        <div style={styles.row}>
          <input
            style={styles.inputSmall}
            placeholder="Peso total (g)"
            value={form.peso}
            onChange={(e) => setForm({ ...form, peso: e.target.value })}
          />

          <input
            style={styles.inputSmall}
            placeholder="Preço ao cliente (R$)"
            type="number"
            value={form.preco}
            onChange={(e) => setForm({ ...form, preco: e.target.value })}
          />
        </div>

        <h3>Ingredientes</h3>
        <div style={styles.ingRow}>
          <input
            style={styles.inputSmall}
            placeholder="Nome"
            value={novoIngrediente.nome}
            onChange={(e) =>
              setNovoIngrediente({ ...novoIngrediente, nome: e.target.value })
            }
          />

          <input
            style={styles.inputSmall}
            placeholder="Peso (g)"
            type="number"
            value={novoIngrediente.peso}
            onChange={(e) =>
              setNovoIngrediente({ ...novoIngrediente, peso: e.target.value })
            }
          />

          <input
            style={styles.inputSmall}
            placeholder="Custo (R$)"
            type="number"
            value={novoIngrediente.custo}
            onChange={(e) =>
              setNovoIngrediente({ ...novoIngrediente, custo: e.target.value })
            }
          />

          <button style={styles.addIngBtn} onClick={adicionarIngrediente}>
            Adicionar Ingrediente
          </button>
        </div>

        {form.ingredientes.length > 0 && (
          <div style={styles.ingList}>
            {form.ingredientes.map((ing, idx) => (
              <div key={idx} style={styles.ingItem}>
                <div>
                  <strong>{ing.nome}</strong> — {ing.peso}g — R$ {ing.custo}
                </div>

                <button
                  style={styles.removeIngBtn}
                  onClick={() => removerIngrediente(idx)}
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        )}

        <label style={styles.fileLabel}>
          Anexar foto (jpg/png)
          <input type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
        </label>

        {form.foto && (
          <img src={form.foto} alt="preview" style={styles.preview} />
        )}

        <button style={styles.saveBtn} onClick={salvarHamburguer}>
          Salvar Hambúrguer
        </button>
      </div>

      <h2 style={styles.subtitle}>Hambúrgueres Cadastrados</h2>

      {hamburgueres.length === 0 && <p>Nenhum hambúrguer cadastrado.</p>}

      {hamburgueres.map((h, i) => (
        <div key={i} style={styles.itemCard}>
          {h.img && <img src={h.img} style={styles.itemPhoto} alt="" />}

          <div>
            <strong>{h.nome}</strong> — R$ {Number(h.preco).toFixed(2)}
            <br />
            <small>{h.descricao}</small>
          </div>
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
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: "20px",
  },
  subtitle: {
    marginTop: 0,
    fontWeight: "700",
  },
  card: {
    background: "#fff",
    padding: 18,
    borderRadius: 12,
    marginBottom: 24,
    marginTop: "30px",
    border: "2px solid #000",
  },
  input: {
    width: "100%",
    padding: 10,
    marginTop: 10,
    borderRadius: 8,
    border: "2px solid #000",
  },
  textarea: {
    width: "100%",
    padding: 10,
    marginTop: 10,
    borderRadius: 8,
    border: "2px solid #000",
    minHeight: 70,
  },
  row: {
    display: "flex",
    gap: 10,
    marginTop: 10,
  },
  inputSmall: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    border: "2px solid #000",
  },
  ingRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 10,
  },
  addIngBtn: {
    background: "#000",
    color: "#F1B100",
    padding: "10px 14px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    fontWeight: "700",
  },
  ingList: {
    marginTop: 10,
    background: "#fff",
    padding: 10,
    borderRadius: 8,
    border: "1px solid #ddd",
  },
  ingItem: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  removeIngBtn: {
    background: "#c62828",
    color: "#fff",
    padding: "6px 10px",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
  },
  fileLabel: {
    display: "block",
    background: "#000",
    color: "#F1B100",
    padding: "10px",
    borderRadius: 10,
    marginTop: 10,
    cursor: "pointer",
    textAlign: "center",
    fontWeight: 700,
  },
  preview: {
    width: 120,
    height: 120,
    marginTop: 10,
    borderRadius: 10,
    border: "2px solid #000",
    objectFit: "cover",
  },
  saveBtn: {
    marginTop: 14,
    width: "100%",
    background: "#000",
    color: "#fff",
    padding: 12,
    borderRadius: 10,
    border: "none",
    fontWeight: 700,
    cursor: "pointer",
  },
  itemCard: {
    background: "#fff",
    padding: 12,
    marginTop: 10,
    borderRadius: 10,
    border: "2px solid #000",
    display: "flex",
    gap: 12,
  },
  itemPhoto: {
    width: 80,
    height: 80,
    borderRadius: 8,
    border: "2px solid #000",
    objectFit: "cover",
  },
};
