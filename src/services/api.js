import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Exemplo de uso: api.get('/api/categorias')
// Você pode adicionar interceptors para tratar erros globais, autenticação, etc.

export default api;
