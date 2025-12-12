const path = require("path");
const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");

// Carrega .env local somente em desenvolvimento
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: path.resolve(__dirname, ".env") });
}

// Debug: log para verificar se DATABASE_URL está sendo carregada
console.log("🔍 NODE_ENV:", process.env.NODE_ENV);
console.log("🔍 DATABASE_URL presente:", !!process.env.DATABASE_URL);
if (process.env.DATABASE_URL) {
  const masked = process.env.DATABASE_URL.replace(/:[^@]*@/, ":***@");
  console.log("🔍 DATABASE_URL:", masked);
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
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

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

// Inicializar categorias padrão
app.post("/api/init-categorias", async (req, res) => {
  try {
    const categoriasPadrao = ["Hambúrgueres", "Combos", "Acompanhamentos", "Bebidas"];
    const criadas = [];
    
    for (const nome of categoriasPadrao) {
      try {
        const existe = await prisma.categoria.findUnique({ where: { nome } });
        if (!existe) {
          const cat = await prisma.categoria.create({ data: { nome } });
          criadas.push(cat);
        }
      } catch (catError) {
        console.error(`Erro ao processar categoria ${nome}:`, catError.message);
      }
    }
    
    res.json({ message: "Categorias inicializadas", criadas });
  } catch (error) {
    console.error("Erro em init-categorias:", error.message);
    res.status(400).json({ error: error.message });
  }
});

// Rotas de itens
app.post("/api/itens", async (req, res) => {
  const { nome, descricao, descricaoES, descricaoEN, preco, peso, img, categoriaId, selo, ingredientes, itensCombo } = req.body;
  try {
    console.log("📝 Criando item:", { nome, preco, peso, categoriaId, selo, ingredientes, itensCombo });
    
    // 💡 Conversão segura dos dados
    const item = await prisma.itemCardapio.create({
      data: { 
        nome, 
        descricao,
        descricaoES,
        descricaoEN,
        preco: parseFloat(preco) || 0, 
        peso: peso ? parseInt(peso) : null,  // Converter string para Int ou null
        img: img || null,
        selo: selo || null,
        categoriaId,
        itensCombo: itensCombo || null,  // Salvar itensCombo (JSON)
        ingredientes: ingredientes && ingredientes.length > 0 ? {
          create: ingredientes.map((ing, index) => ({
            ingredienteId: ing.ingredienteId,
            quantidade: parseFloat(ing.quantidade),
            custo: parseFloat(ing.custo),
            ordem: index
          }))
        } : undefined
      },
      include: { 
        categoria: true,
        ingredientes: {
          include: {
            ingrediente: true
          }
        }
      }
    });
    console.log("✅ Item criado com sucesso:", item.id);
    res.json(item);
  } catch (e) {
    console.error("❌ Erro ao criar item:", e.message);
    res.status(400).json({ error: e.message });
  }
});

// Rota para atualizar ordem dos itens (DEVE VIR ANTES DE /api/itens/:id)
app.put("/api/itens/reordenar", async (req, res) => {
  try {
    console.log("📥 Recebendo request para reordenar itens");
    console.log("📦 Body recebido:", JSON.stringify(req.body, null, 2));
    
    const { itens } = req.body; // Array de { id, ordem }
    
    if (!itens || !Array.isArray(itens)) {
      console.error("❌ Formato inválido - itens não é um array");
      return res.status(400).json({ error: "itens deve ser um array" });
    }
    
    console.log(`🔄 Atualizando ordem de ${itens.length} itens`);
    
    await prisma.$transaction(
      itens.map((item) =>
        prisma.itemCardapio.update({
          where: { id: item.id },
          data: { ordem: item.ordem }
        })
      )
    );
    
    console.log("✅ Ordem atualizada com sucesso!");
    res.json({ success: true });
  } catch (error) {
    console.error("❌ Erro ao reordenar itens:", error);
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/itens/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, descricao, descricaoES, descricaoEN, preco, peso, img, categoriaId, selo, ingredientes, itensCombo } = req.body;
  try {
    console.log("📝 Atualizando item:", id, { nome, preco, peso, selo, ingredientes, itensCombo });
    console.log("🔍 TIPO de itensCombo recebido:", typeof itensCombo);
    console.log("🔍 VALOR de itensCombo:", JSON.stringify(itensCombo));
    
    // Deletar ingredientes antigos
    await prisma.itemIngrediente.deleteMany({
      where: { itemId: id }
    });
    
    const item = await prisma.itemCardapio.update({
      where: { id },
      data: { 
        nome, 
        descricao: descricao || null,
        descricaoES: descricaoES || null,
        descricaoEN: descricaoEN || null,
        preco: parseFloat(preco) || 0, 
        peso: peso ? parseInt(peso) : null,
        img: img || null,
        selo: selo || null,
        categoriaId,
        itensCombo: itensCombo || null,  // Atualizar itensCombo (JSON)
        ingredientes: ingredientes && ingredientes.length > 0 ? {
          create: ingredientes.map((ing, index) => ({
            ingredienteId: ing.ingredienteId,
            quantidade: parseFloat(ing.quantidade),
            custo: parseFloat(ing.custo),
            ordem: index
          }))
        } : undefined
      },
      include: { 
        categoria: true,
        ingredientes: {
          include: {
            ingrediente: true
          }
        }
      }
    });
    console.log("✅ Item atualizado com sucesso:", item.id);
    res.json(item);
  } catch (e) {
    console.error("❌ Erro ao atualizar item:", e.message);
    res.status(400).json({ error: e.message });
  }
});

app.delete("/api/itens/:id", async (req, res) => {
  const { id } = req.params;
  try {
    console.log("🗑️ Deletando item:", id);
    
    await prisma.itemCardapio.delete({
      where: { id }
    });
    console.log("✅ Item deletado com sucesso:", id);
    res.json({ success: true });
  } catch (e) {
    console.error("❌ Erro ao deletar item:", e.message);
    res.status(400).json({ error: e.message });
  }
});

app.get("/api/itens", async (req, res) => {
  const { categoria } = req.query;
  
  try {
    let where = {};
    if (categoria) {
      where = {
        categoria: {
          nome: categoria
        }
      };
    }
    
    const itens = await prisma.itemCardapio.findMany({
      where,
      include: { 
        categoria: true,
        ingredientes: {
          include: {
            ingrediente: true
          },
          orderBy: { ordem: 'asc' }
        }
      },
      orderBy: { ordem: 'asc' }
    });
    console.log("📦 Retornando itens:", itens.length, "itens");
    if (itens.length > 0) {
      console.log("📦 Exemplo de item com ingredientes:", JSON.stringify(itens[0], null, 2));
    }
    res.json(itens);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Rotas de ingredientes
app.get("/api/ingredientes", async (req, res) => {
  try {
    const ingredientes = await prisma.ingrediente.findMany({
      orderBy: { ordem: 'asc' }
    });
    res.json(ingredientes);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/ingredientes", async (req, res) => {
  const { nome, unidade, precoPorUnidade, quantidadePorEmbalagem, precoEmbalagem, pesoMedioPorUnidade, pesoPorPorcao, tipoPorcao } = req.body;
  try {
    const ingrediente = await prisma.ingrediente.create({
      data: {
        nome,
        unidade,
        precoPorUnidade: parseFloat(precoPorUnidade),
        quantidadePorEmbalagem: quantidadePorEmbalagem ? parseFloat(quantidadePorEmbalagem) : null,
        precoEmbalagem: precoEmbalagem ? parseFloat(precoEmbalagem) : null,
        pesoMedioPorUnidade: pesoMedioPorUnidade ? parseFloat(pesoMedioPorUnidade) : null,
        pesoPorPorcao: pesoPorPorcao ? parseFloat(pesoPorPorcao) : null,
        tipoPorcao: tipoPorcao || null,
      },
    });
    res.json(ingrediente);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put("/api/ingredientes/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, unidade, precoPorUnidade, quantidadePorEmbalagem, precoEmbalagem, pesoMedioPorUnidade, pesoPorPorcao, tipoPorcao } = req.body;
  try {
    const ingrediente = await prisma.ingrediente.update({
      where: { id },
      data: {
        nome,
        unidade,
        precoPorUnidade: parseFloat(precoPorUnidade),
        quantidadePorEmbalagem: quantidadePorEmbalagem ? parseFloat(quantidadePorEmbalagem) : null,
        precoEmbalagem: precoEmbalagem ? parseFloat(precoEmbalagem) : null,
        pesoMedioPorUnidade: pesoMedioPorUnidade ? parseFloat(pesoMedioPorUnidade) : null,
        pesoPorPorcao: pesoPorPorcao ? parseFloat(pesoPorPorcao) : null,
        tipoPorcao: tipoPorcao || null,
      },
    });
    res.json(ingrediente);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete("/api/ingredientes/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.ingrediente.delete({
      where: { id }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Rotas de pedidos
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
      include: {
        itens: {
          include: {
            item: true
          }
        }
      }
    });
    
    // TODO: Enviar email/SMS para cliente notificando mudança de status
    console.log(`📧 Status do pedido ${id} alterado para: ${status}`);
    
    res.json(upd);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Criar novo pedido (sem pagamento)
app.post("/api/pedidos", async (req, res) => {
  const { clienteNome, clienteEmail, clienteTelefone, clienteCPF, endereco, cep, frete, total, itens, observacao } = req.body;
  
  try {
    console.log("📦 Criando novo pedido:", { clienteNome, total, itensCount: itens?.length });
    console.log("📦 Dados recebidos:", JSON.stringify(req.body, null, 2));
    console.log("🔥 VERSAO ATUALIZADA - STATUS SOLICITADO");
    
    const pedido = await prisma.pedido.create({
      data: {
        clienteNome,
        clienteEmail: clienteEmail || null,
        clienteTelefone,
        clienteCPF: clienteCPF || null,
        endereco: endereco || null,
        cep: cep || null,
        frete: parseFloat(frete) || 0,
        total: parseFloat(total),
        observacao: observacao || null,
        status: 'SOLICITADO',
        itens: {
          create: itens.map(item => ({
            itemId: item.id,
            quantidade: item.quantidade,
            precoUnit: parseFloat(item.preco),
            observacao: item.observacao || null
          }))
        }
      },
      include: {
        itens: {
          include: {
            item: true
          }
        }
      }
    });
    
    console.log("✅ Pedido criado com sucesso:", pedido.id);
    
    // TODO: Enviar email/SMS para cliente e para o dono
    console.log(`📧 Enviando notificações para cliente: ${clienteEmail} / ${clienteTelefone}`);
    
    res.json(pedido);
  } catch (e) {
    console.error("❌ Erro ao criar pedido:", e.message);
    res.status(400).json({ error: e.message });
  }
});

// Rota para atualizar ordem dos ingredientes
app.put("/api/ingredientes/reordenar", async (req, res) => {
  try {
    const { ingredientes } = req.body; // Array de { id, ordem }
    
    await prisma.$transaction(
      ingredientes.map((ing) =>
        prisma.ingrediente.update({
          where: { id: ing.id },
          data: { ordem: ing.ordem }
        })
      )
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao reordenar ingredientes:", error);
    res.status(500).json({ error: error.message });
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