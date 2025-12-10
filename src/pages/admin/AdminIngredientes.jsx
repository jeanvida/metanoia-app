import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import VoltarBtn from "../../components/VoltarBtn";

const API_URL = import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname === 'localhost' 
    ? "http://localhost:3001" 
    : "https://metanoia-app.onrender.com");

export default function AdminIngredientes() {
  const navigate = useNavigate();

  useEffect(() => {
    const logado = localStorage.getItem("adminLogado");
    if (logado !== "true") {
      navigate("/login");
    }
  }, [navigate]);

  const [ingredientes, setIngredientes] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState({
    nome: "",
    unidade: "kg", // kg, litro, unidade
    precoPorUnidade: "", // preço por kg, litro ou unidade
    quantidadePorEmbalagem: "", // quantos kg/litros vem na embalagem
    precoEmbalagem: "", // preço da embalagem completa
  });

  useEffect(() => {
    carregarIngredientes();
  }, []);

  async function carregarIngredientes() {
    try {
      const response = await fetch(`${API_URL}/api/ingredientes`);
      if (response.ok) {
        const data = await response.json();
        setIngredientes(data);
      }
    } catch (error) {
      console.error("Erro ao carregar ingredientes:", error);
    }
  }

  function calcularPrecoPorUnidade() {
    if (form.precoEmbalagem && form.quantidadePorEmbalagem) {
      const preco = parseFloat(form.precoEmbalagem) / parseFloat(form.quantidadePorEmbalagem);
      setForm(prev => ({ ...prev, precoPorUnidade: preco.toFixed(4) }));
    }
  }

  function editarIngrediente(ingrediente) {
    setEditandoId(ingrediente.id);
    setForm({
      nome: ingrediente.nome,
      unidade: ingrediente.unidade,
      precoPorUnidade: String(ingrediente.precoPorUnidade),
      quantidadePorEmbalagem: String(ingrediente.quantidadePorEmbalagem || ""),
      precoEmbalagem: String(ingrediente.precoEmbalagem || ""),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setForm({
      nome: "",
      unidade: "kg",
      precoPorUnidade: "",
      quantidadePorEmbalagem: "",
      precoEmbalagem: "",
    });
  }

  async function deletarIngrediente(id) {
    if (!confirm('Tem certeza que deseja deletar este ingrediente?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/ingredientes/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Ingrediente deletado com sucesso!');
        setIngredientes(prev => prev.filter(i => i.id !== id));
      } else {
        alert('Erro ao deletar ingrediente');
      }
    } catch (error) {
      console.error('Erro ao deletar:', error);
      alert('Erro ao conectar com o servidor');
    }
  }

  async function salvar() {
    if (!form.nome || !form.precoPorUnidade) {
      alert("Preencha nome e preço por unidade");
      return;
    }

    try {
      const url = editandoId ? `${API_URL}/api/ingredientes/${editandoId}` : `${API_URL}/api/ingredientes`;
      const method = editandoId ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.nome,
          unidade: form.unidade,
          precoPorUnidade: parseFloat(form.precoPorUnidade),
          quantidadePorEmbalagem: form.quantidadePorEmbalagem ? parseFloat(form.quantidadePorEmbalagem) : null,
          precoEmbalagem: form.precoEmbalagem ? parseFloat(form.precoEmbalagem) : null,
        }),
      });

      if (response.ok) {
        const mensagem = editandoId ? "Ingrediente atualizado com sucesso!" : "Ingrediente cadastrado com sucesso!";
        alert(mensagem);
        
        await carregarIngredientes();
        
        setEditandoId(null);
        setForm({
          nome: "",
          unidade: "kg",
          precoPorUnidade: "",
          quantidadePorEmbalagem: "",
          precoEmbalagem: "",
        });
      } else {
        const errorData = await response.json();
        alert(`Erro ao salvar: ${errorData.error || "Tente novamente"}`);
      }
    } catch (error) {
      console.error("Erro:", error);
      alert(`Erro ao conectar com o servidor: ${error.message}`);
    }
  }

  function getUnidadeLabel(unidade) {
    const labels = {
      kg: "kg",
      litro: "L",
      unidade: "un"
    };
    return labels[unidade] || unidade;
  }

  return (
    <div style={styles.container}>
      <VoltarBtn />
      <h1 style={styles.title}>Gerenciar Ingredientes</h1>

      <div style={styles.card}>
        <h2 style={styles.subtitle}>
          {editandoId ? "Editar Ingrediente" : "Adicionar Ingrediente"}
        </h2>

        <input
          style={styles.input}
          placeholder="Nome do Ingrediente"
          value={form.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
        />

        <div style={{ marginTop: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            Unidade de Medida
          </label>
          <select
            style={styles.input}
            value={form.unidade}
            onChange={(e) => setForm({ ...form, unidade: e.target.value })}
          >
            <option value="kg">Quilograma (kg)</option>
            <option value="litro">Litro (L)</option>
            <option value="unidade">Unidade</option>
          </select>
        </div>

        <h3 style={{ marginTop: "20px", marginBottom: "10px" }}>
          Calcular Preço por {getUnidadeLabel(form.unidade)}
        </h3>

        <div style={styles.row}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>
              Quantidade por Embalagem ({getUnidadeLabel(form.unidade)})
            </label>
            <input
              style={styles.input}
              placeholder={`Ex: 5 ${getUnidadeLabel(form.unidade)}`}
              type="number"
              step="0.001"
              value={form.quantidadePorEmbalagem}
              onChange={(e) => setForm({ ...form, quantidadePorEmbalagem: e.target.value })}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>
              Preço da Embalagem (R$)
            </label>
            <input
              style={styles.input}
              placeholder="Ex: 50.00"
              type="number"
              step="0.01"
              value={form.precoEmbalagem}
              onChange={(e) => setForm({ ...form, precoEmbalagem: e.target.value })}
            />
          </div>

          <button
            style={styles.calcBtn}
            onClick={calcularPrecoPorUnidade}
            type="button"
          >
            Calcular
          </button>
        </div>

        <div style={{ marginTop: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            Preço por {getUnidadeLabel(form.unidade)} (R$)
          </label>
          <input
            style={styles.input}
            placeholder="Digite ou calcule acima"
            type="number"
            step="0.0001"
            value={form.precoPorUnidade}
            onChange={(e) => setForm({ ...form, precoPorUnidade: e.target.value })}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button style={styles.saveBtn} onClick={salvar}>
            {editandoId ? 'Atualizar Ingrediente' : 'Salvar Ingrediente'}
          </button>
          {editandoId && (
            <button style={styles.cancelBtn} onClick={cancelarEdicao}>
              Cancelar
            </button>
          )}
        </div>
      </div>

      <h2 style={styles.subtitle}>Ingredientes Cadastrados</h2>

      {ingredientes.length === 0 && <p>Nenhum ingrediente cadastrado.</p>}

      {ingredientes.map((ing) => (
        <div key={ing.id} style={styles.itemCard}>
          <div style={{ flex: 1 }}>
            <strong>{ing.nome}</strong>
            <br />
            <small>
              Unidade: {getUnidadeLabel(ing.unidade)} | 
              Preço: R$ {Number(ing.precoPorUnidade).toFixed(4)}/{getUnidadeLabel(ing.unidade)}
              {ing.quantidadePorEmbalagem && (
                <> | Embalagem: {ing.quantidadePorEmbalagem} {getUnidadeLabel(ing.unidade)} = R$ {Number(ing.precoEmbalagem).toFixed(2)}</>
              )}
            </small>
          </div>
          
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <button style={styles.editBtn} onClick={() => editarIngrediente(ing)}>
              ✏️ Editar
            </button>
            <button style={styles.deleteBtn} onClick={() => deletarIngrediente(ing.id)}>
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
    marginTop: 20,
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
  row: {
    display: "flex",
    gap: 10,
    marginTop: 10,
    alignItems: "flex-end",
  },
  calcBtn: {
    background: "#F1B100",
    color: "#000",
    padding: "10px 16px",
    borderRadius: 8,
    border: "2px solid #000",
    cursor: "pointer",
    fontWeight: "bold",
    height: "42px",
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
};
