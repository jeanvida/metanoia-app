-- CreateTable
CREATE TABLE "itens_cardapio" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "preco" DECIMAL(65,30) NOT NULL,
    "categoria" TEXT NOT NULL,

    CONSTRAINT "itens_cardapio_pkey" PRIMARY KEY ("id")
);
