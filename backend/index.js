// backend/index.js

const path = require('path');
const dotenv = require('dotenv');
const express = require("express");
const cors = require("cors");

// Carrega .env local (para dev) antes do Prisma
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Prisma 7: import do client gerado
const { PrismaClient } = require('./generated/prisma/client'); 
const prisma = new PrismaClient(); // <- sem datasources, sem URL

// Inicialização do Express
const app = express();
const PORT = process.env.PORT || 3001;

// CORS
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

// Teste de rota
app.get("/", (req, res) => {
  res.status(200).send("Servidor Pagamentos OK!");
});

// Health check DB
app.get('/health-check-db', async (req, res) => {
    try {
        await prisma.itemCardapio.findFirst();
        res.status(200).json({
            status: "OK",
            message: "Conexão com Neon Postgres estabelecida!"
        });
    } catch (error) {
        console.error("Erro na conexão com o DB:", error.message);
        res.status(500).json({
            status: "ERROR",
            message: "Falha na conexão. Verifique a DATABASE_URL no Render.",
            error_detail: error.message
        });
    }
});

// Rotas de pagamentos
const pagamentosRoutes = require("./routes/pagamentos");
app.use("/api", pagamentosRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
