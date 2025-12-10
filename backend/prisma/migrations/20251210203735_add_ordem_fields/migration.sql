-- AlterTable
ALTER TABLE "ingredientes" ADD COLUMN     "ordem" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "itens_cardapio" ADD COLUMN     "ordem" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "itens_ingredientes" ADD COLUMN     "ordem" INTEGER NOT NULL DEFAULT 0;
