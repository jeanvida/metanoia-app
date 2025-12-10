-- CreateTable
CREATE TABLE "itens_ingredientes" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "ingredienteId" TEXT NOT NULL,
    "quantidade" DECIMAL(10,3) NOT NULL,
    "custo" DECIMAL(10,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "itens_ingredientes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "itens_ingredientes" ADD CONSTRAINT "itens_ingredientes_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "itens_cardapio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_ingredientes" ADD CONSTRAINT "itens_ingredientes_ingredienteId_fkey" FOREIGN KEY ("ingredienteId") REFERENCES "ingredientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
