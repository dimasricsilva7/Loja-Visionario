import type { Product } from "@prisma/client";
import { ProductCard } from "./ProductCard";

export function ProductGrid({ products, title }: { products: Product[]; title?: string }) {
  return (
    <section id="produtos" className="container-page py-14">
      {title && <h2 className="mb-6 text-2xl font-black tracking-tight sm:text-3xl">{title}</h2>}

      {products.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-10 text-center text-sm text-muted">
          Nenhum produto disponível no momento. Volte em breve.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
