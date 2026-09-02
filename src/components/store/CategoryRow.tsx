import type { Product } from "@prisma/client";
import Link from "next/link";
import { ProductCard } from "./ProductCard";

function slugifyCategory(category: string): string {
  return category
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function CategoryRow({
  category,
  subtitle,
  products,
  tone = "dark",
  freeShipping = false,
}: {
  category: string;
  subtitle?: string;
  products: Product[];
  tone?: "dark" | "gray";
  freeShipping?: boolean;
}) {
  if (products.length === 0) return null;

  return (
    <section className={`border-b border-border py-8 ${tone === "gray" ? "bg-surface-2" : "bg-bg"}`}>
      <div className="container-page mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight sm:text-2xl">{category}</h2>
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        </div>
        <Link href={`/categoria/${slugifyCategory(category)}`} className="text-xs font-semibold text-brand hover:underline">
          Ver todos →
        </Link>
      </div>

      <div className="container-page flex gap-3 overflow-x-auto pb-2 sm:gap-4">
        {products.map((product) => (
          <div key={product.id} className="w-[46vw] shrink-0 sm:w-56">
            <ProductCard product={product} freeShipping={freeShipping} />
          </div>
        ))}
      </div>
    </section>
  );
}

export { slugifyCategory };
