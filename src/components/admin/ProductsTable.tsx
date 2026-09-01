"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatCentsToBRL } from "@/lib/money";

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  image: string;
  priceCents: number;
  stock: number;
  active: boolean;
  featured: boolean;
}

export function ProductsTable({ products }: { products: ProductRow[] }) {
  const router = useRouter();
  const [pendingDelete, setPendingDelete] = useState<ProductRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function toggleActive(product: ProductRow) {
    setBusyId(product.id);
    try {
      await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !product.active }),
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setBusyId(pendingDelete.id);
    try {
      await fetch(`/api/admin/products/${pendingDelete.id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusyId(null);
      setPendingDelete(null);
    }
  }

  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted">
        Nenhum produto cadastrado ainda.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <div key={product.id} className="flex gap-3 rounded-lg border border-border bg-surface p-3">
            <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-surface-2">
              <Image src={product.image} alt={product.name} fill className="object-cover" sizes="64px" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="truncate text-sm font-semibold">{product.name}</p>
              <p className="text-xs text-muted">{formatCentsToBRL(product.priceCents)} · estoque {product.stock}</p>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    product.active ? "bg-success/15 text-success" : "bg-muted/15 text-muted"
                  }`}
                >
                  {product.active ? "Ativo" : "Inativo"}
                </span>
                {product.featured && (
                  <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[11px] font-bold text-brand">
                    Destaque
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
                <Link href={`/admin/produtos/${product.id}`} className="text-brand hover:underline">
                  Editar
                </Link>
                <button
                  type="button"
                  disabled={busyId === product.id}
                  onClick={() => toggleActive(product)}
                  className="text-muted hover:text-fg disabled:opacity-50"
                >
                  {product.active ? "Desativar" : "Ativar"}
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDelete(product)}
                  className="text-danger hover:underline"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-5">
            <h3 className="text-base font-bold">Excluir &ldquo;{pendingDelete.name}&rdquo;?</h3>
            <p className="mt-2 text-sm text-muted">
              Se este produto já tiver pedidos associados, ele será apenas desativado para preservar o
              histórico.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="rounded-md border border-border px-3 py-2 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={busyId === pendingDelete.id}
                onClick={confirmDelete}
                className="rounded-md bg-danger px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
