/*
  Warnings:

  - You are about to drop the column `categoria` on the `itens_cardapio` table. All the data in the column will be lost.
  - You are about to alter the column `preco` on the `itens_cardapio` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - Added the required column `categoriaId` to the `itens_cardapio` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PedidoStatus" AS ENUM ('PENDENTE', 'PREPARANDO', 'PRONTO', 'ENTREGUE', 'CANCELADO');

-- AlterTable
ALTER TABLE "itens_cardapio" DROP COLUMN "categoria",
ADD COLUMN     "categoriaId" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "img" TEXT,
ADD COLUMN     "peso" INTEGER,
ALTER COLUMN "descricao" DROP NOT NULL,
ALTER COLUMN "preco" SET DATA TYPE DECIMAL(10,2);

-- CreateTable
CREATE TABLE "Categoria" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pedido" (
    "id" TEXT NOT NULL,
    "clienteNome" TEXT,
    "clienteTelefone" TEXT,
    "status" "PedidoStatus" NOT NULL DEFAULT 'PENDENTE',
    "total" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PedidoItem" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "precoUnit" DECIMAL(10,2) NOT NULL,
    "observacao" TEXT,

    CONSTRAINT "PedidoItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_nome_key" ON "Categoria"("nome");

-- AddForeignKey
ALTER TABLE "itens_cardapio" ADD CONSTRAINT "itens_cardapio_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoItem" ADD CONSTRAINT "PedidoItem_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoItem" ADD CONSTRAINT "PedidoItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "itens_cardapio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
