import type { Metadata } from "next";
import { getDistinctCategories } from "@/lib/get-categories";
import { BulkInstallmentsForm } from "@/components/admin/BulkInstallmentsForm";

export const metadata: Metadata = { title: "Parcelamento" };
export const dynamic = "force-dynamic";

export default async function AdminParcelamentoPage() {
  const categories = await getDistinctCategories();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-black tracking-tight">Parcelamento por categoria</h1>
        <p className="mt-1 text-sm text-muted">
          Ative ou remova o parcelamento no PIX de todos os produtos de uma categoria de uma vez.
        </p>
      </div>
      <BulkInstallmentsForm categories={categories} />
    </div>
  );
}
