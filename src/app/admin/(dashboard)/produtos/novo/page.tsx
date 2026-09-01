import type { Metadata } from "next";
import { ProductForm } from "@/components/admin/ProductForm";

export const metadata: Metadata = { title: "Novo produto" };

export default function NewProductPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-black tracking-tight">Novo produto</h1>
      <ProductForm />
    </div>
  );
}
