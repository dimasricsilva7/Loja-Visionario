import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductsTable } from "@/components/admin/ProductsTable";

export const metadata: Metadata = { title: "Produtos" };

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black tracking-tight">Produtos</h1>
        <Link
          href="/admin/produtos/novo"
          className="rounded-md bg-brand px-4 py-2 text-sm font-bold text-brand-fg"
        >
          Novo produto
        </Link>
      </div>

      <ProductsTable
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          image: p.image,
          priceCents: p.priceCents,
          stock: p.stock,
          active: p.active,
          featured: p.featured,
        }))}
      />
    </div>
  );
}
