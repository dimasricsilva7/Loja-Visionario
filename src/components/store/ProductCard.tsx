import Image from "next/image";
import Link from "next/link";
import type { Product } from "@prisma/client";
import { Badge } from "@/components/ui/Badge";
import { discountPercent, formatCentsToBRL } from "@/lib/money";

export function ProductCard({ product }: { product: Product }) {
  const discount = discountPercent(product.priceCents, product.compareAtPriceCents);
  const outOfStock = product.stock <= 0;

  return (
    <Link
      href={`/produto/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition hover:border-brand/60"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface-2">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition duration-300 group-hover:scale-105"
        />

        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {product.badge && <Badge label={product.badge} color={product.badgeColor} />}
          {discount && <Badge label={`-${discount}%`} color="#ff5c5c" />}
        </div>

        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <span className="rounded-sm bg-surface px-3 py-1 text-xs font-bold uppercase">Esgotado</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold">{product.name}</h3>
        <div className="mt-auto flex items-baseline gap-2">
          <span className="text-base font-black">{formatCentsToBRL(product.priceCents)}</span>
          {product.compareAtPriceCents && (
            <span className="text-xs text-muted line-through">
              {formatCentsToBRL(product.compareAtPriceCents)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
