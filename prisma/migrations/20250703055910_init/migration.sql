-- CreateTable
CREATE TABLE "Calculation" (
    "id" SERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "mainScore" INTEGER NOT NULL,
    "additionalScore" INTEGER NOT NULL,
    "educationType" TEXT NOT NULL,
    "probability" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Calculation_pkey" PRIMARY KEY ("id")
);
