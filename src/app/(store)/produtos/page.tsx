import type { Metadata } from "next";
import Link from "next/link";
import { getActiveProducts } from "@/lib/products";
import { sortCategoriesCanonically } from "@/lib/categories";
import { ProductGrid } from "@/components/store/ProductGrid";
import { getStoreSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Todos os produtos" };
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ categoria?: string }>;
}

export default async function AllProductsPage({ searchParams }: PageProps) {
  const { categoria } = await searchParams;
  const [products, settings] = await Promise.all([getActiveProducts(), getStoreSettings()]);

  const categories = sortCategoriesCanonically(
    Array.from(new Set(products.flatMap((p) => p.categories))).map((category) => ({ category }))
  ).map((c) => c.category);

  const filtered = categoria ? products.filter((p) => p.categories.includes(categoria)) : products;

  return (
    <div className="py-8 sm:py-12">
      <div className="container-page">
        <h1 className="mb-4 text-2xl font-black tracking-tight sm:text-3xl">Todos os produtos</h1>

        <div className="flex flex-wrap gap-2 pb-2">
          <Link
            href="/produtos"
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
              !categoria ? "border-brand bg-brand text-brand-fg" : "border-border text-muted hover:text-fg"
            }`}
          >
            Todos
          </Link>
          {categories.map((c) => (
            <Link
              key={c}
              href={`/produtos?categoria=${encodeURIComponent(c)}`}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                categoria === c ? "border-brand bg-brand text-brand-fg" : "border-border text-muted hover:text-fg"
              }`}
            >
              {c}
            </Link>
          ))}
        </div>
      </div>

      <ProductGrid products={filtered} freeShipping={settings.shippingCents === 0} />
    </div>
  );
}
