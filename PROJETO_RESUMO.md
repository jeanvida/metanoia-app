# 📋 Resumo Completo - Metanoia App

## 🎯 Descrição do Projeto
Sistema de cardápio digital para hamburgueria com carrinho de compras, área administrativa e integração de pagamento.

## 🏗️ Arquitetura

### **Frontend** (React + Vite)
- **Deploy:** Vercel (auto-deploy do branch `main`)
- **URL:** https://metanoia-app.vercel.app
- **Estrutura:**
  - `/` - Cardápio público (idiomas: PT, EN, ES)
  - `/admin` - Painel administrativo
  - **Páginas Admin:** Pedidos, Hambúrgueres, Bebidas, Acompanhamentos, Combos, Ingredientes

### **Backend** (Node.js + Express)
- **Deploy:** Render.com (auto-deploy do branch `main`)
- **URL:** https://metanoia-app.onrender.com
- **ORM:** Prisma 6.19.0
- **Prisma Client:** `backend/generated/prisma/`

### **Banco de Dados**
- **Provider:** Supabase (PostgreSQL)
- **Host:** aws-1-us-east-1.pooler.supabase.com:5432
- **Conexão:** Prisma ORM

## 📦 Modelos do Banco (Principais)

### **Pedido**
```prisma
model Pedido {
  id               String        @id @default(uuid())
  clienteNome      String
  clienteEmail     String?
  clienteTelefone  String
  clienteCPF       String?
  endereco         String?
  cep              String?
  frete            Decimal       @default(0) @db.Decimal(10, 2)
  total            Decimal       @db.Decimal(10, 2)
  observacao       String?
  status           PedidoStatus  @default(SOLICITADO)
  createdAt        DateTime      @default(now())
  itens            ItemPedido[]
}

enum PedidoStatus {
  SOLICITADO
  EM_ANDAMENTO
  SAIU_ENTREGA
  CONCLUIDO
  CANCELADO
}
```

### **ItemPedido**
```prisma
model ItemPedido {
  id         String   @id @default(uuid())
  pedidoId   String
  itemId     String
  quantidade Int
  precoUnit  Decimal  @db.Decimal(10, 2)
  observacao String?
  pedido     Pedido   @relation(fields: [pedidoId], references: [id])
  item       Item     @relation(fields: [itemId], references: [id])
}
```

### **Item** (Hambúrgueres, Bebidas, Acompanhamentos)
```prisma
model Item {
  id           String            @id @default(uuid())
  nome         String
  descricao    String
  preco        Decimal           @db.Decimal(10, 2)
  img          String?
  categoriaId  String
  peso         Decimal?          @db.Decimal(10, 2)
  descricaoEN  String?
  descricaoES  String?
  selo         String?
  ordem        Int               @default(0)
  createdAt    DateTime          @default(now())
  categoria    Categoria         @relation(fields: [categoriaId], references: [id])
  ingredientes ItemIngrediente[]
  itensCombo   ItemCombo[]
  itensPedido  ItemPedido[]
}
```

### **Combo**
```prisma
model Combo {
  id          String      @id @default(uuid())
  nome        String
  descricao   String
  preco       Decimal     @db.Decimal(10, 2)
  img         String?
  ordem       Int         @default(0)
  createdAt   DateTime    @default(now())
  itensCombo  ItemCombo[]
}
```

### **Ingrediente**
```prisma
model Ingrediente {
  id                      String            @id @default(uuid())
  nome                    String
  unidade                 String
  precoPorUnidade         Decimal           @db.Decimal(10, 2)
  quantidadePorEmbalagem  Decimal           @db.Decimal(10, 2)
  precoEmbalagem          Decimal           @db.Decimal(10, 2)
  pesoMedioPorUnidade     Decimal?          @db.Decimal(10, 2)
  pesoPorPorcao           Decimal?          @db.Decimal(10, 2)
  tipoPorcao              String            @default("porção")
  ordem                   Int               @default(0)
  createdAt               DateTime          @default(now())
  updatedAt               DateTime          @updatedAt
  itens                   ItemIngrediente[]
}
```

## 🔧 Features Implementadas

### **Cardápio (Cliente)**
- ✅ Listagem de itens por categoria (Hambúrgueres, Bebidas, Acompanhamentos, Combos)
- ✅ Carrinho de compras com observações por item
- ✅ Cálculo de frete automático via ViaCEP
- ✅ Campo de observações do pedido (limite 500 caracteres)
- ✅ Dados pré-preenchidos para teste:
  - Nome: Jean Teste
  - Telefone: 41999999999
  - CPF: 123.456.789-00
  - CEP: 88330768
- ✅ Validação reCAPTCHA v2
- ✅ Integração PagBank (PIX/Cartão)
- ✅ Multi-idioma (PT/EN/ES)

### **Admin**
- ✅ CRUD completo: Hambúrgueres, Bebidas, Acompanhamentos, Combos
- ✅ Gestão de Ingredientes por item
- ✅ Reordenação via drag-and-drop (react-beautiful-dnd)
- ✅ Upload de imagens (conversão para base64)
- ✅ Gestão de Pedidos com:
  - Atualização de status (dropdown)
  - Visualização completa: CPF, endereço, CEP, frete, observações (destacado em amarelo)
  - Listagem com data/hora

## 🚀 Deploy & CI/CD

### **Processo Atual:**
1. `git push` → GitHub (branch `main`)
2. **Vercel** detecta → build frontend → deploy automático
3. **Render** detecta → build backend → `npm install` → `prisma generate` → deploy

### **Comandos Importantes:**

#### Frontend (local)
```bash
npm run dev
```

#### Backend (local)
```bash
cd backend
npm run dev
```

#### Prisma
```bash
# Gerar Prisma Client
npx prisma generate

# Abrir Prisma Studio
npx prisma studio

# Criar nova migração
npx prisma migrate dev --name nome_da_migracao

# Aplicar migrações em produção
npx prisma migrate deploy
```

## 🔄 Migrations Recentes

### **Última migração manual (SQL direto no Supabase - 11/12/2025):**

Arquivo: `backend/MIGRATION_MANUAL.sql`

```sql
-- 1. Adicionar novos campos na tabela Pedido
ALTER TABLE "Pedido" ADD COLUMN IF NOT EXISTS "clienteEmail" TEXT;
ALTER TABLE "Pedido" ADD COLUMN IF NOT EXISTS "clienteCPF" TEXT;
ALTER TABLE "Pedido" ADD COLUMN IF NOT EXISTS "endereco" TEXT;
ALTER TABLE "Pedido" ADD COLUMN IF NOT EXISTS "cep" TEXT;
ALTER TABLE "Pedido" ADD COLUMN IF NOT EXISTS "frete" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "Pedido" ADD COLUMN IF NOT EXISTS "observacao" TEXT;

-- 2. Atualizar enum PedidoStatus (adicionar novos valores)
ALTER TYPE "PedidoStatus" ADD VALUE IF NOT EXISTS 'SOLICITADO';
ALTER TYPE "PedidoStatus" ADD VALUE IF NOT EXISTS 'EM_ANDAMENTO';
ALTER TYPE "PedidoStatus" ADD VALUE IF NOT EXISTS 'SAIU_ENTREGA';
ALTER TYPE "PedidoStatus" ADD VALUE IF NOT EXISTS 'CONCLUIDO';

-- 3. Migrar dados existentes (PENDENTE → SOLICITADO)
UPDATE "Pedido" SET "status" = 'SOLICITADO' WHERE "status" = 'PENDENTE';

-- 4. Remover valores antigos do enum (se não houver mais dados)
-- Nota: Isso requer recriar o enum, então foi deixado para depois
```

**Motivo:** Prisma migrate dev falhou por timeout no shadow database do Supabase.

## 🐛 Bugs Recentes Corrigidos

### 1. **Mapeamento de campos no pedido** ✅
- **Problema:** Frontend enviava `id` e `preco`, backend esperava `itemId` e `precoUnit`
- **Solução:** Corrigido em 2 funções do frontend:
  - `criarPedidoBackend()` (linha 288)
  - `finalizarPedidoTeste()` (linha 457)
- **Commit:** `d02379c`

### 2. **Rotas duplicadas no backend** ✅
- **Problema:** 2 rotas `POST /api/pedidos`, uma sobrescrevia a outra
- **Solução:** Removida rota antiga (linha 362-395), mantida rota completa

### 3. **Schema Prisma faltando campos** ✅
- **Problema:** Campos `clienteEmail`, `clienteCPF`, `endereco`, `cep`, `frete`, `observacao` não existiam
- **Solução:** Atualizado schema + migração manual SQL
- **Commit:** `06b1070`

### 4. **Prisma Client desatualizado no Render** ✅
- **Problema:** Deploy não regenerava Prisma Client após mudanças no schema
- **Solução:** Verificado `package.json` tem `postinstall: "prisma generate"`

### 5. **Campo observações duplicado** ✅
- **Problema:** `observacao: cliente.observacaoPedido || cliente.observacaoPedido || null`
- **Solução:** Simplificado para `observacao: cliente.observacaoPedido || null`

## 📝 Próximos Passos Sugeridos

- [ ] Implementar notificações (email/SMS) ao criar pedido
- [ ] Remover dados pré-preenchidos de teste
- [ ] Adicionar filtros/busca na página de pedidos (por data, status, cliente)
- [ ] Dashboard com estatísticas de vendas
- [ ] Sistema de autenticação para admin (JWT ou sessões)
- [ ] Backup automático do banco de dados
- [ ] Testes automatizados (Jest/Vitest)
- [ ] Logs estruturados (Winston/Pino)
- [ ] Rate limiting nas APIs
- [ ] Validação de dados com Zod

## 🔑 Arquivos Importantes

### **Backend**
- `backend/index.js` - API Express principal
- `backend/prisma/schema.prisma` - Schema do banco de dados
- `backend/prisma/migrations/` - Histórico de migrações
- `backend/MIGRATION_MANUAL.sql` - Migração manual recente
- `backend/package.json` - Dependências e scripts

### **Frontend**
- `src/pages/Cardapio.jsx` - Cardápio principal do cliente
- `src/pages/admin/AdminPedidos.jsx` - Gestão de pedidos
- `src/pages/admin/AdminHamburgueres.jsx` - CRUD hambúrgueres
- `src/pages/admin/AdminBebidas.jsx` - CRUD bebidas
- `src/pages/admin/AdminAcompanhamentos.jsx` - CRUD acompanhamentos
- `src/pages/admin/AdminCombos.jsx` - CRUD combos
- `src/pages/admin/AdminIngredientes.jsx` - CRUD ingredientes
- `src/services/api.js` - Cliente HTTP (fetch)
- `src/services/pagamentos.js` - Integração PagBank
- `src/i18n/translations.js` - Traduções PT/EN/ES

### **Configuração**
- `vercel.json` - Config deploy frontend
- `render.yaml` - Config deploy backend
- `vite.config.js` - Config Vite
- `eslint.config.js` - Config ESLint

## 🔐 Variáveis de Ambiente

### **Backend (.env)**
```env
DATABASE_URL="postgresql://..."
PAGBANK_EMAIL="seu-email@pagbank.com"
PAGBANK_TOKEN="seu-token-pagbank"
```

### **Frontend (.env)**
```env
VITE_API_URL="https://metanoia-app.onrender.com"
VITE_RECAPTCHA_SITE_KEY="sua-chave-recaptcha"
```

## 📊 Estatísticas do Projeto

- **Commits recentes:** 
  - `d02379c` - fix: corrigir DEFINITIVAMENTE os campos itemId e precoUnit
  - `4d1b93b` - fix: corrigir mapeamento de campos itemId e precoUnit no backend
  - `06b1070` - feat: adicionar campos completos no schema Pedido
  - `bb63270` - feat: adicionar campo observações no carrinho
  - `27aec2f` - feat: adicionar exibição completa de dados no AdminPedidos

- **Tecnologias principais:**
  - React 19.2.1
  - Vite 7.2.6
  - Prisma 6.19.0
  - Express 4.21.2
  - PostgreSQL (Supabase)

---

## 📞 Suporte

**Status Atual:** ✅ Funcionando  
**Última atualização:** 11/12/2025  
**Próximo deploy:** ⏳ Aguardando Vercel + Render

---

**Desenvolvido para Metanoia Hamburgueria** 🍔
