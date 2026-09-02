export const CANONICAL_CATEGORIES: { name: string; subtitle: string }[] = [
  { name: "Novidade", subtitle: "Chegou agora na loja" },
  { name: "Países", subtitle: "Edições por país" },
  { name: "Frases", subtitle: "Frases de impacto" },
  { name: "Destaque", subtitle: "Peças premium" },
  { name: "Moletons", subtitle: "Conforto premium" },
  { name: "Camisetas", subtitle: "A base do streetwear" },
];

export function getCategorySubtitle(category: string): string | undefined {
  return CANONICAL_CATEGORIES.find((c) => c.name === category)?.subtitle;
}

export function isCanonicalCategory(category: string): boolean {
  return CANONICAL_CATEGORIES.some((c) => c.name === category);
}

export function sortCategoriesCanonically<T extends { category: string }>(groups: T[]): T[] {
  const order = new Map(CANONICAL_CATEGORIES.map((c, i) => [c.name, i]));
  return [...groups].sort((a, b) => {
    const ai = order.has(a.category) ? order.get(a.category)! : Number.MAX_SAFE_INTEGER;
    const bi = order.has(b.category) ? order.get(b.category)! : Number.MAX_SAFE_INTEGER;
    if (ai !== bi) return ai - bi;
    return a.category.localeCompare(b.category);
  });
}
