"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PRODUCT_SIZES, type ProductSize } from "@/lib/br-validators";

export function ProductBuyBox({ slug, outOfStock }: { slug: string; outOfStock: boolean }) {
  const router = useRouter();
  const [size, setSize] = useState<ProductSize | "">("");
  const [error, setError] = useState<string | null>(null);

  function handleBuy() {
    if (!size) {
      setError("Selecione um tamanho para continuar.");
      return;
    }
    router.push(`/checkout/${slug}?tamanho=${size}`);
  }

  if (outOfStock) {
    return (
      <span className="rounded-md border border-border bg-surface-2 py-3 text-center text-sm font-bold text-muted">
        Produto esgotado
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Tamanho</p>
        <div className="flex flex-wrap gap-2">
          {PRODUCT_SIZES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setSize(s);
                setError(null);
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

      {error && <p className="text-sm font-medium text-danger">{error}</p>}

      <Button type="button" size="lg" fullWidth onClick={handleBuy}>
        {size ? "Comprar agora" : "Selecione o tamanho"}
      </Button>
    </div>
  );
}
