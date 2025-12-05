// backend/index.js

// ATENÇÃO: Desativar esta linha em produção se o ambiente permitir validação de certificado!
// Mantido aqui conforme o código original, mas use com cautela.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const path = require('path');
const dotenv = require('dotenv');
const express = require("express");
const cors = require("cors");

// -----------------------
// Carrega o arquivo .env padrão (que agora contém as credenciais de PRODUÇÃO)
dotenv.config({ path: path.resolve(__dirname, '.env') });

console.log(`🚀 Servidor configurado para Produção`);
console.log(`API URL PagBank: ${process.env.PAGBANK_API_URL}`);

// -----------------------
// Inicialização do Express
const app = express();
const PORT = process.env.PORT || 3001;

// CORS
app.use(cors({
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
}));

// Middlewares de parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route
app.get("/", (req, res) => {
  res.status(200).send("Servidor Pagamentos OK!");
});

// Rotas de pagamentos
const pagamentosRoutes = require("./routes/pagamentos");
app.use("/api", pagamentosRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});