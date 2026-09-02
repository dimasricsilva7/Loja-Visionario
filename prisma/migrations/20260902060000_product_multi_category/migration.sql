-- Adiciona a nova coluna de categorias (array), preenchida com a
-- categoria unica que cada produto ja tinha, depois remove a coluna antiga.
ALTER TABLE "Product" ADD COLUMN "categories" TEXT[] NOT NULL DEFAULT ARRAY['Geral']::TEXT[];

UPDATE "Product" SET "categories" = ARRAY["category"]::TEXT[] WHERE "category" IS NOT NULL;

ALTER TABLE "Product" DROP COLUMN "category";
