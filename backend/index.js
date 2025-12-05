// backend/index.js

const path = require('path');
const dotenv = require('dotenv');
const express = require("express");
const cors = require("cors");

// -----------------------
// Carrega o arquivo .env (produção)
dotenv.config({ path: path.resolve(__dirname, '.env') });

console.log(`🚀 Servidor inicializado`);
console.log(`API URL PagBank: ${process.env.PAGBANK_API_URL}`);

// -----------------------
// Inicialização do Express
const app = express();
const PORT = process.env.PORT || 3001;

// CORS configurado para produção
app.use(cors({
  origin: [
    "https://metanoia-app.vercel.app",
    "http://localhost:5173"
  ],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE"
}));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route
app.get("/", (req, res) => {
  res.status(200).send("Servidor Pagamentos OK!");
});

// Rotas de pagamentos
const pagamentosRoutes = require("./routes/pagamentos");
app.use("/api", pagamentosRoutes);

// Start
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
