"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@prisma/client";
import { Badge } from "@/components/ui/Badge";
import { discountPercent, formatCentsToBRL } from "@/lib/money";
import { getViewingNowCount } from "@/lib/social-proof";
import { ViewingNowBadge } from "./ViewingNowBadge";
import { BagIcon } from "@/components/icons";
import { QuickViewModal } from "./QuickViewModal";

export function ProductCard({ product, freeShipping = false }: { product: Product; freeShipping?: boolean }) {
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const outOfStock = product.stock <= 0;
  const viewingNow = getViewingNowCount(product.id);
  const discount = discountPercent(product.priceCents, product.compareAtPriceCents);
  const installmentPrice =
    product.installments > 1 ? Math.ceil(product.priceCents / product.installments) : null;

  return (
    <div className="group flex w-full flex-col overflow-hidden rounded-lg border border-border bg-surface transition hover:border-brand/60">
      <Link href={`/produto/${product.slug}`} className="contents">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface-2">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 46vw, 224px"
            className="object-cover transition duration-300 group-hover:scale-105"
          />

          <ViewingNowBadge count={viewingNow} compact className="absolute left-2 top-2 max-w-[62%]" />

          <div className="absolute right-2 top-2 flex flex-col items-end gap-1">
            {product.badge && <Badge label={product.badge} color={product.badgeColor} />}
            {discount && <Badge label={`-${discount}%`} color="#ff5c5c" />}
          </div>

          {outOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <span className="rounded-sm bg-surface px-3 py-1 text-xs font-bold uppercase">Esgotado</span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1 p-3 pb-0">
          <h3 className="line-clamp-2 text-sm font-semibold">{product.name}</h3>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-black text-brand">{formatCentsToBRL(product.priceCents)}</span>
              {product.compareAtPriceCents && (
                <span className="text-xs text-muted line-through">
                  {formatCentsToBRL(product.compareAtPriceCents)}
                </span>
              )}
            </div>
            {installmentPrice && (
              <p className="text-[11px] text-muted">
                ou {product.installments}x de {formatCentsToBRL(installmentPrice)} no PIX
              </p>
            )}
            {freeShipping && <p className="text-[11px] font-bold text-brand">Frete grátis</p>}
          </div>
        </div>
      </Link>

      <div className="p-3 pt-2">
        <button
          type="button"
          disabled={outOfStock}
          onClick={(e) => {
            e.preventDefault();
            setQuickViewOpen(true);
          }}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-brand py-2 text-xs font-bold text-brand-fg disabled:opacity-50"
        >
          <BagIcon /> {outOfStock ? "Esgotado" : "Comprar"}
        </button>
      </div>

      {quickViewOpen && (
        <QuickViewModal
          product={{
            slug: product.slug,
            name: product.name,
            image: product.image,
            priceCents: product.priceCents,
            compareAtPriceCents: product.compareAtPriceCents,
            installments: product.installments,
            stock: product.stock,
          }}
          onClose={() => setQuickViewOpen(false)}
        />
      )}
    </div>
  );
}
