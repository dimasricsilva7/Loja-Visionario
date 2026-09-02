"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatCentsToBRL } from "@/lib/money";
import { PRODUCT_SIZES, type ProductSize } from "@/lib/br-validators";
import { CloseIcon, BagIcon, CheckCircleIcon } from "@/components/icons";

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
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  const installmentPrice =
    product.installments > 1 ? Math.ceil(product.priceCents / product.installments) : null;
  const outOfStock = product.stock <= 0;
  const maxQuantity = Math.max(1, Math.min(10, product.stock));

  function handleAddToCart() {
    if (!size) return;
    setAddedToCart(true);
  }

  function handleGoToCheckout() {
    router.push(`/checkout/${product.slug}?tamanho=${size}&qtd=${quantity}`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-xl border border-border bg-surface p-5 text-fg sm:rounded-xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black tracking-tight">Adicionar ao Carrinho</h2>
          <button type="button" onClick={onClose} aria-label="Fechar" className="text-muted hover:text-fg">
            <CloseIcon />
          </button>
        </div>

        <div className="flex gap-4">
          <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-md border border-border bg-surface-2">
            <Image src={product.image} alt={product.name} fill className="object-cover" sizes="96px" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold">{product.name}</h3>
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
              <p className="mb-2 text-sm font-bold">
                Tamanho <span className="text-danger">*</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {PRODUCT_SIZES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setSize(s);
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
            </div>

            <div className="mt-5">
              <p className="mb-2 text-sm font-bold">Quantidade</p>
              <div className="flex w-fit items-center gap-3 rounded-md border border-border bg-surface-2 px-3 py-1.5">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex h-6 w-6 items-center justify-center text-lg text-fg disabled:opacity-40"
                  disabled={quantity <= 1}
                  aria-label="Diminuir quantidade"
                >
                  −
                </button>
                <span className="w-5 text-center text-sm font-semibold">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                  className="flex h-6 w-6 items-center justify-center text-lg text-fg disabled:opacity-40"
                  disabled={quantity >= maxQuantity}
                  aria-label="Aumentar quantidade"
                >
                  +
                </button>
              </div>
            </div>

            {!size && !addedToCart && (
              <p className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-warning">
                <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                Selecione um tamanho para continuar
              </p>
            )}

            {addedToCart && (
              <p className="mt-4 flex items-center gap-2 rounded-md bg-brand/15 p-3 text-sm font-semibold text-brand">
                <CheckCircleIcon className="h-4 w-4 shrink-0" /> Produto adicionado! O que deseja fazer agora?
              </p>
            )}

            <button
              type="button"
              disabled={!size && !addedToCart}
              onClick={addedToCart ? handleGoToCheckout : handleAddToCart}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-brand py-3 text-sm font-bold text-brand-fg transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              <BagIcon /> {addedToCart ? "Ver carrinho" : "Adicionar ao Carrinho"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
