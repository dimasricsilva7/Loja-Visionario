import type { Metadata } from "next";
import { getDistinctCategories } from "@/lib/get-categories";
import { BulkDiscountForm } from "@/components/admin/BulkDiscountForm";

export const metadata: Metadata = { title: "Descontos" };
export const dynamic = "force-dynamic";

export default async function AdminDescontosPage() {
  const categories = await getDistinctCategories();

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
