import { prisma } from "@/lib/prisma";

export async function getDistinctCategories(): Promise<string[]> {
  const products = await prisma.product.findMany({ select: { categories: true } });
  const set = new Set<string>();
  for (const p of products) {
    for (const c of p.categories) set.add(c);
  }
  return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
}
