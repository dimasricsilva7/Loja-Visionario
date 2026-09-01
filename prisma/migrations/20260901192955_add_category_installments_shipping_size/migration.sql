-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "installmentCount" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "paymentPlan" TEXT NOT NULL DEFAULT 'AVISTA',
ADD COLUMN     "shippingAddress" TEXT,
ADD COLUMN     "shippingCep" TEXT,
ADD COLUMN     "shippingCity" TEXT,
ADD COLUMN     "shippingComplement" TEXT,
ADD COLUMN     "shippingNeighborhood" TEXT,
ADD COLUMN     "shippingNumber" TEXT,
ADD COLUMN     "shippingState" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "size" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'Geral',
ADD COLUMN     "installments" INTEGER NOT NULL DEFAULT 1;
