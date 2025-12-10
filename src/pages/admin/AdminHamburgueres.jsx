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
        const hamburguesCategoria = categorias.find((c) => c.nome === "Hambúrgueres");
        if (hamburguesCategoria) {
          setCategoriaId(hamburguesCategoria.id);
        }

        // Carregar hambúrgueres
        const response = await fetch(`${API_URL}/api/itens?categoria=Hambúrgueres`);
        if (response.ok) {
          const data = await response.json();
          console.log("📦 Hambúrgueres carregados:", data);
          setHamburgueres(data);
        }

        // Carregar ingredientes disponíveis
        const ingResponse = await fetch(`${API_URL}/api/ingredientes`);
        if (ingResponse.ok) {
          const ingredientes = await ingResponse.json();
          console.log("🥬 Ingredientes disponíveis:", ingredientes);
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
    let pesoGramas = 0; // peso em gramas para somar no total

    // Lógica de cálculo baseada no tipo de unidade
    if (ingredienteSelecionado.unidade === "unidade") {
      // Ingrediente por unidade (ex: pão, sachê)
      custo = quantidade * parseFloat(ingredienteSelecionado.precoPorUnidade);
      unidadeExibida = quantidade === 1 ? "un" : "uns";
      descricaoDetalhada = `${quantidadeExibida} ${unidadeExibida}`;
      
      // Se tem peso médio por unidade, calcular peso total
      if (ingredienteSelecionado.pesoMedioPorUnidade) {
        pesoGramas = quantidade * parseFloat(ingredienteSelecionado.pesoMedioPorUnidade);
        descricaoDetalhada = `${quantidadeExibida} ${unidadeExibida} (${pesoGramas.toFixed(0)}g)`;
      }
    } else if (ingredienteSelecionado.unidade === "kg") {
      // Ingrediente por peso
      if (ingredienteSelecionado.pesoPorPorcao) {
        // Tem porção definida - usuario informa quantas porções/fatias quer
        const pesoTotal = quantidade * parseFloat(ingredienteSelecionado.pesoPorPorcao);
        const pesoEmKg = pesoTotal / 1000;
        custo = pesoEmKg * parseFloat(ingredienteSelecionado.precoPorUnidade);
        
        // Usar o tipoPorcao definido no ingrediente
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
        // Sem porção definida - usuario informa gramas direto
        const quantidadeEmKg = quantidade / 1000;
        custo = quantidadeEmKg * parseFloat(ingredienteSelecionado.precoPorUnidade);
        unidadeExibida = "g";
        descricaoDetalhada = `${quantidadeExibida}g`;
        pesoGramas = quantidade;
      }
    } else if (ingredienteSelecionado.unidade === "litro") {
      // Ingrediente líquido
      if (ingredienteSelecionado.pesoPorPorcao) {
        // Tem porção definida - usuario informa quantas porções quer (ex: 1 dose)
        const volumeTotal = quantidade * parseFloat(ingredienteSelecionado.pesoPorPorcao);
        const volumeEmLitros = volumeTotal / 1000;
        custo = volumeEmLitros * parseFloat(ingredienteSelecionado.precoPorUnidade);
        unidadeExibida = quantidade === 1 ? "porção" : "porções";
        descricaoDetalhada = `${quantidadeExibida} ${unidadeExibida} (${volumeTotal.toFixed(0)}ml)`;
        pesoGramas = volumeTotal; // ml como peso para soma
      } else {
        // Sem porção definida - usuario informa ml direto
        const quantidadeEmLitros = quantidade / 1000;
        custo = quantidadeEmLitros * parseFloat(ingredienteSelecionado.precoPorUnidade);
        unidadeExibida = "ml";
        descricaoDetalhada = `${quantidadeExibida}ml`;
        pesoGramas = quantidade; // ml como peso
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
    console.log("🔍 Editando hambúrguer:", hamburguer);
    console.log("🔍 Ingredientes do hambúrguer:", hamburguer.ingredientes);
    console.log("🔍 Ingredientes disponíveis:", ingredientesDisponiveis);
    
    setEditandoId(hamburguer.id);
    
    // Converter ingredientes salvos para formato do form
    const ingredientesConvertidos = hamburguer.ingredientes?.map(itemIng => {
      const ing = ingredientesDisponiveis.find(i => i.id === itemIng.ingredienteId);
      console.log("🔍 Processando ingrediente:", itemIng, "Encontrado:", ing);
      
      if (!ing) return null;
      
      const quantidade = parseFloat(itemIng.quantidade);
      let descricaoDetalhada = "";
      let pesoGramas = 0;
      let unidadeExibida = "";
      
      // Recalcular descrição baseado no ingrediente
      if (ing.unidade === "unidade") {
        unidadeExibida = quantidade === 1 ? "un" : "uns";
        if (ing.pesoMedioPorUnidade) {
          pesoGramas = quantidade * parseFloat(ing.pesoMedioPorUnidade);
          descricaoDetalhada = `${quantidade} ${unidadeExibida} (${pesoGramas.toFixed(0)}g)`;
        } else {
          descricaoDetalhada = `${quantidade} ${unidadeExibida}`;
        }
      } else if (ing.unidade === "kg") {
        if (ing.pesoPorPorcao) {
          // Com porção definida
          const pesoTotal = quantidade * parseFloat(ing.pesoPorPorcao);
          pesoGramas = pesoTotal;
          
          // Usar o tipoPorcao definido no ingrediente
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
          // Sem porção - gramas diretas
          pesoGramas = quantidade;
          unidadeExibida = "g";
          descricaoDetalhada = `${quantidade}g`;
        }
      } else if (ing.unidade === "litro") {
        if (ing.pesoPorPorcao) {
          // Com porção definida
          const volumeTotal = quantidade * parseFloat(ing.pesoPorPorcao);
          pesoGramas = volumeTotal;
          unidadeExibida = quantidade === 1 ? "porção" : "porções";
          descricaoDetalhada = `${quantidade} ${unidadeExibida} (${volumeTotal.toFixed(0)}ml)`;
        } else {
          // Sem porção - ml diretos
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
      nome: hamburguer.nome,
      descricao: hamburguer.descricao || "",
      descricaoES: hamburguer.descricaoES || "",
      descricaoEN: hamburguer.descricaoEN || "",
      foto: hamburguer.img || "",
      selo: hamburguer.selo || "",
      ingredientes: ingredientesConvertidos,
    });
    setPrecoFinal(String(hamburguer.preco));
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

  async function duplicarHamburguer(hamburguer) {
    if (!confirm(`Duplicar "${hamburguer.nome}"?`)) return;
    
    try {
      // Preparar dados do hambúrguer duplicado
      const ingredientesParaSalvar = hamburguer.ingredientes?.map(itemIng => ({
        ingredienteId: itemIng.ingredienteId,
        quantidade: itemIng.quantidade,
        custo: itemIng.custo
      })) || [];

      const dadosDuplicados = {
        nome: `${hamburguer.nome} - Cópia`,
        descricao: hamburguer.descricao || "",
        descricaoES: hamburguer.descricaoES || "",
        descricaoEN: hamburguer.descricaoEN || "",
        preco: hamburguer.preco,
        img: hamburguer.img || "",
        selo: hamburguer.selo || "",
        categoriaId: categoriaId,
        ingredientes: ingredientesParaSalvar
      };

      console.log("📋 Duplicando hambúrguer:", dadosDuplicados);

      const response = await fetch(`${API_URL}/api/itens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosDuplicados),
      });

      if (response.ok) {
        alert('Hambúrguer duplicado com sucesso!');
        
        // Recarregar lista
        const recarregar = await fetch(`${API_URL}/api/itens?categoria=Hambúrgueres`);
        if (recarregar.ok) {
          const data = await recarregar.json();
          setHamburgueres(data);
        }
      } else {
        const errorText = await response.text();
        console.error('Erro ao duplicar:', errorText);
        alert('Erro ao duplicar hambúrguer');
      }
    } catch (error) {
      console.error('Erro ao duplicar:', error);
      alert('Erro ao conectar com o servidor');
    }
  }

  function salvarHamburguer() {
    if (!form.nome || !form.descricao || !precoFinal) {
      alert("Preencha nome, descrição e preço final");
      return;
    }

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

        console.log("Response status:", response.status);
        const responseText = await response.text();
        console.log("Response body:", responseText);

        if (response.ok) {
          const mensagem = editandoId ? "Hambúrguer atualizado com sucesso!" : "Hambúrguer cadastrado com sucesso!";
          alert(mensagem);
          
          // Recarregar a lista
          const recarregar = await fetch(`${API_URL}/api/itens?categoria=Hambúrgueres`);
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
            foto: "",
            selo: "",
            ingredientes: [],
          });
          setPrecoFinal("");
          setPesoTotal(0);
          setPrecoSugerido(0);
          setNovoIngrediente({ ingredienteId: "", quantidade: "" });
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
              // Definir o tipo de porcionamento
              let tipoLabel = '';
              if (ing.unidade === 'unidade') {
                tipoLabel = ing.pesoMedioPorUnidade ? ` - ${Number(ing.pesoMedioPorUnidade).toFixed(0)}g/un` : '';
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
                      return ing.pesoMedioPorUnidade 
                        ? `Quantidade (${Number(ing.pesoMedioPorUnidade).toFixed(0)}g cada)` 
                        : "Quantidade";
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
          <div style={styles.ingList}>
            {form.ingredientes.map((ing, idx) => (
              <div key={idx} style={styles.ingItem}>
                <div>
                  <strong>{ing.nome}</strong> — {ing.descricaoDetalhada} — R$ {ing.custo.toFixed(2)}
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
            <button style={styles.duplicateBtn} onClick={() => duplicarHamburguer(h)}>
              📋 Duplicar
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
    padding: "8px",
    backgroundColor: "#f9f9f9",
    borderRadius: "6px",
  },
  removeIngBtn: {
    background: "#c62828",
    color: "#fff",
    padding: "6px 10px",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
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
};
