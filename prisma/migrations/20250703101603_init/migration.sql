/*
  Warnings:

  - You are about to drop the column `additionalScore` on the `Calculation` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Calculation` table. All the data in the column will be lost.
  - You are about to alter the column `userId` on the `Calculation` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to drop the column `amount` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `stripeSessionId` on the `Payment` table. All the data in the column will be lost.
  - Added the required column `biologyScore` to the `Calculation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `chemistryScore` to the `Calculation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `faculty` to the `Calculation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Calculation" DROP COLUMN "additionalScore",
DROP COLUMN "name",
ADD COLUMN     "biologyScore" INTEGER NOT NULL,
ADD COLUMN     "chemistryScore" INTEGER NOT NULL,
ADD COLUMN     "faculty" TEXT NOT NULL,
ADD COLUMN     "region" TEXT,
ALTER COLUMN "userId" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "amount",
DROP COLUMN "stripeSessionId",
ADD COLUMN     "proofPhotoId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phone" TEXT,
ADD COLUMN     "region" TEXT;

-- AddForeignKey
ALTER TABLE "Calculation" ADD CONSTRAINT "Calculation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
