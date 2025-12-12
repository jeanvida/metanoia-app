-- AlterEnum: Atualizar PedidoStatus para os novos valores
ALTER TYPE "PedidoStatus" ADD VALUE IF NOT EXISTS 'SOLICITADO';
ALTER TYPE "PedidoStatus" ADD VALUE IF NOT EXISTS 'EM_ANDAMENTO';
ALTER TYPE "PedidoStatus" ADD VALUE IF NOT EXISTS 'SAIU_ENTREGA';
ALTER TYPE "PedidoStatus" ADD VALUE IF NOT EXISTS 'CONCLUIDO';
ALTER TYPE "PedidoStatus" ADD VALUE IF NOT EXISTS 'CANCELADO';

-- Atualizar pedidos existentes de PENDENTE para SOLICITADO
UPDATE "Pedido" SET "status" = 'SOLICITADO' WHERE "status" = 'PENDENTE';
