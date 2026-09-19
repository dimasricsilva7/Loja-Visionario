import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { BulkDiscountForm } from "@/components/admin/BulkDiscountForm";

export const metadata: Metadata = { title: "Descontos" };
export const dynamic = "force-dynamic";

async function getCategories(): Promise<string[]> {
  const products = await prisma.product.findMany({ select: { categories: true } });
  const set = new Set<string>();
  for (const p of products) {
    for (const c of p.categories) set.add(c);
  }
  return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export default async function AdminDescontosPage() {
  const categories = await getCategories();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-black tracking-tight">Descontos por categoria</h1>
        <p className="mt-1 text-sm text-muted">
          Aplique um desconto em todos os produtos de uma categoria de uma vez, sem precisar editar produto por
          produto.
        </p>
      </div>
      <BulkDiscountForm categories={categories} />
    </div>
  );
}
