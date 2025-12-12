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
  const [pesoTotal, setPesoTotal] = useState(0);

  const [novoIngrediente, setNovoIngrediente] = useState({
    ingredienteId: "",
    quantidade: "",
  });

  // Sensors para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Função para reordenar acompanhamentos
  async function handleDragEndAcompanhamentos(event) {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      setAcomp((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        const reordered = arrayMove(items, oldIndex, newIndex);
        
        // Salvar nova ordem no backend
        const updates = reordered.map((item, index) => ({
          id: item.id,
          ordem: index
        }));
        
        console.log('🔄 Salvando nova ordem:', updates);
        
        fetch(`${API_URL}/api/itens/reordenar`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itens: updates })
        })
        .then(res => {
          if (res.ok) {
            console.log('✅ Ordem salva com sucesso!');
          } else {
            console.error('❌ Erro ao salvar ordem:', res.status);
          }
        })
        .catch(err => console.error('❌ Erro ao salvar ordem:', err));
        
        return reordered;
      });
    }
  }

  // Função para reordenar ingredientes do form
  function handleDragEndIngredientes(event) {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      setForm((prev) => {
        const oldIndex = prev.ingredientes.findIndex((_, idx) => idx === active.id);
        const newIndex = prev.ingredientes.findIndex((_, idx) => idx === over.id);
        
        return {
          ...prev,
          ingredientes: arrayMove(prev.ingredientes, oldIndex, newIndex)
        };
      });
    }
  }

  // Recalcular totais quando ingredientes mudarem
  useEffect(() => {
    if (form.ingredientes.length > 0) {
      // Calcular custo total
      const custoTotal = form.ingredientes.reduce((sum, ing) => sum + ing.custo, 0);
      const sugerido = custoTotal * 3;
      setPrecoSugerido(sugerido);

      // Calcular peso total (em gramas)
      const pesoTotalGramas = form.ingredientes.reduce((sum, ing) => sum + (ing.pesoGramas || 0), 0);
      setPesoTotal(pesoTotalGramas);
    } else {
      setPrecoSugerido(0);
      setPesoTotal(0);
    }
  }, [form.ingredientes]);

  useEffect(() => {
    const inicializar = async () => {
      try {
        await fetch(`${API_URL}/api/init-categorias`, { method: "POST" });
        const catResponse = await fetch(`${API_URL}/api/categorias`);
        const categorias = await catResponse.json();
        const acompCategoria = categorias.find((c) => c.nome === "Acompanhamentos");
        if (acompCategoria) setCategoriaId(acompCategoria.id);

        const response = await fetch(`${API_URL}/api/itens?categoria=Acompanhamentos&includeIngredientes=true&includeIngredientes=true`);
        if (response.ok) {
          const data = await response.json();
          setAcomp(data);
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

    const quantidade = parseFloat(novoIngrediente.quantidade);
    let custo = 0;
    let quantidadeExibida = quantidade;
    let unidadeExibida = ingredienteSelecionado.unidade;
    let descricaoDetalhada = "";
    let pesoGramas = 0;

    // Lógica de cálculo baseada no tipo de unidade
    if (ingredienteSelecionado.unidade === "unidade") {
      if (ingredienteSelecionado.pesoMedioPorUnidade && ingredienteSelecionado.pesoPorPorcao) {
        const pesoTotal = quantidade * parseFloat(ingredienteSelecionado.pesoPorPorcao);
        const unidadesNecessarias = pesoTotal / parseFloat(ingredienteSelecionado.pesoMedioPorUnidade);
        custo = unidadesNecessarias * parseFloat(ingredienteSelecionado.precoPorUnidade);
        pesoGramas = pesoTotal;
        
        const tipoPorcao = ingredienteSelecionado.tipoPorcao || "porção";
        if (tipoPorcao === "fatia") {
          unidadeExibida = quantidade === 1 ? "fatia" : "fatias";
        } else if (tipoPorcao === "unidade") {
          unidadeExibida = quantidade === 1 ? "un" : "uns";
        } else if (tipoPorcao === "rodela") {
          unidadeExibida = quantidade === 1 ? "rodela" : "rodelas";
        } else if (tipoPorcao === "folha") {
          unidadeExibida = quantidade === 1 ? "folha" : "folhas";
        } else {
          unidadeExibida = quantidade === 1 ? "porção" : "porções";
        }
        
        descricaoDetalhada = `${quantidadeExibida} ${unidadeExibida} (${pesoTotal.toFixed(0)}g)`;
      } else {
        custo = quantidade * parseFloat(ingredienteSelecionado.precoPorUnidade);
        unidadeExibida = quantidade === 1 ? "un" : "uns";
        descricaoDetalhada = `${quantidadeExibida} ${unidadeExibida}`;
        
        if (ingredienteSelecionado.pesoMedioPorUnidade) {
          pesoGramas = quantidade * parseFloat(ingredienteSelecionado.pesoMedioPorUnidade);
          descricaoDetalhada = `${quantidadeExibida} ${unidadeExibida} (${pesoGramas.toFixed(0)}g)`;
        }
      }
    } else if (ingredienteSelecionado.unidade === "kg") {
      if (ingredienteSelecionado.pesoPorPorcao) {
        const pesoTotal = quantidade * parseFloat(ingredienteSelecionado.pesoPorPorcao);
        const pesoEmKg = pesoTotal / 1000;
        custo = pesoEmKg * parseFloat(ingredienteSelecionado.precoPorUnidade);
        
        const tipoPorcao = ingredienteSelecionado.tipoPorcao || "porção";
        if (tipoPorcao === "fatia") {
          unidadeExibida = quantidade === 1 ? "fatia" : "fatias";
        } else if (tipoPorcao === "unidade") {
          unidadeExibida = quantidade === 1 ? "un" : "uns";
        } else if (tipoPorcao === "rodela") {
          unidadeExibida = quantidade === 1 ? "rodela" : "rodelas";
        } else if (tipoPorcao === "folha") {
          unidadeExibida = quantidade === 1 ? "folha" : "folhas";
        } else {
          unidadeExibida = quantidade === 1 ? "porção" : "porções";
        }
        
        descricaoDetalhada = `${quantidadeExibida} ${unidadeExibida} (${pesoTotal.toFixed(0)}g)`;
        pesoGramas = pesoTotal;
      } else {
        const quantidadeEmKg = quantidade / 1000;
        custo = quantidadeEmKg * parseFloat(ingredienteSelecionado.precoPorUnidade);
        unidadeExibida = "g";
        descricaoDetalhada = `${quantidadeExibida}g`;
        pesoGramas = quantidade;
      }
    } else if (ingredienteSelecionado.unidade === "litro") {
      if (ingredienteSelecionado.pesoPorPorcao) {
        const volumeTotal = quantidade * parseFloat(ingredienteSelecionado.pesoPorPorcao);
        const volumeEmLitros = volumeTotal / 1000;
        custo = volumeEmLitros * parseFloat(ingredienteSelecionado.precoPorUnidade);
        unidadeExibida = quantidade === 1 ? "porção" : "porções";
        descricaoDetalhada = `${quantidadeExibida} ${unidadeExibida} (${volumeTotal.toFixed(0)}ml)`;
        pesoGramas = volumeTotal;
      } else {
        const quantidadeEmLitros = quantidade / 1000;
        custo = quantidadeEmLitros * parseFloat(ingredienteSelecionado.precoPorUnidade);
        unidadeExibida = "ml";
        descricaoDetalhada = `${quantidadeExibida}ml`;
        pesoGramas = quantidade;
      }
    }

    setForm((prev) => ({
      ...prev,
      ingredientes: [...prev.ingredientes, {
        ingredienteId: ingredienteSelecionado.id,
        nome: ingredienteSelecionado.nome,
        quantidade: quantidadeExibida,
        unidade: unidadeExibida,
        descricaoDetalhada: descricaoDetalhada,
        pesoPorPorcao: ingredienteSelecionado.pesoPorPorcao || null,
        pesoGramas: pesoGramas,
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

  function editarQuantidadeIngrediente(index) {
    const ingrediente = form.ingredientes[index];
    const novaQuantidade = prompt(
      `Alterar quantidade de ${ingrediente.nome}\nQuantidade atual: ${ingrediente.quantidade}`,
      ingrediente.quantidade
    );
    
    if (!novaQuantidade || isNaN(novaQuantidade) || parseFloat(novaQuantidade) <= 0) {
      return;
    }
    
    const ingredienteOriginal = ingredientesDisponiveis.find(i => i.id === ingrediente.ingredienteId);
    if (!ingredienteOriginal) return;
    
    const quantidade = parseFloat(novaQuantidade);
    let custo = 0;
    let quantidadeExibida = quantidade;
    let unidadeExibida = ingrediente.unidade;
    let descricaoDetalhada = "";
    let pesoGramas = 0;
    
    if (ingredienteOriginal.unidade === "unidade") {
      if (ingredienteOriginal.pesoMedioPorUnidade && ingredienteOriginal.pesoPorPorcao) {
        const pesoTotal = quantidade * parseFloat(ingredienteOriginal.pesoPorPorcao);
        const unidadesNecessarias = pesoTotal / parseFloat(ingredienteOriginal.pesoMedioPorUnidade);
        custo = unidadesNecessarias * parseFloat(ingredienteOriginal.precoPorUnidade);
        pesoGramas = pesoTotal;
        descricaoDetalhada = `${quantidadeExibida} ${unidadeExibida} (${pesoTotal.toFixed(0)}g)`;
      } else {
        custo = quantidade * parseFloat(ingredienteOriginal.precoPorUnidade);
        if (ingredienteOriginal.pesoMedioPorUnidade) {
          pesoGramas = quantidade * parseFloat(ingredienteOriginal.pesoMedioPorUnidade);
          descricaoDetalhada = `${quantidadeExibida} ${unidadeExibida} (${pesoGramas.toFixed(0)}g)`;
        } else {
          descricaoDetalhada = `${quantidadeExibida} ${unidadeExibida}`;
        }
      }
    } else if (ingredienteOriginal.unidade === "kg") {
      if (ingredienteOriginal.pesoPorPorcao) {
        const pesoTotal = quantidade * parseFloat(ingredienteOriginal.pesoPorPorcao);
        const pesoEmKg = pesoTotal / 1000;
        custo = pesoEmKg * parseFloat(ingredienteOriginal.precoPorUnidade);
        pesoGramas = pesoTotal;
        descricaoDetalhada = `${quantidadeExibida} ${unidadeExibida} (${pesoTotal.toFixed(0)}g)`;
      } else {
        const quantidadeEmKg = quantidade / 1000;
        custo = quantidadeEmKg * parseFloat(ingredienteOriginal.precoPorUnidade);
        pesoGramas = quantidade;
        descricaoDetalhada = `${quantidadeExibida}g`;
      }
    } else if (ingredienteOriginal.unidade === "litro") {
      if (ingredienteOriginal.pesoPorPorcao) {
        const volumeTotal = quantidade * parseFloat(ingredienteOriginal.pesoPorPorcao);
        const volumeEmLitros = volumeTotal / 1000;
        custo = volumeEmLitros * parseFloat(ingredienteOriginal.precoPorUnidade);
        pesoGramas = volumeTotal;
        descricaoDetalhada = `${quantidadeExibida} ${unidadeExibida} (${volumeTotal.toFixed(0)}ml)`;
      } else {
        const quantidadeEmLitros = quantidade / 1000;
        custo = quantidadeEmLitros * parseFloat(ingredienteOriginal.precoPorUnidade);
        pesoGramas = quantidade;
        descricaoDetalhada = `${quantidadeExibida}ml`;
      }
    }
    
    setForm((prev) => {
      const lista = [...prev.ingredientes];
      lista[index] = {
        ...lista[index],
        quantidade: quantidadeExibida,
        descricaoDetalhada: descricaoDetalhada,
        pesoGramas: pesoGramas,
        custo: custo,
      };
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

  function editarAcompanhamento(acompanhamento) {
    setEditandoId(acompanhamento.id);
    
    const ingredientesConvertidos = acompanhamento.ingredientes?.map(itemIng => {
      const ing = ingredientesDisponiveis.find(i => i.id === itemIng.ingredienteId);
      
      if (!ing) return null;
      
      const quantidade = parseFloat(itemIng.quantidade);
      let descricaoDetalhada = "";
      let pesoGramas = 0;
      let unidadeExibida = "";
      
      if (ing.unidade === "unidade") {
        if (ing.pesoMedioPorUnidade && ing.pesoPorPorcao) {
          const pesoTotal = quantidade * parseFloat(ing.pesoPorPorcao);
          pesoGramas = pesoTotal;
          
          const tipoPorcao = ing.tipoPorcao || "porção";
          if (tipoPorcao === "fatia") {
            unidadeExibida = quantidade === 1 ? "fatia" : "fatias";
          } else if (tipoPorcao === "unidade") {
            unidadeExibida = quantidade === 1 ? "un" : "uns";
          } else if (tipoPorcao === "rodela") {
            unidadeExibida = quantidade === 1 ? "rodela" : "rodelas";
          } else if (tipoPorcao === "folha") {
            unidadeExibida = quantidade === 1 ? "folha" : "folhas";
          } else {
            unidadeExibida = quantidade === 1 ? "porção" : "porções";
          }
          
          descricaoDetalhada = `${quantidade} ${unidadeExibida} (${pesoGramas.toFixed(0)}g)`;
        } else {
          unidadeExibida = quantidade === 1 ? "un" : "uns";
          if (ing.pesoMedioPorUnidade) {
            pesoGramas = quantidade * parseFloat(ing.pesoMedioPorUnidade);
            descricaoDetalhada = `${quantidade} ${unidadeExibida} (${pesoGramas.toFixed(0)}g)`;
          } else {
            descricaoDetalhada = `${quantidade} ${unidadeExibida}`;
          }
        }
      } else if (ing.unidade === "kg") {
        if (ing.pesoPorPorcao) {
          const pesoTotal = quantidade * parseFloat(ing.pesoPorPorcao);
          pesoGramas = pesoTotal;
          
          const tipoPorcao = ing.tipoPorcao || "porção";
          if (tipoPorcao === "fatia") {
            unidadeExibida = quantidade === 1 ? "fatia" : "fatias";
          } else if (tipoPorcao === "unidade") {
            unidadeExibida = quantidade === 1 ? "un" : "uns";
          } else if (tipoPorcao === "rodela") {
            unidadeExibida = quantidade === 1 ? "rodela" : "rodelas";
          } else if (tipoPorcao === "folha") {
            unidadeExibida = quantidade === 1 ? "folha" : "folhas";
          } else {
            unidadeExibida = quantidade === 1 ? "porção" : "porções";
          }
          
          descricaoDetalhada = `${quantidade} ${unidadeExibida} (${pesoTotal.toFixed(0)}g)`;
        } else {
          pesoGramas = quantidade;
          unidadeExibida = "g";
          descricaoDetalhada = `${quantidade}g`;
        }
      } else if (ing.unidade === "litro") {
        if (ing.pesoPorPorcao) {
          const volumeTotal = quantidade * parseFloat(ing.pesoPorPorcao);
          pesoGramas = volumeTotal;
          unidadeExibida = quantidade === 1 ? "porção" : "porções";
          descricaoDetalhada = `${quantidade} ${unidadeExibida} (${volumeTotal.toFixed(0)}ml)`;
        } else {
          pesoGramas = quantidade;
          unidadeExibida = "ml";
          descricaoDetalhada = `${quantidade}ml`;
        }
      }
      
      return {
        ingredienteId: itemIng.ingredienteId,
        nome: ing.nome,
        quantidade: quantidade,
        unidade: unidadeExibida,
        descricaoDetalhada: descricaoDetalhada,
        pesoPorPorcao: ing.pesoPorPorcao || null,
        pesoGramas: pesoGramas,
        custo: parseFloat(itemIng.custo),
      };
    }).filter(Boolean) || [];
    
    setForm({
      nome: acompanhamento.nome,
      descricao: acompanhamento.descricao || "",
      descricaoES: acompanhamento.descricaoES || "",
      descricaoEN: acompanhamento.descricaoEN || "",
      foto: acompanhamento.img || "",
      selo: acompanhamento.selo || "",
      ingredientes: ingredientesConvertidos,
    });
    setPrecoFinal(String(acompanhamento.preco));
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
    setPesoTotal(0);
    setPrecoSugerido(0);
  }

  async function deletarAcompanhamento(id) {
    if (!confirm('Tem certeza que deseja deletar este acompanhamento?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/itens/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Acompanhamento deletado com sucesso!');
        setAcomp(prev => prev.filter(a => a.id !== id));
      } else {
        alert('Erro ao deletar acompanhamento');
      }
    } catch (error) {
      console.error('Erro ao deletar:', error);
      alert('Erro ao conectar com o servidor');
    }
  }

  async function duplicarAcompanhamento(acompanhamento) {
    if (!confirm(`Duplicar "${acompanhamento.nome}"?`)) return;
    
    try {
      const ingredientesParaSalvar = acompanhamento.ingredientes?.map(itemIng => ({
        ingredienteId: itemIng.ingredienteId,
        quantidade: itemIng.quantidade,
        custo: itemIng.custo
      })) || [];

      const dadosDuplicados = {
        nome: `${acompanhamento.nome} - Cópia`,
        descricao: acompanhamento.descricao || "",
        descricaoES: acompanhamento.descricaoES || "",
        descricaoEN: acompanhamento.descricaoEN || "",
        preco: acompanhamento.preco,
        img: acompanhamento.img || "",
        selo: acompanhamento.selo || "",
        categoriaId: categoriaId,
        ingredientes: ingredientesParaSalvar
      };

      const response = await fetch(`${API_URL}/api/itens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosDuplicados),
      });

      if (response.ok) {
        alert('Acompanhamento duplicado com sucesso!');
        
        const recarregar = await fetch(`${API_URL}/api/itens?categoria=Acompanhamentos&includeIngredientes=true`);
        if (recarregar.ok) {
          const data = await recarregar.json();
          setAcomp(data);
        }
      } else {
        const errorText = await response.text();
        console.error('Erro ao duplicar:', errorText);
        alert('Erro ao duplicar acompanhamento');
      }
    } catch (error) {
      console.error('Erro ao duplicar:', error);
      alert('Erro ao conectar com o servidor');
    }
  }

  function salvar() {
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
            peso: pesoTotal ? parseInt(pesoTotal, 10) : null,
            selo: form.selo || null,
            img: form.foto || "",
            categoriaId: categoriaId,
            ingredientes: form.ingredientes.map(ing => ({
              ingredienteId: ing.ingredienteId,
              quantidade: ing.quantidade,
              custo: ing.custo
            }))
          }),
        });

        if (response.ok) {
          const mensagem = editandoId ? "Acompanhamento atualizado com sucesso!" : "Acompanhamento cadastrado com sucesso!";
          alert(mensagem);
          
          const recarregar = await fetch(`${API_URL}/api/itens?categoria=Acompanhamentos&includeIngredientes=true`);
          if (recarregar.ok) {
            const data = await recarregar.json();
            setAcomp(data);
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
          setPesoTotal(0);
          setPrecoSugerido(0);
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

  return (
    <div style={{ ...styles.container, position: "relative" }}>
      <VoltarBtn />

      <h1 style={styles.title}>Gerenciar Acompanhamentos</h1>

      <div style={styles.card}>
        <h2 style={styles.subtitle}>Adicionar / Editar Acompanhamento</h2>

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

        <h3 style={{ marginTop: "30px" }}>Ingredientes</h3>
        <div style={styles.ingRow}>
          <select
            style={styles.inputSmall}
            value={novoIngrediente.ingredienteId}
            onChange={(e) =>
              setNovoIngrediente({ ...novoIngrediente, ingredienteId: e.target.value })
            }
          >
            <option value="">Selecione um ingrediente</option>
            {ingredientesDisponiveis.map(ing => {
              let tipoLabel = '';
              if (ing.unidade === 'unidade') {
                if (ing.pesoMedioPorUnidade && ing.pesoPorPorcao) {
                  const tipoPorcao = ing.tipoPorcao || 'porção';
                  tipoLabel = ` - ${Number(ing.pesoPorPorcao).toFixed(0)}g/${tipoPorcao}`;
                } else if (ing.pesoMedioPorUnidade) {
                  tipoLabel = ` - ${Number(ing.pesoMedioPorUnidade).toFixed(0)}g/un`;
                }
              } else if (ing.unidade === 'kg' && ing.pesoPorPorcao) {
                const tipoPorcao = ing.tipoPorcao || 'porção';
                tipoLabel = ` - ${Number(ing.pesoPorPorcao).toFixed(0)}g/${tipoPorcao}`;
              } else if (ing.unidade === 'litro' && ing.pesoPorPorcao) {
                tipoLabel = ` - ${Number(ing.pesoPorPorcao).toFixed(0)}ml/porção`;
              }
              
              return (
                <option key={ing.id} value={ing.id}>
                  {ing.nome}{tipoLabel}
                </option>
              );
            })}
          </select>

          <input
            style={styles.inputSmall}
            placeholder={
              novoIngrediente.ingredienteId 
                ? (() => {
                    const ing = ingredientesDisponiveis.find(i => i.id === novoIngrediente.ingredienteId);
                    if (!ing) return "Selecione ingrediente";
                    
                    if (ing.unidade === 'unidade') {
                      if (ing.pesoMedioPorUnidade && ing.pesoPorPorcao) {
                        const tipoPorcao = ing.tipoPorcao || 'porção';
                        const tipoPorcaoPlural = tipoPorcao === 'fatia' ? 'fatias' : 
                                                  tipoPorcao === 'unidade' ? 'uns' :
                                                  tipoPorcao === 'rodela' ? 'rodelas' :
                                                  tipoPorcao === 'folha' ? 'folhas' : 'porções';
                        return `Nº de ${tipoPorcaoPlural} (${Number(ing.pesoPorPorcao).toFixed(0)}g cada)`;
                      } else if (ing.pesoMedioPorUnidade) {
                        return `Quantidade (${Number(ing.pesoMedioPorUnidade).toFixed(0)}g cada)`;
                      } else {
                        return "Quantidade";
                      }
                    } else if (ing.unidade === 'kg') {
                      if (ing.pesoPorPorcao) {
                        const tipoPorcao = ing.tipoPorcao || 'porção';
                        const tipoPorcaoPlural = tipoPorcao === 'fatia' ? 'fatias' : 
                                                  tipoPorcao === 'unidade' ? 'uns' :
                                                  tipoPorcao === 'rodela' ? 'rodelas' :
                                                  tipoPorcao === 'folha' ? 'folhas' : 'porções';
                        return `Nº de ${tipoPorcaoPlural} (${Number(ing.pesoPorPorcao).toFixed(0)}g cada)`;
                      } else {
                        return "Peso (gramas)";
                      }
                    } else if (ing.unidade === 'litro') {
                      return ing.pesoPorPorcao 
                        ? `Nº de porções (${Number(ing.pesoPorPorcao).toFixed(0)}ml cada)` 
                        : "Volume (ml)";
                    }
                    return "Quantidade";
                  })()
                : "Selecione ingrediente"
            }
            type="number"
            step="1"
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEndIngredientes}
          >
            <SortableContext
              items={form.ingredientes.map((_, idx) => idx)}
              strategy={verticalListSortingStrategy}
            >
              <div style={styles.ingList}>
                {form.ingredientes.map((ing, idx) => (
                  <SortableItem key={idx} id={idx}>
                    {({ attributes, listeners }) => (
                      <div style={styles.ingItem}>
                        <div>
                          <span style={styles.dragHandle} {...attributes} {...listeners}>⋮⋮</span>
                          <strong>{ing.nome}</strong> — {ing.descricaoDetalhada} — R$ {ing.custo.toFixed(2)}
                        </div>

                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button
                            style={styles.editIngBtn}
                            onClick={() => editarQuantidadeIngrediente(idx)}
                          >
                            ✏️
                          </button>
                          <button
                            style={styles.removeIngBtn}
                            onClick={() => removerIngrediente(idx)}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    )}
                  </SortableItem>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        <h3 style={{ marginTop: "30px" }}>Resumo do Produto</h3>
        
        <div style={styles.resumoBox}>
          <div style={styles.resumoItem}>
            <strong>Peso Total:</strong> {pesoTotal > 0 ? `${pesoTotal.toFixed(0)}g` : "-"}
          </div>
          
          <div style={styles.resumoItem}>
            <strong>Custo dos Ingredientes:</strong> R$ {form.ingredientes.reduce((sum, ing) => sum + ing.custo, 0).toFixed(2)}
          </div>
          
          <div style={{ ...styles.resumoItem, backgroundColor: "#fff3cd", padding: "10px", borderRadius: "8px", marginTop: "10px" }}>
            <strong>Preço Sugerido (custo × 3):</strong> 
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
          <button style={styles.saveBtn} onClick={salvar}>
            {editandoId ? 'Atualizar Acompanhamento' : 'Salvar Acompanhamento'}
          </button>
          {editandoId && (
            <button style={styles.cancelBtn} onClick={cancelarEdicao}>
              Cancelar
            </button>
          )}
        </div>
      </div>

      <h2 style={styles.subtitle}>Acompanhamentos Cadastrados</h2>

      {acomp.length === 0 && <p>Nenhum acompanhamento cadastrado.</p>}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEndAcompanhamentos}
      >
        <SortableContext
          items={acomp.map(a => a.id)}
          strategy={verticalListSortingStrategy}
        >
          {acomp.map((a, i) => (
            <SortableItem key={a.id} id={a.id}>
              {({ attributes, listeners }) => (
                <div style={styles.itemCard}>
                  <span style={styles.dragHandle} {...attributes} {...listeners}>⋮⋮</span>
                  {a.img && <img src={a.img} style={styles.itemPhoto} alt="" />}

                  <div style={{ flex: 1 }}>
                    <strong>{a.nome}</strong> — R$ {Number(a.preco).toFixed(2)}
                    {a.selo && <span style={styles.seloTag}> • {a.selo === 'maisVendido' ? 'Mais Vendido' : 'Especial da Semana'}</span>}
                    <br />
                    <small>{a.descricao}</small>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    <button style={styles.editBtn} onClick={() => editarAcompanhamento(a)}>
                      ✏️ Editar
                    </button>
                    <button style={styles.duplicateBtn} onClick={() => duplicarAcompanhamento(a)}>
                      📋 Duplicar
                    </button>
                    <button style={styles.deleteBtn} onClick={() => deletarAcompanhamento(a.id)}>
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
    padding: "8px",
    backgroundColor: "#f9f9f9",
    borderRadius: "6px",
  },
  editIngBtn: {
    background: "#1976d2",
    color: "#fff",
    padding: "6px 10px",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
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
