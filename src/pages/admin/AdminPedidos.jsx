import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import VoltarBtn from "../../components/VoltarBtn";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function AdminPedidos() {
  const navigate = useNavigate();

  // Proteção: se não estiver logado, redireciona
  useEffect(() => {
    const logado = localStorage.getItem("adminLogado");
    if (logado !== "true") {
      navigate("/login");
    }
  }, [navigate]);

  const [pedidos, setPedidos] = useState([]);
  const [filtros, setFiltros] = useState({
    nome: "",
    data: "",
    status: "",
    dataInicio: "",
    dataFim: "",
  });
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);

  // Carregar pedidos
  useEffect(() => {
    carregarPedidos();
  }, []);

  async function carregarPedidos() {
    setCarregando(true);
    setErro("");
    try {
      const response = await fetch(`${API_URL}/api/pedidos`);
      if (!response.ok) throw new Error("Erro ao carregar pedidos");
      const data = await response.json();
      setPedidos(data);
    } catch (err) {
      setErro(`Erro ao carregar pedidos: ${err.message}`);
      console.error(err);
    } finally {
      setCarregando(false);
    }
  }

  // Filtrar pedidos
  function pedidosFiltrados() {
    return pedidos.filter((pedido) => {
      const nomeMatch =
        !filtros.nome ||
        pedido.clienteNome
          ?.toLowerCase()
          .includes(filtros.nome.toLowerCase());

      const dataMatch =
        !filtros.data ||
        new Date(pedido.createdAt).toLocaleDateString("pt-BR") ===
          new Date(filtros.data).toLocaleDateString("pt-BR");

      const statusMatch =
        !filtros.status || pedido.status === filtros.status;

      const dataInicio = filtros.dataInicio
        ? new Date(filtros.dataInicio)
        : null;
      const dataFim = filtros.dataFim ? new Date(filtros.dataFim) : null;
      const dataPedido = new Date(pedido.createdAt);

      const rangeMatch =
        (!dataInicio || dataPedido >= dataInicio) &&
        (!dataFim || dataPedido <= dataFim);

      return nomeMatch && statusMatch && rangeMatch;
    });
  }

  // Atualizar status do pedido
  async function atualizarStatus(pedidoId, novoStatus) {
    try {
      const response = await fetch(`${API_URL}/api/pedidos/${pedidoId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus }),
      });

      if (!response.ok) throw new Error("Erro ao atualizar status");
      const pedidoAtualizado = await response.json();

      // Atualizar na lista
      setPedidos(
        pedidos.map((p) => (p.id === pedidoId ? pedidoAtualizado : p))
      );

      // Se estava selecionado, atualizar também
      if (pedidoSelecionado?.id === pedidoId) {
        setPedidoSelecionado(pedidoAtualizado);
      }

      alert("Status atualizado com sucesso!");
    } catch (err) {
      alert(`Erro ao atualizar: ${err.message}`);
    }
  }

  const filtrados = pedidosFiltrados();
  const statusOptions = ["PENDENTE", "PREPARANDO", "PRONTO", "ENTREGUE", "CANCELADO"];

  return (
    <div style={{ ...styles.container, position: "relative" }}>
      <VoltarBtn />
      <h1 style={styles.title}>Gerenciar Pedidos</h1>

      {/* Filtros */}
      <div style={styles.filtrosContainer}>
        <h2 style={styles.subtitle}>Filtros</h2>

        <div style={styles.filtroGrid}>
          <input
            type="text"
            placeholder="Buscar por nome do cliente"
            value={filtros.nome}
            onChange={(e) => setFiltros({ ...filtros, nome: e.target.value })}
            style={styles.input}
          />

          <select
            value={filtros.status}
            onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
            style={styles.input}
          >
            <option value="">Todos os status</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={filtros.dataInicio}
            onChange={(e) =>
              setFiltros({ ...filtros, dataInicio: e.target.value })
            }
            style={styles.input}
            placeholder="Data início"
          />

          <input
            type="date"
            value={filtros.dataFim}
            onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
            style={styles.input}
            placeholder="Data fim"
          />

          <button style={styles.btnFiltro} onClick={carregarPedidos}>
            🔄 Recarregar
          </button>

          <button
            style={{ ...styles.btnFiltro, backgroundColor: "#999" }}
            onClick={() =>
              setFiltros({
                nome: "",
                data: "",
                status: "",
                dataInicio: "",
                dataFim: "",
              })
            }
          >
            ✕ Limpar Filtros
          </button>
        </div>
      </div>

      {erro && <p style={styles.erro}>{erro}</p>}
      {carregando && <p style={styles.info}>Carregando pedidos...</p>}

      {/* Resumo */}
      <div style={styles.resumo}>
        <p style={styles.resumoItem}>
          <strong>Total de Pedidos:</strong> {filtrados.length}
        </p>
        <p style={styles.resumoItem}>
          <strong>Total em Vendas:</strong> R${" "}
          {filtrados
            .reduce((sum, p) => sum + parseFloat(p.total), 0)
            .toFixed(2)}
        </p>
      </div>

      {/* Tabela de Pedidos */}
      {filtrados.length === 0 ? (
        <p style={styles.info}>Nenhum pedido encontrado.</p>
      ) : (
        <div style={styles.tabelaContainer}>
          <table style={styles.tabela}>
            <thead>
              <tr style={styles.tabelaHeader}>
                <th>ID</th>
                <th>Cliente</th>
                <th>Data</th>
                <th>Status</th>
                <th>Total</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((pedido) => (
                <tr key={pedido.id} style={styles.tabelaRow}>
                  <td style={styles.tabelaCell}>
                    {pedido.id.substring(0, 8)}...
                  </td>
                  <td style={styles.tabelaCell}>{pedido.clienteNome || "N/A"}</td>
                  <td style={styles.tabelaCell}>
                    {new Date(pedido.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td style={styles.tabelaCell}>
                    <span
                      style={{
                        ...styles.badge,
                        backgroundColor: getStatusColor(pedido.status),
                      }}
                    >
                      {pedido.status}
                    </span>
                  </td>
                  <td style={styles.tabelaCell}>
                    R$ {parseFloat(pedido.total).toFixed(2)}
                  </td>
                  <td style={styles.tabelaCell}>
                    <button
                      onClick={() => setPedidoSelecionado(pedido)}
                      style={styles.btnVer}
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal detalhes */}
      {pedidoSelecionado && (
        <div style={styles.modalOverlay} onClick={() => setPedidoSelecionado(null)}>
          <div
            style={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              style={styles.btnFechar}
              onClick={() => setPedidoSelecionado(null)}
            >
              ✕
            </button>

            <h2 style={styles.modalTitle}>Detalhes do Pedido</h2>

            <div style={styles.detalhesSection}>
              <div style={styles.detalheItem}>
                <strong>ID:</strong> {pedidoSelecionado.id}
              </div>
              <div style={styles.detalheItem}>
                <strong>Cliente:</strong>{" "}
                {pedidoSelecionado.clienteNome || "N/A"}
              </div>
              <div style={styles.detalheItem}>
                <strong>Telefone:</strong>{" "}
                {pedidoSelecionado.clienteTelefone || "N/A"}
              </div>
              <div style={styles.detalheItem}>
                <strong>Data do Pedido:</strong>{" "}
                {new Date(pedidoSelecionado.createdAt).toLocaleDateString(
                  "pt-BR",
                  {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )}
              </div>
            </div>

            <h3 style={styles.subtitle}>Itens do Pedido</h3>
            <div style={styles.itensContainer}>
              {pedidoSelecionado.itens.map((item, idx) => (
                <div key={idx} style={styles.itemPedido}>
                  <span>
                    <strong>{item.item.nome}</strong> x{item.quantidade}
                  </span>
                  <span>R$ {parseFloat(item.precoUnit).toFixed(2)}</span>
                  <span style={styles.subtotal}>
                    Subtotal: R$ {(parseFloat(item.precoUnit) * item.quantidade).toFixed(2)}
                  </span>
                  {item.observacao && (
                    <span style={styles.observacao}>
                      Observação: {item.observacao}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div style={styles.totalSection}>
              <p style={styles.totalText}>
                <strong>Total:</strong> R$ {parseFloat(pedidoSelecionado.total).toFixed(2)}
              </p>
            </div>

            <h3 style={styles.subtitle}>Atualizar Status</h3>
            <div style={styles.statusContainer}>
              <select
                value={pedidoSelecionado.status}
                onChange={(e) =>
                  atualizarStatus(pedidoSelecionado.id, e.target.value)
                }
                style={styles.selectStatus}
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getStatusColor(status) {
  const colors = {
    PENDENTE: "#ff9800",
    PREPARANDO: "#2196f3",
    PRONTO: "#8bc34a",
    ENTREGUE: "#4caf50",
    CANCELADO: "#f44336",
  };
  return colors[status] || "#999";
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
    marginBottom: "20px",
  },
  subtitle: {
    fontSize: "18px",
    fontWeight: "bold",
    marginTop: "15px",
    marginBottom: "10px",
  },
  filtrosContainer: {
    background: "#fff",
    padding: "20px",
    borderRadius: "12px",
    border: "2px solid #000",
    marginBottom: "20px",
  },
  filtroGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "10px",
    marginTop: "10px",
  },
  input: {
    padding: "10px",
    borderRadius: "8px",
    border: "2px solid #000",
    fontSize: "14px",
  },
  btnFiltro: {
    backgroundColor: "#000",
    color: "#F1B100",
    padding: "10px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
  },
  resumo: {
    background: "#fff",
    padding: "15px",
    borderRadius: "10px",
    border: "2px solid #000",
    marginBottom: "20px",
    display: "flex",
    gap: "20px",
    flexWrap: "wrap",
  },
  resumoItem: {
    margin: 0,
    fontSize: "16px",
  },
  tabelaContainer: {
    background: "#fff",
    padding: "15px",
    borderRadius: "10px",
    border: "2px solid #000",
    marginBottom: "20px",
    overflowX: "auto",
  },
  tabela: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  },
  tabelaHeader: {
    background: "#000",
    color: "#F1B100",
    fontWeight: "bold",
  },
  tabelaRow: {
    borderBottom: "1px solid #ddd",
  },
  tabelaCell: {
    padding: "12px",
    textAlign: "left",
  },
  badge: {
    padding: "5px 10px",
    borderRadius: "6px",
    color: "#fff",
    fontWeight: "bold",
    fontSize: "12px",
  },
  btnVer: {
    background: "#2196f3",
    color: "#fff",
    padding: "6px 12px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    background: "#fff",
    padding: "30px",
    borderRadius: "15px",
    border: "3px solid #000",
    maxWidth: "600px",
    maxHeight: "90vh",
    overflowY: "auto",
    position: "relative",
  },
  btnFechar: {
    position: "absolute",
    top: "10px",
    right: "10px",
    background: "#f44336",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  modalTitle: {
    fontSize: "24px",
    fontWeight: "bold",
    marginBottom: "15px",
  },
  detalhesSection: {
    background: "#f5f5f5",
    padding: "15px",
    borderRadius: "8px",
    marginBottom: "15px",
  },
  detalheItem: {
    marginBottom: "8px",
    fontSize: "14px",
  },
  itensContainer: {
    background: "#f9f9f9",
    padding: "10px",
    borderRadius: "8px",
    marginBottom: "15px",
  },
  itemPedido: {
    display: "flex",
    flexDirection: "column",
    padding: "10px",
    borderBottom: "1px solid #ddd",
    fontSize: "14px",
  },
  subtotal: {
    fontSize: "12px",
    color: "#666",
    marginTop: "5px",
  },
  observacao: {
    fontSize: "12px",
    color: "#ff9800",
    marginTop: "3px",
    fontStyle: "italic",
  },
  totalSection: {
    background: "#fff",
    padding: "15px",
    border: "2px solid #000",
    borderRadius: "8px",
    marginBottom: "15px",
    textAlign: "center",
  },
  totalText: {
    fontSize: "18px",
    margin: 0,
  },
  statusContainer: {
    display: "flex",
    gap: "10px",
    marginBottom: "10px",
  },
  selectStatus: {
    flex: 1,
    padding: "10px",
    borderRadius: "8px",
    border: "2px solid #000",
    fontSize: "14px",
    cursor: "pointer",
  },
  erro: {
    color: "#f44336",
    background: "#ffebee",
    padding: "10px",
    borderRadius: "8px",
    marginBottom: "10px",
  },
  info: {
    textAlign: "center",
    fontSize: "16px",
    color: "#666",
    padding: "20px",
  },
};
