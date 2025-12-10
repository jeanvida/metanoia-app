import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import VoltarBtn from "../../components/VoltarBtn";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableItem } from "../../components/SortableItem";

const API_URL = import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname === 'localhost' 
    ? "http://localhost:3001" 
    : "https://metanoia-app.onrender.com");

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
  const [categoriaId, setCategoriaId] = useState(null);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    descricaoES: "",
    descricaoEN: "",
    selo: "",
    foto: "",
    itensCombo: [],
  });

  const [precoSugerido, setPrecoSugerido] = useState(0);
  const [precoFinal, setPrecoFinal] = useState("");

  // Itens disponíveis para selecionar
  const [hamburgueres, setHamburgueres] = useState([]);
  const [acompanhamentos, setAcompanhamentos] = useState([]);
  const [bebidas, setBebidas] = useState([]);

  // Item sendo adicionado ao combo
  const [novoItemCombo, setNovoItemCombo] = useState({
    tipo: "",
    itemId: "",
  });

  // Sensors para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Função para reordenar combos
  async function handleDragEndCombos(event) {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      setCombos((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        const reordered = arrayMove(items, oldIndex, newIndex);
        
        const updates = reordered.map((item, index) => ({
          id: item.id,
          ordem: index
        }));
        
        fetch(`${API_URL}/api/itens/reordenar`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itens: updates })
        }).catch(err => console.error('Erro ao salvar ordem:', err));
        
        return reordered;
      });
    }
  }

  // Recalcular preço sugerido quando itens do combo mudarem
  useEffect(() => {
    if (form.itensCombo.length > 0) {
      const totalPreco = form.itensCombo.reduce((sum, item) => sum + item.preco, 0);
      // Aplicar desconto de 10% no combo
      const sugerido = totalPreco * 0.9;
      setPrecoSugerido(sugerido);
    } else {
      setPrecoSugerido(0);
    }
  }, [form.itensCombo]);

  useEffect(() => {
    const inicializar = async () => {
      try {
        await fetch(`${API_URL}/api/init-categorias`, { method: "POST" });
        const catResponse = await fetch(`${API_URL}/api/categorias`);
        const categorias = await catResponse.json();
        const comboCategoria = categorias.find((c) => c.nome === "Combos");
        if (comboCategoria) setCategoriaId(comboCategoria.id);

        const response = await fetch(`${API_URL}/api/itens?categoria=Combos`);
        if (response.ok) {
          const data = await response.json();
          setCombos(data);
        }

        // Carregar hambúrgueres disponíveis
        const hambResponse = await fetch(`${API_URL}/api/itens?categoria=Hambúrgueres`);
        if (hambResponse.ok) {
          const hambData = await hambResponse.json();
          setHamburgueres(hambData);
        }

        // Carregar acompanhamentos disponíveis
        const acompResponse = await fetch(`${API_URL}/api/itens?categoria=Acompanhamentos`);
        if (acompResponse.ok) {
          const acompData = await acompResponse.json();
          setAcompanhamentos(acompData);
        }

        // Carregar bebidas disponíveis
        const bebResponse = await fetch(`${API_URL}/api/itens?categoria=Bebidas`);
        if (bebResponse.ok) {
          const bebData = await bebResponse.json();
          setBebidas(bebData);
        }
      } catch (error) {
        console.error("Erro ao inicializar:", error);
      }
    };
    inicializar();
  }, []);

  function adicionarItemAoCombo() {
    if (!novoItemCombo.tipo || !novoItemCombo.itemId) {
      alert("Selecione o tipo e o item");
      return;
    }

    let itemSelecionado;
    let tipoNome = "";

    if (novoItemCombo.tipo === "hamburguer") {
      itemSelecionado = hamburgueres.find(h => h.id === novoItemCombo.itemId);
      tipoNome = "Hambúrguer";
    } else if (novoItemCombo.tipo === "acompanhamento") {
      itemSelecionado = acompanhamentos.find(a => a.id === novoItemCombo.itemId);
      tipoNome = "Acompanhamento";
    } else if (novoItemCombo.tipo === "bebida") {
      itemSelecionado = bebidas.find(b => b.id === novoItemCombo.itemId);
      tipoNome = "Bebida";
    }

    if (!itemSelecionado) return;

    setForm((prev) => ({
      ...prev,
      itensCombo: [...prev.itensCombo, {
        itemId: itemSelecionado.id,
        tipo: novoItemCombo.tipo,
        tipoNome: tipoNome,
        nome: itemSelecionado.nome,
        preco: itemSelecionado.preco,
      }],
    }));

    setNovoItemCombo({ tipo: "", itemId: "" });
  }

  function removerItemDoCombo(index) {
    setForm((prev) => {
      const lista = [...prev.itensCombo];
      lista.splice(index, 1);
      return { ...prev, itensCombo: lista };
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

  function editarCombo(combo) {
    setEditandoId(combo.id);
    
    // Reconstruir itensCombo se existirem
    const itensComboReconstruidos = combo.itensCombo?.map(item => {
      let itemOriginal;
      let tipoNome = "";
      
      if (item.tipo === "hamburguer") {
        itemOriginal = hamburgueres.find(h => h.id === item.itemId);
        tipoNome = "Hambúrguer";
      } else if (item.tipo === "acompanhamento") {
        itemOriginal = acompanhamentos.find(a => a.id === item.itemId);
        tipoNome = "Acompanhamento";
      } else if (item.tipo === "bebida") {
        itemOriginal = bebidas.find(b => b.id === item.itemId);
        tipoNome = "Bebida";
      }
      
      return {
        itemId: item.itemId,
        tipo: item.tipo,
        tipoNome: tipoNome,
        nome: itemOriginal?.nome || item.nome,
        preco: itemOriginal?.preco || item.preco,
      };
    }) || [];
    
    setForm({
      nome: combo.nome,
      descricao: combo.descricao || "",
      descricaoES: combo.descricaoES || "",
      descricaoEN: combo.descricaoEN || "",
      selo: combo.selo || "",
      foto: combo.img || "",
      itensCombo: itensComboReconstruidos,
    });
    setPrecoFinal(String(combo.preco));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setForm({
      nome: "",
      descricao: "",
      descricaoES: "",
      descricaoEN: "",
      selo: "",
      foto: "",
      itensCombo: [],
    });
    setPrecoFinal("");
    setPrecoSugerido(0);
  }

  async function deletarCombo(id) {
    if (!confirm('Tem certeza que deseja deletar este combo?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/itens/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Combo deletado com sucesso!');
        setCombos(prev => prev.filter(c => c.id !== id));
      } else {
        alert('Erro ao deletar combo');
      }
    } catch (error) {
      console.error('Erro ao deletar:', error);
      alert('Erro ao conectar com o servidor');
    }
  }

  async function duplicarCombo(combo) {
    if (!confirm(`Duplicar "${combo.nome}"?`)) return;
    
    try {
      const dadosDuplicados = {
        nome: `${combo.nome} - Cópia`,
        descricao: combo.descricao || "",
        descricaoES: combo.descricaoES || "",
        descricaoEN: combo.descricaoEN || "",
        preco: combo.preco,
        img: combo.img || "",
        selo: combo.selo || "",
        categoriaId: categoriaId,
        itensCombo: combo.itensCombo || []
      };

      const response = await fetch(`${API_URL}/api/itens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosDuplicados),
      });

      if (response.ok) {
        alert('Combo duplicado com sucesso!');
        
        const recarregar = await fetch(`${API_URL}/api/itens?categoria=Combos`);
        if (recarregar.ok) {
          const data = await recarregar.json();
          setCombos(data);
        }
      } else {
        const errorText = await response.text();
        console.error('Erro ao duplicar:', errorText);
        alert('Erro ao duplicar combo');
      }
    } catch (error) {
      console.error('Erro ao duplicar:', error);
      alert('Erro ao conectar com o servidor');
    }
  }

  function salvarCombo() {
    if (!form.nome || !form.descricao || !precoFinal) {
      alert("Preencha nome, descrição e preço final");
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
            descricaoES: form.descricaoES || null,
            descricaoEN: form.descricaoEN || null,
            preco: Number(precoFinal),
            selo: form.selo || null,
            img: form.foto || "",
            categoriaId: categoriaId,
            itensCombo: form.itensCombo
          }),
        });

        if (response.ok) {
          const mensagem = editandoId ? "Combo atualizado com sucesso!" : "Combo cadastrado com sucesso!";
          alert(mensagem);
          
          const recarregar = await fetch(`${API_URL}/api/itens?categoria=Combos`);
          if (recarregar.ok) {
            const data = await recarregar.json();
            setCombos(data);
          }
          
          setEditandoId(null);
          setForm({
            nome: "",
            descricao: "",
            descricaoES: "",
            descricaoEN: "",
            selo: "",
            foto: "",
            itensCombo: [],
          });
          setPrecoFinal("");
          setPrecoSugerido(0);
          setNovoItemCombo({ tipo: "", itemId: "" });
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
      <h1 style={styles.title}>Gerenciar Combos</h1>

      <div style={styles.card}>
        <h2 style={styles.subtitle}>Adicionar / Editar Combo</h2>

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

        <h3 style={{ marginTop: "30px" }}>Itens do Combo</h3>
        <div style={styles.row}>
          <select
            style={styles.inputSmall}
            value={novoItemCombo.tipo}
            onChange={(e) => setNovoItemCombo({ ...novoItemCombo, tipo: e.target.value, itemId: "" })}
          >
            <option value="">Selecione o tipo</option>
            <option value="hamburguer">Hambúrguer</option>
            <option value="acompanhamento">Acompanhamento</option>
            <option value="bebida">Bebida</option>
          </select>

          <select
            style={styles.inputSmall}
            value={novoItemCombo.itemId}
            onChange={(e) => setNovoItemCombo({ ...novoItemCombo, itemId: e.target.value })}
            disabled={!novoItemCombo.tipo}
          >
            <option value="">Selecione o item</option>
            {novoItemCombo.tipo === "hamburguer" && hamburgueres.map(h => (
              <option key={h.id} value={h.id}>
                {h.nome} - R$ {Number(h.preco).toFixed(2)}
              </option>
            ))}
            {novoItemCombo.tipo === "acompanhamento" && acompanhamentos.map(a => (
              <option key={a.id} value={a.id}>
                {a.nome} - R$ {Number(a.preco).toFixed(2)}
              </option>
            ))}
            {novoItemCombo.tipo === "bebida" && bebidas.map(b => (
              <option key={b.id} value={b.id}>
                {b.nome} - R$ {Number(b.preco).toFixed(2)}
              </option>
            ))}
          </select>

          <button style={styles.addIngBtn} onClick={adicionarItemAoCombo}>
            Adicionar
          </button>
        </div>

        {form.itensCombo.length > 0 && (
          <div style={styles.ingList}>
            {form.itensCombo.map((item, idx) => (
              <div key={idx} style={styles.ingItem}>
                <div>
                  <strong>{item.tipoNome}:</strong> {item.nome} — R$ {Number(item.preco).toFixed(2)}
                </div>
                <button
                  style={styles.removeIngBtn}
                  onClick={() => removerItemDoCombo(idx)}
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}

        <h3 style={{ marginTop: "30px" }}>Resumo do Combo</h3>
        
        <div style={styles.resumoBox}>
          <div style={styles.resumoItem}>
            <strong>Total dos Itens:</strong> R$ {form.itensCombo.reduce((sum, item) => sum + item.preco, 0).toFixed(2)}
          </div>
          
          <div style={{ ...styles.resumoItem, backgroundColor: "#fff3cd", padding: "10px", borderRadius: "8px", marginTop: "10px" }}>
            <strong>Preço Sugerido (10% desconto):</strong> 
            <span style={{ fontSize: "20px", color: "#856404", marginLeft: "10px" }}>
              R$ {precoSugerido.toFixed(2)}
            </span>
          </div>
          
          <div style={{ marginTop: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Preço Final ao Cliente (R$) *
            </label>
            <input
              style={{ ...styles.input, fontSize: "18px", fontWeight: "bold" }}
              placeholder="Digite o preço de venda"
              type="number"
              step="0.01"
              value={precoFinal}
              onChange={(e) => setPrecoFinal(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button style={styles.saveBtn} onClick={salvarCombo}>
            {editandoId ? 'Atualizar Combo' : 'Salvar Combo'}
          </button>
          {editandoId && (
            <button style={styles.cancelBtn} onClick={cancelarEdicao}>
              Cancelar
            </button>
          )}
        </div>
      </div>

      <h2 style={styles.subtitle}>Combos Cadastrados</h2>

      {combos.length === 0 && <p>Nenhum combo cadastrado.</p>}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEndCombos}
      >
        <SortableContext
          items={combos.map(c => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {combos.map((c, i) => (
            <SortableItem key={c.id} id={c.id}>
              {({ attributes, listeners }) => (
                <div style={styles.itemCard}>
                  <span style={styles.dragHandle} {...attributes} {...listeners}>⋮⋮</span>
                  {c.img && <img src={c.img} style={styles.itemPhoto} alt="" />}

                  <div style={{ flex: 1 }}>
                    <strong>{c.nome}</strong> — R$ {Number(c.preco).toFixed(2)}
                    {c.selo && <span style={styles.seloTag}> • {c.selo === 'maisVendido' ? 'Mais Vendido' : 'Especial da Semana'}</span>}
                    <br />
                    <small>{c.descricao}</small>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    <button style={styles.editBtn} onClick={() => editarCombo(c)}>
                      ✏️ Editar
                    </button>
                    <button style={styles.duplicateBtn} onClick={() => duplicarCombo(c)}>
                      📋 Duplicar
                    </button>
                    <button style={styles.deleteBtn} onClick={() => deletarCombo(c.id)}>
                      🗑️
                    </button>
                  </div>
                </div>
              )}
            </SortableItem>
          ))}
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
    padding: "8px",
    backgroundColor: "#f9f9f9",
    borderRadius: "6px",
    alignItems: "center",
  },
  removeIngBtn: {
    background: "#c62828",
    color: "#fff",
    padding: "6px 10px",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
  },
  resumoBox: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    border: "2px solid #000",
  },
  resumoItem: {
    marginBottom: 8,
    fontSize: "16px",
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
  duplicateBtn: {
    background: "#1976d2",
    color: "#fff",
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
  dragHandle: {
    cursor: "grab",
    marginRight: "10px",
    color: "#999",
    fontSize: "18px",
    userSelect: "none",
  },
};
