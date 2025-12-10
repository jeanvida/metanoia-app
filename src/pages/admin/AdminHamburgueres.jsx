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
  const [editandoId, setEditandoId] = useState(null);
  const [ingredientesDisponiveis, setIngredientesDisponiveis] = useState([]);
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    descricaoES: "",
    descricaoEN: "",
    peso: "",
    preco: "",
    selo: "",
    ingredientes: [],
    foto: "",
  });

  const [novoIngrediente, setNovoIngrediente] = useState({
    ingredienteId: "",
    quantidade: "",
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

        // Carregar ingredientes disponíveis
        const ingResponse = await fetch(`${API_URL}/api/ingredientes`);
        if (ingResponse.ok) {
          const ingredientes = await ingResponse.json();
          setIngredientesDisponiveis(ingredientes);
        }
      } catch (error) {
        console.error("Erro ao inicializar:", error);
      }
    };
    inicializar();
  }, []);

  function adicionarIngrediente() {
    if (!novoIngrediente.ingredienteId || !novoIngrediente.quantidade) {
      alert("Selecione um ingrediente e informe a quantidade");
      return;
    }

    const ingredienteSelecionado = ingredientesDisponiveis.find(i => i.id === novoIngrediente.ingredienteId);
    if (!ingredienteSelecionado) return;

    // Calcular custo baseado na quantidade e preço por unidade
    const quantidade = parseFloat(novoIngrediente.quantidade);
    const custo = quantidade * parseFloat(ingredienteSelecionado.precoPorUnidade);

    setForm((prev) => ({
      ...prev,
      ingredientes: [...prev.ingredientes, {
        ingredienteId: ingredienteSelecionado.id,
        nome: ingredienteSelecionado.nome,
        quantidade: quantidade,
        unidade: ingredienteSelecionado.unidade,
        custo: custo,
      }],
    }));

    setNovoIngrediente({ ingredienteId: "", quantidade: "" });
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

  function editarHamburguer(hamburguer) {
    setEditandoId(hamburguer.id);
    setForm({
      nome: hamburguer.nome,
      descricao: hamburguer.descricao || "",
      descricaoES: hamburguer.descricaoES || "",
      descricaoEN: hamburguer.descricaoEN || "",
      peso: hamburguer.peso ? String(hamburguer.peso) : "",
      preco: String(hamburguer.preco),
      selo: hamburguer.selo || "",
      ingredientes: hamburguer.ingredientes || [],
      foto: hamburguer.img || "",
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
      peso: "",
      preco: "",
      selo: "",
      ingredientes: [],
      foto: "",
    });
  }

  async function deletarHamburguer(id) {
    if (!confirm('Tem certeza que deseja deletar este hambúrguer?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/itens/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Hambúrguer deletado com sucesso!');
        setHamburgueres(prev => prev.filter(h => h.id !== id));
      } else {
        alert('Erro ao deletar hambúrguer');
      }
    } catch (error) {
      console.error('Erro ao deletar:', error);
      alert('Erro ao conectar com o servidor');
    }
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
        const url = editandoId ? `${API_URL}/api/itens/${editandoId}` : `${API_URL}/api/itens`;
        const method = editandoId ? "PUT" : "POST";
        
        console.log("🚀 Enviando para:", url, method);
        const response = await fetch(url, {
          method: method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: form.nome,
            descricao: form.descricao,
            descricaoES: form.descricaoES || null,
            descricaoEN: form.descricaoEN || null,
            preco: Number(form.preco),
            peso: form.peso ? parseInt(form.peso, 10) : null,
            selo: form.selo || null,
            // img: form.foto || "", // Remover base64 muito grande - usar URL depois
            categoriaId: categoriaId || 1,
          }),
        });

        console.log("Response status:", response.status);
        const responseText = await response.text();
        console.log("Response body:", responseText);

        if (response.ok) {
          const mensagem = editandoId ? "Hambúrguer atualizado com sucesso!" : "Hambúrguer cadastrado com sucesso!";
          alert(mensagem);
          
          // Recarregar a lista
          const recarregar = await fetch(`${API_URL}/api/itens?categoria=Hamburgueres`);
          if (recarregar.ok) {
            const data = await recarregar.json();
            setHamburgueres(data);
          }
          
          setEditandoId(null);
          setForm({
            nome: "",
            descricao: "",
            descricaoES: "",
            descricaoEN: "",
            peso: "",
            preco: "",
            selo: "",
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
          placeholder="Descrição (PT)"
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

        <div style={{ marginBottom: "15px", marginTop: "25px" }}>
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

        <h3>Ingredientes</h3>
        <div style={styles.ingRow}>
          <select
            style={styles.inputSmall}
            value={novoIngrediente.ingredienteId}
            onChange={(e) =>
              setNovoIngrediente({ ...novoIngrediente, ingredienteId: e.target.value })
            }
          >
            <option value="">Selecione um ingrediente</option>
            {ingredientesDisponiveis.map(ing => (
              <option key={ing.id} value={ing.id}>
                {ing.nome} (R$ {Number(ing.precoPorUnidade).toFixed(4)}/{ing.unidade === 'kg' ? 'kg' : ing.unidade === 'litro' ? 'L' : 'un'})
              </option>
            ))}
          </select>

          <input
            style={styles.inputSmall}
            placeholder="Quantidade (g, ml ou un)"
            type="number"
            step="0.001"
            value={novoIngrediente.quantidade}
            onChange={(e) =>
              setNovoIngrediente({ ...novoIngrediente, quantidade: e.target.value })
            }
          />

          <button style={styles.addIngBtn} onClick={adicionarIngrediente}>
            Adicionar
          </button>
        </div>

        {form.ingredientes.length > 0 && (
          <div style={styles.ingList}>
            <div style={{ marginBottom: "10px", fontWeight: "bold" }}>
              Custo Total dos Ingredientes: R$ {form.ingredientes.reduce((sum, ing) => sum + ing.custo, 0).toFixed(2)}
            </div>
            {form.ingredientes.map((ing, idx) => (
              <div key={idx} style={styles.ingItem}>
                <div>
                  <strong>{ing.nome}</strong> — {ing.quantidade}{ing.unidade === 'kg' ? 'g' : ing.unidade === 'litro' ? 'ml' : 'un'} — R$ {ing.custo.toFixed(2)}
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

        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={styles.saveBtn} onClick={salvarHamburguer}>
            {editandoId ? 'Atualizar Hambúrguer' : 'Salvar Hambúrguer'}
          </button>
          {editandoId && (
            <button style={styles.cancelBtn} onClick={cancelarEdicao}>
              Cancelar
            </button>
          )}
        </div>
      </div>

      <h2 style={styles.subtitle}>Hambúrgueres Cadastrados</h2>

      {hamburgueres.length === 0 && <p>Nenhum hambúrguer cadastrado.</p>}

      {hamburgueres.map((h, i) => (
        <div key={i} style={styles.itemCard}>
          {h.img && <img src={h.img} style={styles.itemPhoto} alt="" />}

          <div style={{ flex: 1 }}>
            <strong>{h.nome}</strong> — R$ {Number(h.preco).toFixed(2)}
            {h.selo && <span style={styles.seloTag}> • {h.selo === 'maisVendido' ? 'Mais Vendido' : 'Especial da Semana'}</span>}
            <br />
            <small>{h.descricao}</small>
          </div>
          
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <button style={styles.editBtn} onClick={() => editarHamburguer(h)}>
              ✏️ Editar
            </button>
            <button style={styles.deleteBtn} onClick={() => deletarHamburguer(h.id)}>
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
    flex: 1,
    background: "#000",
    color: "#fff",
    padding: 12,
    borderRadius: 10,
    border: "none",
    fontWeight: 700,
    cursor: "pointer",
  },
  cancelBtn: {
    marginTop: 14,
    flex: 1,
    background: "#666",
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
    alignItems: "center",
  },
  itemPhoto: {
    width: 80,
    height: 80,
    borderRadius: 8,
    border: "2px solid #000",
    objectFit: "cover",
  },
  editBtn: {
    background: "#000",
    color: "#F1B100",
    padding: "8px 12px",
    borderRadius: 8,
    border: "none",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "14px",
  },
  deleteBtn: {
    background: "#c62828",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: 8,
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
