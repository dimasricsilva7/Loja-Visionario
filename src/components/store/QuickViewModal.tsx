"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatCentsToBRL } from "@/lib/money";
import { PRODUCT_SIZES, type ProductSize } from "@/lib/br-validators";
import { CloseIcon, BagIcon } from "@/components/icons";

interface QuickViewProduct {
  slug: string;
  name: string;
  image: string;
  priceCents: number;
  compareAtPriceCents: number | null;
  installments: number;
  stock: number;
}

export function QuickViewModal({ product, onClose }: { product: QuickViewProduct; onClose: () => void }) {
  const router = useRouter();
  const [size, setSize] = useState<ProductSize | "">("");
  const [addedToCart, setAddedToCart] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const installmentPrice =
    product.installments > 1 ? Math.ceil(product.priceCents / product.installments) : null;
  const outOfStock = product.stock <= 0;

  function handleAddToCart() {
    if (!size) {
      setError("Selecione um tamanho para continuar.");
      return;
    }
    setError(null);
    setAddedToCart(true);
  }

  function handleGoToCheckout() {
    router.push(`/checkout/${product.slug}?tamanho=${size}`);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center"
      onClick={onClose}
    >
      <div
        className="theme-light w-full max-w-md rounded-t-xl bg-bg p-5 text-fg sm:rounded-xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black tracking-tight">Adicionar ao carrinho</h2>
          <button type="button" onClick={onClose} aria-label="Fechar" className="text-muted hover:text-fg">
            <CloseIcon />
          </button>
        </div>

        <div className="flex gap-4">
          <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-md border border-border bg-surface-2">
            <Image src={product.image} alt={product.name} fill className="object-cover" sizes="96px" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold">{product.name}</h3>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-lg font-black text-brand">{formatCentsToBRL(product.priceCents)}</span>
              {product.compareAtPriceCents && (
                <span className="text-xs text-muted line-through">
                  {formatCentsToBRL(product.compareAtPriceCents)}
                </span>
              )}
            </div>
            {installmentPrice && (
              <p className="text-xs text-muted">
                ou {product.installments}x de {formatCentsToBRL(installmentPrice)} no PIX
              </p>
            )}
          </div>
        </div>

        {outOfStock ? (
          <p className="mt-5 rounded-md border border-border bg-surface-2 p-3 text-center text-sm font-bold text-muted">
            Produto esgotado
          </p>
        ) : (
          <>
            <div className="mt-5">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Tamanho</p>
              <div className="flex flex-wrap gap-2">
                {PRODUCT_SIZES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setSize(s);
                      setError(null);
                      setAddedToCart(false);
                    }}
                    className={`h-10 w-14 rounded-md border text-sm font-semibold transition ${
                      size === s ? "border-brand bg-brand text-brand-fg" : "border-border bg-surface-2 text-fg"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {error && <p className="mt-2 text-sm font-medium text-danger">{error}</p>}
            </div>

            {addedToCart && (
              <p className="mt-4 flex items-center gap-2 rounded-md bg-brand/15 p-3 text-sm font-semibold text-brand">
                Produto adicionado! Continue para o checkout.
              </p>
            )}

            <Button
              type="button"
              size="lg"
              fullWidth
              className="mt-5"
              onClick={addedToCart ? handleGoToCheckout : handleAddToCart}
            >
              <BagIcon /> {addedToCart ? "Ver carrinho" : "Adicionar ao carrinho"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
