import { useState, useEffect } from 'react';
import './NotificacoesPedidos.css';

export default function NotificacoesPedidos() {
  const [pedidosRecentes, setPedidosRecentes] = useState([]);
  const [naoLidos, setNaoLidos] = useState(0);
  const [mostrarNotificacoes, setMostrarNotificacoes] = useState(false);
  const [ultimaVerificacao, setUltimaVerificacao] = useState(Date.now());

  // Buscar pedidos recentes a cada 30 segundos
  useEffect(() => {
    buscarPedidosRecentes();
    const interval = setInterval(buscarPedidosRecentes, 30000);
    return () => clearInterval(interval);
  }, []);

  const buscarPedidosRecentes = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/pedidos/recentes?minutos=60`);
      if (response.ok) {
        const pedidos = await response.json();
        
        // Verificar se há novos pedidos
        const pedidosNovos = pedidos.filter(
          p => new Date(p.createdAt).getTime() > ultimaVerificacao
        );
        
        if (pedidosNovos.length > 0) {
          // Mostrar notificação do navegador
          if (Notification.permission === 'granted') {
            new Notification('Novo Pedido!', {
              body: `${pedidosNovos.length} novo(s) pedido(s) recebido(s)`,
              icon: '/logo.png',
              tag: 'novo-pedido'
            });
          }
          
          // Tocar som (opcional)
          const audio = new Audio('/notification.mp3');
          audio.play().catch(() => {}); // Ignora se não houver arquivo de som
        }
        
        setPedidosRecentes(pedidos);
        setNaoLidos(pedidos.length);
      }
    } catch (error) {
      console.error('Erro ao buscar pedidos recentes:', error);
    }
  };

  const marcarComoLido = () => {
    setNaoLidos(0);
    setUltimaVerificacao(Date.now());
    setMostrarNotificacoes(false);
  };

  // Solicitar permissão para notificações
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="notificacoes-container">
      <button 
        className="notificacoes-btn"
        onClick={() => setMostrarNotificacoes(!mostrarNotificacoes)}
      >
        <span className="notificacao-icon">🔔</span>
        {naoLidos > 0 && (
          <span className="notificacao-badge">{naoLidos}</span>
        )}
      </button>

      {mostrarNotificacoes && (
        <div className="notificacoes-dropdown">
          <div className="notificacoes-header">
            <h3>Pedidos Recentes</h3>
            {naoLidos > 0 && (
              <button onClick={marcarComoLido} className="marcar-lido-btn">
                Marcar como lido
              </button>
            )}
          </div>
          
          <div className="notificacoes-lista">
            {pedidosRecentes.length === 0 ? (
              <p className="sem-notificacoes">Nenhum pedido recente</p>
            ) : (
              pedidosRecentes.map(pedido => (
                <div key={pedido.id} className="notificacao-item">
                  <div className="notificacao-info">
                    <strong>{pedido.clienteNome}</strong>
                    <span className={`status-badge status-${pedido.status}`}>
                      {pedido.status}
                    </span>
                  </div>
                  <div className="notificacao-detalhes">
                    <span className="valor">R$ {pedido.valorTotal.toFixed(2)}</span>
                    <span className="hora">
                      {new Date(pedido.createdAt).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
