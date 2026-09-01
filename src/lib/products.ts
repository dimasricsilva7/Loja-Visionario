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
