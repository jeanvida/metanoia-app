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
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    descricaoES: "",
    descricaoEN: "",
    preco: "",
    selo: "",
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

  function editarBebida(bebida) {
    setEditandoId(bebida.id);
    setForm({
      nome: bebida.nome,
      descricao: bebida.descricao || "",
      descricaoES: bebida.descricaoES || "",
      descricaoEN: bebida.descricaoEN || "",
      preco: String(bebida.preco),
      selo: bebida.selo || "",
      foto: bebida.img || "",
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setForm({
      nome: "",
      descricao: "",
      descricaoES: "",
      descricaoEN: "",
      preco: "",
      selo: "",
      foto: "",
    });
  }

  async function deletarBebida(id) {
    if (!confirm('Tem certeza que deseja deletar esta bebida?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/itens/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Bebida deletada com sucesso!');
        setBebidas(prev => prev.filter(b => b.id !== id));
      } else {
        alert('Erro ao deletar bebida');
      }
    } catch (error) {
      console.error('Erro ao deletar:', error);
      alert('Erro ao conectar com o servidor');
    }
  }

  function salvar() {
    if (!form.nome || !form.preco) {
      alert("Preencha nome e preço");
      return;
    }

    const enviarBackend = async () => {
      try {
        const url = editandoId ? `${API_URL}/api/itens/${editandoId}` : `${API_URL}/api/itens`;
        const method = editandoId ? "PUT" : "POST";
        
        const response = await fetch(url, {
          method: method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: form.nome,
            descricao: form.descricao,
            descricaoES: form.descricaoES,
            descricaoEN: form.descricaoEN,
            preco: Number(form.preco),
            selo: form.selo || null,
            // img: form.foto || "", // Remover base64 muito grande
            categoriaId: categoriaId || 4,
          }),
        });

        if (response.ok) {
          const mensagem = editandoId ? "Bebida atualizada com sucesso!" : "Bebida cadastrada com sucesso!";
          alert(mensagem);
          
          const recarregar = await fetch(`${API_URL}/api/itens?categoria=Bebidas`);
          if (recarregar.ok) {
            const data = await recarregar.json();
            setBebidas(data);
          }
          
          setEditandoId(null);
          setForm({
            nome: "",
            descricao: "",
            descricaoES: "",
            descricaoEN: "",
            preco: "",
            selo: "",
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

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            Selo (opcional)
          </label>
          <select
            style={styles.input}
            value={form.selo}
            onChange={(e) => setForm({ ...form, selo: e.target.value })}
          >
            <option value="">Nenhum</option>
            <option value="maisVendido">Mais Vendido</option>
            <option value="especialSemana">Especial da Semana</option>
          </select>
        </div>

        <input
          style={styles.input}
          placeholder="URL da foto"
          value={form.foto}
          onChange={(e) => setForm({ ...form, foto: e.target.value })}
        />

        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={styles.saveBtn} onClick={salvar}>
            {editandoId ? 'Atualizar Bebida' : 'Salvar Bebida'}
          </button>
          {editandoId && (
            <button style={styles.cancelBtn} onClick={cancelarEdicao}>
              Cancelar
            </button>
          )}
        </div>
      </div>

      <h2 style={styles.subtitle}>Bebidas Cadastradas</h2>

      {bebidas.length === 0 && <p>Nenhuma bebida cadastrada.</p>}

      {bebidas.map((b, i) => (
        <div key={i} style={styles.itemCard}>
          <div style={{ flex: 1 }}>
            <strong>{b.nome}</strong> — R${Number(b.preco).toFixed(2)}
            {b.selo && <span style={styles.seloTag}> • {b.selo === 'maisVendido' ? 'Mais Vendido' : 'Especial da Semana'}</span>}
            <br />
            <small>{b.descricao}</small>
          </div>
          
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <button style={styles.editBtn} onClick={() => editarBebida(b)}>
              ✏️ Editar
            </button>
            <button style={styles.deleteBtn} onClick={() => deletarBebida(b.id)}>
              🗑️
            </button>
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
    flex: 1,
    background: "#000",
    color: "#F1B100",
    padding: "12px",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "bold",
    border: "none",
    cursor: "pointer",
  },
  cancelBtn: {
    marginTop: "20px",
    flex: 1,
    background: "#666",
    color: "#fff",
    padding: "12px",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "bold",
    border: "none",
    cursor: "pointer",
  },
  itemCard: {
    background: "#fff",
    padding: "12px",
    marginTop: "10px",
    borderRadius: "10px",
    border: "2px solid #000",
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },
  editBtn: {
    background: "#000",
    color: "#F1B100",
    padding: "8px 12px",
    borderRadius: "8px",
    border: "none",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "14px",
  },
  deleteBtn: {
    background: "#c62828",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
  },
  seloTag: {
    color: "#F1B100",
    fontWeight: "bold",
    fontSize: "12px",
  },
};
