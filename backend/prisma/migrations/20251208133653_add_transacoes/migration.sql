-- CreateTable
CREATE TABLE "TransacaoPagamento" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "dados" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransacaoPagamento_pkey" PRIMARY KEY ("id")
);
