import { prisma } from "./prisma";
import { sortCategoriesCanonically } from "./categories";

export function getActiveProducts() {
  return prisma.product.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
}

export function getFeaturedProducts(limit = 8) {
  return prisma.product.findMany({
    where: { active: true, featured: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: limit,
  });
}

export function getProductBySlug(slug: string) {
  return prisma.product.findUnique({ where: { slug } });
}

export async function getProductsGroupedByCategory() {
  const products = await getActiveProducts();
  const groups = new Map<string, typeof products>();

  for (const product of products) {
    const key = product.category || "Geral";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(product);
  }

  const list = Array.from(groups.entries()).map(([category, items]) => ({ category, products: items }));
  return sortCategoriesCanonically(list);
}

export function getRelatedProducts(category: string, excludeId: string, limit = 4) {
  return prisma.product.findMany({
    where: { active: true, category, id: { not: excludeId } },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: limit,
  });
}

/**
 * Produtos escolhidos manualmente no admin para "Você também vai gostar".
 * Sem curadoria definida, cai de volta para produtos da mesma categoria.
 */
export async function getCuratedRelatedProducts(productId: string, category: string, limit = 4) {
  const curated = await prisma.productRelation.findMany({
    where: { productId, relatedProduct: { active: true } },
    orderBy: { sortOrder: "asc" },
    take: limit,
    include: { relatedProduct: true },
  });

  if (curated.length > 0) {
    return curated.map((r) => r.relatedProduct);
  }

  return getRelatedProducts(category, productId, limit);
}
