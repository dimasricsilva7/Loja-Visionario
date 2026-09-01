import { prisma } from "./prisma";

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

  return Array.from(groups.entries()).map(([category, items]) => ({ category, products: items }));
}

export function getRelatedProducts(category: string, excludeId: string, limit = 4) {
  return prisma.product.findMany({
    where: { active: true, category, id: { not: excludeId } },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: limit,
  });
}
