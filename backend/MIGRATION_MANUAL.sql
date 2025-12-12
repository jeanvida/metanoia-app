-- EXECUTE NO PAINEL DO SUPABASE (SQL Editor)

-- 1. Adicionar novos campos na tabela Pedido
ALTER TABLE "Pedido" 
  ADD COLUMN IF NOT EXISTS "clienteEmail" TEXT,
  ADD COLUMN IF NOT EXISTS "clienteCPF" TEXT,
  ADD COLUMN IF NOT EXISTS "endereco" TEXT,
  ADD COLUMN IF NOT EXISTS "cep" TEXT,
  ADD COLUMN IF NOT EXISTS "frete" DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "observacao" TEXT;

-- 2. Atualizar enum PedidoStatus (já foi feito antes, mas garantindo)
ALTER TYPE "PedidoStatus" ADD VALUE IF NOT EXISTS 'SOLICITADO';
ALTER TYPE "PedidoStatus" ADD VALUE IF NOT EXISTS 'EM_ANDAMENTO';
ALTER TYPE "PedidoStatus" ADD VALUE IF NOT EXISTS 'SAIU_ENTREGA';
ALTER TYPE "PedidoStatus" ADD VALUE IF NOT EXISTS 'CONCLUIDO';

-- 3. Atualizar pedidos existentes
UPDATE "Pedido" SET "status" = 'SOLICITADO' WHERE "status" = 'PENDENTE';
UPDATE "Pedido" SET "status" = 'EM_ANDAMENTO' WHERE "status" = 'PREPARANDO';
UPDATE "Pedido" SET "status" = 'CONCLUIDO' WHERE "status" = 'PRONTO' OR "status" = 'ENTREGUE';
