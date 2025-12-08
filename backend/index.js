const path = require("path");
const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");

// Carrega .env local somente em desenvolvimento
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: path.resolve(__dirname, ".env") });
}

// Prisma Client (usando o client gerado em ./generated/prisma)
const { PrismaClient } = require("./generated/prisma");

// 💡 CORREÇÃO PRISMA v7:
// Passamos a URL de conexão do banco de dados (lida do .env) diretamente para o construtor.
const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

// Inicialização do Express
const app = express();
const PORT = process.env.PORT || 3001;

// CORS
app.use(
  cors({
    origin: [
      "https://metanoia-app.vercel.app",
      "http://localhost:5173",
      process.env.FRONTEND_URL || "http://localhost:5173",
    ],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  })
);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Teste de rota
app.get("/", (req, res) => {
  res.status(200).send("Servidor Metanoia OK!");
});

// Health check DB
app.get("/health-check-db", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: "OK",
      message: "Conexão com Supabase Postgres estabelecida!",
    });
  } catch (error) {
    console.error("Erro na conexão com o DB:", error.message);
    res.status(500).json({
      status: "ERROR",
      message: "Falha na conexão. Verifique a DATABASE_URL.",
      error_detail: error.message,
    });
  }
});

// Rotas de categorias
app.post("/api/categorias", async (req, res) => {
  const { nome } = req.body;
  try {
    const cat = await prisma.categoria.create({ data: { nome } });
    res.json(cat);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get("/api/categorias", async (req, res) => {
  const cats = await prisma.categoria.findMany();
  res.json(cats);
});

// Rotas de itens
app.post("/api/itens", async (req, res) => {
  const { nome, descricao, preco, peso, img, categoriaId } = req.body;
  try {
    // 💡 Ajuste: Usa parseFloat para garantir que o 'preco' seja um número 
    // com ponto flutuante antes de ser enviado ao Decimal do Prisma.
    const item = await prisma.itemCardapio.create({
      data: { 
        nome, 
        descricao, 
        preco: parseFloat(preco), 
        peso, 
        img, 
        categoriaId 
      },
    });
    res.json(item);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get("/api/itens", async (req, res) => {
  const itens = await prisma.itemCardapio.findMany({
    include: { categoria: true },
  });
  res.json(itens);
});

// Rotas de pedidos
app.post("/api/pedidos", async (req, res) => {
  const { clienteNome, clienteTelefone, itens } = req.body;
  try {
    // 💡 Ajuste: Usa parseFloat no reduce para mitigar problemas de precisão.
    const total = itens.reduce(
      (sum, it) => sum + parseFloat(it.precoUnit) * it.quantidade,
      0
    );

    const pedido = await prisma.pedido.create({
      data: {
        clienteNome,
        clienteTelefone,
        status: "PENDENTE",
        total,
        itens: {
          create: itens.map((it) => ({
            itemId: it.itemId,
            quantidade: it.quantidade,
            // 💡 Ajuste: Garante que o precoUnit é um float.
            precoUnit: parseFloat(it.precoUnit), 
            observacao: it.observacao ?? null,
          })),
        },
      },
      include: { itens: { include: { item: true } } },
    });
    res.json(pedido);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get("/api/pedidos", async (req, res) => {
  const pedidos = await prisma.pedido.findMany({
    orderBy: { createdAt: "desc" },
    include: { itens: { include: { item: true } } },
  });
  res.json(pedidos);
});

app.patch("/api/pedidos/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const upd = await prisma.pedido.update({
      where: { id },
      data: { status },
    });
    res.json(upd);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Rotas de pagamentos (já existentes)
const pagamentosRoutes = require("./routes/pagamentos");
app.use("/api", pagamentosRoutes);

// Rotas de transações PagBank
app.get("/api/transacoes", async (req, res) => {
  try {
    const transacoes = await prisma.transacaoPagamento.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(transacoes);
  } catch (e) {
    console.error("Erro ao listar transações:", e.message);
    res.status(500).json({ error: "Falha ao buscar transações." });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});