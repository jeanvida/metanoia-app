import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import VoltarBtn from "../../components/VoltarBtn";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableItem } from "../../components/SortableItem";

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
  const [ingredientesDisponiveis, setIngredientesDisponiveis] = useState([]);
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    descricaoES: "",
    descricaoEN: "",
    foto: "",
    selo: "",
    ingredientes: [],
  });

  const [precoSugerido, setPrecoSugerido] = useState(0);
  const [precoFinal, setPrecoFinal] = useState("");

  const [novoIngrediente, setNovoIngrediente] = useState({
    ingredienteId: "",
    quantidade: "",
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

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

        // Buscar ingredientes disponíveis
        const ingredientesRes = await fetch(`${API_URL}/api/ingredientes`);
        if (ingredientesRes.ok) {
          const ingData = await ingredientesRes.json();
          setIngredientesDisponiveis(ingData);
        }
      } catch (error) {
        console.error("Erro ao inicializar:", error);
      }
    };
    inicializar();
  }, []);

  // Calcular preço sugerido baseado nos ingredientes
  useEffect(() => {
    if (form.ingredientes.length === 0) {
      setPrecoSugerido(0);
      return;
    }

    let custoTotal = 0;
    
    form.ingredientes.forEach((ing) => {
      const ingrediente = ingredientesDisponiveis.find((i) => i.id === ing.ingredienteId);
      if (ingrediente && ing.quantidade) {
        // Calcular custo baseado no precoPorUnidade do ingrediente
        const custoPorPorcao = Number(ingrediente.precoPorUnidade || 0) * Number(ing.quantidade);
        custoTotal += custoPorPorcao;
      }
    });

    const sugerido = custoTotal * 3;
    setPrecoSugerido(sugerido);
  }, [form.ingredientes, ingredientesDisponiveis]);

  function adicionarIngrediente() {
    if (!novoIngrediente.ingredienteId || !novoIngrediente.quantidade) {
      alert("Selecione um ingrediente e informe a quantidade");
      return;
    }

    const jaExiste = form.ingredientes.find(
      (i) => i.ingredienteId === novoIngrediente.ingredienteId
    );

    if (jaExiste) {
      alert("Este ingrediente já foi adicionado");
      return;
    }

    const ingrediente = ingredientesDisponiveis.find(i => i.id === novoIngrediente.ingredienteId);
    const custo = ingrediente ? Number(ingrediente.precoPorUnidade || 0) * Number(novoIngrediente.quantidade) : 0;

    setForm({
      ...form,
      ingredientes: [
        ...form.ingredientes,
        {
          ingredienteId: novoIngrediente.ingredienteId,
          quantidade: Number(novoIngrediente.quantidade),
          custo: custo,
        },
      ],
    });

    setNovoIngrediente({ ingredienteId: "", quantidade: "" });
  }

  function removerIngrediente(ingredienteId) {
    setForm({
      ...form,
      ingredientes: form.ingredientes.filter(
        (i) => i.ingredienteId !== ingredienteId
      ),
    });
  }

  function editarBebida(bebida) {
    setEditandoId(bebida.id);
    
    // Buscar ingredientes detalhados da bebida
    const ingredientesFormatados = (bebida.ingredientes || []).map((relacao) => ({
      ingredienteId: relacao.ingrediente.id,
      quantidade: relacao.quantidade,
      custo: relacao.custo,
    }));

    setForm({
      nome: bebida.nome,
      descricao: bebida.descricao || "",
      descricaoES: bebida.descricaoES || "",
      descricaoEN: bebida.descricaoEN || "",
      foto: bebida.img || "",
      selo: bebida.selo || "",
      ingredientes: ingredientesFormatados,
    });

    setPrecoFinal(String(bebida.preco));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setForm({
      nome: "",
      descricao: "",
      descricaoES: "",
      descricaoEN: "",
      foto: "",
      selo: "",
      ingredientes: [],
    });
    setPrecoFinal("");
    setNovoIngrediente({ ingredienteId: "", quantidade: "" });
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
    if (!form.nome || !precoFinal) {
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
            preco: Number(precoFinal),
            selo: form.selo || null,
            img: form.foto || "",
            categoriaId: categoriaId || 4,
            ingredientes: form.ingredientes,
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
            foto: "",
            selo: "",
            ingredientes: [],
          });
          setPrecoFinal("");
          setNovoIngrediente({ ingredienteId: "", quantidade: "" });
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

  async function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = bebidas.findIndex((b) => b.id === active.id);
    const newIndex = bebidas.findIndex((b) => b.id === over.id);

    const novaOrdem = arrayMove(bebidas, oldIndex, newIndex);
    setBebidas(novaOrdem);

    try {
      for (let i = 0; i < novaOrdem.length; i++) {
        await fetch(`${API_URL}/api/itens/${novaOrdem[i].id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ordem: i + 1 }),
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar ordem:", error);
    }
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

        <h3 style={{ marginTop: "30px", marginBottom: "10px" }}>Produtos</h3>
        
        <div style={styles.row}>
          <select
            style={styles.inputSmall}
            value={novoIngrediente.ingredienteId}
            onChange={(e) =>
              setNovoIngrediente({ ...novoIngrediente, ingredienteId: e.target.value })
            }
          >
            <option value="">Selecione produto</option>
            {ingredientesDisponiveis.map((ing) => (
              <option key={ing.id} value={ing.id}>
                {ing.nome} ({ing.unidadeMedida})
              </option>
            ))}
          </select>

          <input
            style={styles.inputSmall}
            type="number"
            placeholder="Qtd"
            value={novoIngrediente.quantidade}
            onChange={(e) =>
              setNovoIngrediente({ ...novoIngrediente, quantidade: e.target.value })
            }
          />

          <button style={styles.buttonSmall} onClick={adicionarIngrediente}>
            ➕ Adicionar
          </button>
        </div>

        {form.ingredientes.length > 0 && (
          <div style={styles.ingredientesList}>
            <h4>Produtos Adicionados:</h4>
            {form.ingredientes.map((ing) => {
              const ingrediente = ingredientesDisponiveis.find((i) => i.id === ing.ingredienteId);
              if (!ingrediente) return null;
              
              const custoPorPorcao = Number(ingrediente.precoPorUnidade || 0) * Number(ing.quantidade);
              
              return (
                <div key={ing.ingredienteId} style={styles.ingredienteItem}>
                  <span>
                    {ingrediente.nome} - {ing.quantidade} {ingrediente.unidade}
                    <small style={{ color: "#666", marginLeft: "10px" }}>
                      (Custo: R$ {custoPorPorcao.toFixed(2)})
                    </small>
                  </span>
                  <button
                    style={styles.removeBtn}
                    onClick={() => removerIngrediente(ing.ingredienteId)}
                  >
                    ❌
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div style={styles.precoBox}>
          <div>
            <strong>💰 Custo Total:</strong> R$ {(precoSugerido / 3).toFixed(2)}
          </div>
          <div>
            <strong>💡 Preço Sugerido (3x):</strong> R$ {precoSugerido.toFixed(2)}
          </div>
        </div>

        <input
          style={styles.input}
          type="number"
          step="0.01"
          placeholder="Preço Final de Venda (R$)"
          value={precoFinal}
          onChange={(e) => setPrecoFinal(e.target.value)}
        />

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

        <label style={styles.fileLabel}>
          Anexar foto (jpg/png)
          <input type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
        </label>

        {form.foto && (
          <img src={form.foto} alt="preview" style={styles.preview} />
        )}

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

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={bebidas.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          {bebidas.map((b) => {
            // Calcular custo total dos ingredientes
            let custoTotal = 0;
            if (b.ingredientes && b.ingredientes.length > 0) {
              b.ingredientes.forEach((relacao) => {
                const custoPorPorcao = Number(relacao.custo || 0);
                custoTotal += custoPorPorcao;
              });
            }
            const lucro = Number(b.preco) - custoTotal;

            return (
              <SortableItem key={b.id} id={b.id}>
                <div style={styles.itemCard}>
                  <div style={{ fontSize: "20px", color: "#999", cursor: "grab", marginRight: "10px" }}>
                    ⋮⋮
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong>{b.nome}</strong> — R${Number(b.preco).toFixed(2)}
                    {b.ingredientes && b.ingredientes.length > 0 && (
                      <span style={styles.custoTag}>
                        {" • Custo: R$"}{custoTotal.toFixed(2)}
                        {" • Lucro: R$"}{lucro.toFixed(2)}
                      </span>
                    )}
                    {b.selo && <span style={styles.seloTag}> • {b.selo === 'maisVendido' ? 'Mais Vendido' : 'Especial da Semana'}</span>}
                    <br />
                    <small>{b.descricao}</small>
                    {b.ingredientes && b.ingredientes.length > 0 && (
                      <div style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}>
                        Produtos: {b.ingredientes.map(rel => rel.ingrediente.nome).join(", ")}
                      </div>
                    )}
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
              </SortableItem>
            );
          })}
        </SortableContext>
      </DndContext>
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
  ingredientesList: {
    marginTop: "15px",
    padding: "10px",
    background: "#f9f9f9",
    borderRadius: "8px",
  },
  ingredienteItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px",
    marginTop: "5px",
    background: "#fff",
    borderRadius: "5px",
    border: "1px solid #ddd",
  },
  removeBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
  },
  precoBox: {
    background: "#fff3cd",
    padding: "15px",
    borderRadius: "10px",
    marginTop: "15px",
    border: "2px solid #F1B100",
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
    cursor: "grab",
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
  custoTag: {
    color: "#666",
    fontSize: "12px",
    fontWeight: "600",
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
};
