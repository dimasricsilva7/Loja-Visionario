"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { CANONICAL_CATEGORIES } from "@/lib/categories";

export interface ProductFormValues {
  id?: string;
  name: string;
  slug: string;
  description: string;
  price: string; // em reais, ex: "99.90"
  compareAtPrice: string;
  image: string;
  images: string; // uma URL por linha
  badge: string;
  badgeColor: string;
  stock: string;
  active: boolean;
  featured: boolean;
  sortOrder: string;
  categories: string[];
  installments: string;
  productIdBravoPay: string;
  relatedProductIds: string[];
}

const emptyValues: ProductFormValues = {
  name: "",
  slug: "",
  description: "",
  price: "",
  compareAtPrice: "",
  image: "",
  images: "",
  badge: "",
  badgeColor: "#1db954",
  stock: "0",
  active: true,
  featured: false,
  sortOrder: "0",
  categories: [],
  installments: "1",
  productIdBravoPay: "",
  relatedProductIds: [],
};

function toCents(value: string): number | null {
  if (!value.trim()) return null;
  const num = Number(value.replace(",", "."));
  if (Number.isNaN(num) || num <= 0) return null;
  return Math.round(num * 100);
}

interface ProductSummary {
  id: string;
  name: string;
  image: string;
}

export function ProductForm({ initial }: { initial?: Partial<ProductFormValues> }) {
  const router = useRouter();
  const [values, setValues] = useState<ProductFormValues>({ ...emptyValues, ...initial });
  const canonicalNames = CANONICAL_CATEGORIES.map((c) => c.name);
  const [customCategoriesText, setCustomCategoriesText] = useState(
    (initial?.categories ?? []).filter((c) => !canonicalNames.includes(c)).join(", ")
  );
  const [allProducts, setAllProducts] = useState<ProductSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/products")
      .then((res) => res.json())
      .then((data) => setAllProducts(data.products || []))
      .catch(() => setAllProducts([]));
  }, []);

  function set<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function toggleCategory(name: string) {
    setValues((v) => {
      const already = v.categories.includes(name);
      return { ...v, categories: already ? v.categories.filter((c) => c !== name) : [...v.categories, name] };
    });
  }

  function toggleRelated(id: string) {
    setValues((v) => {
      const already = v.relatedProductIds.includes(id);
      if (already) return { ...v, relatedProductIds: v.relatedProductIds.filter((r) => r !== id) };
      if (v.relatedProductIds.length >= 4) return v;
      return { ...v, relatedProductIds: [...v.relatedProductIds, id] };
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const priceCents = toCents(values.price);
    if (!priceCents) return setError("Informe um preço válido.");
    const compareAtPriceCents = values.compareAtPrice ? toCents(values.compareAtPrice) : null;

    if (!values.image.trim()) return setError("Informe a URL da imagem principal.");
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(values.slug)) {
      return setError("Slug deve conter apenas letras minúsculas, números e hífens.");
    }

    const customCategories = customCategoriesText
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    const finalCategories = Array.from(new Set([...values.categories, ...customCategories]));
    if (finalCategories.length === 0) return setError("Selecione pelo menos uma categoria.");

    setSaving(true);
    try {
      const payload = {
        name: values.name.trim(),
        slug: values.slug.trim(),
        description: values.description.trim(),
        priceCents,
        compareAtPriceCents,
        image: values.image.trim(),
        images: values.images
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        badge: values.badge.trim() || null,
        badgeColor: values.badgeColor || null,
        stock: parseInt(values.stock || "0", 10),
        active: values.active,
        featured: values.featured,
        sortOrder: parseInt(values.sortOrder || "0", 10),
        categories: finalCategories,
        installments: Math.max(1, parseInt(values.installments || "1", 10)),
        productIdBravoPay: values.productIdBravoPay.trim() || null,
        relatedProductIds: values.relatedProductIds,
      };

      const url = values.id ? `/api/admin/products/${values.id}` : "/api/admin/products";
      const method = values.id ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Não foi possível salvar o produto.");
        return;
      }

      router.push("/admin/produtos");
      router.refresh();
    } catch {
      setError("Falha de conexão.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-4">
      <Row label="Nome">
        <input required className="input" value={values.name} onChange={(e) => set("name", e.target.value)} />
      </Row>

      <Row label="Slug (URL)">
        <input
          required
          className="input"
          placeholder="camiseta-oversized-preta"
          value={values.slug}
          onChange={(e) => set("slug", e.target.value.toLowerCase())}
        />
      </Row>

      <Row label="Descrição">
        <textarea
          required
          className="input h-28 py-2"
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </Row>

      <div className="grid grid-cols-2 gap-4">
        <Row label="Preço (R$)">
          <input
            required
            inputMode="decimal"
            className="input"
            placeholder="99.90"
            value={values.price}
            onChange={(e) => set("price", e.target.value)}
          />
        </Row>
        <Row label="Preço antigo (R$)">
          <input
            inputMode="decimal"
            className="input"
            placeholder="opcional"
            value={values.compareAtPrice}
            onChange={(e) => set("compareAtPrice", e.target.value)}
          />
        </Row>
      </div>

      <Row label="Imagem principal (URL)">
        <input required className="input" value={values.image} onChange={(e) => set("image", e.target.value)} />
      </Row>

      <Row label="Imagens adicionais (uma URL por linha)">
        <textarea className="input h-20 py-2" value={values.images} onChange={(e) => set("images", e.target.value)} />
      </Row>

      <div className="grid grid-cols-2 gap-4">
        <Row label="Texto do badge">
          <input className="input" placeholder="NOVO" value={values.badge} onChange={(e) => set("badge", e.target.value)} />
        </Row>
        <Row label="Cor do badge">
          <input type="color" className="input h-11 p-1" value={values.badgeColor} onChange={(e) => set("badgeColor", e.target.value)} />
        </Row>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-muted">
          Categorias (o produto pode aparecer em mais de uma seção da home)
        </p>
        <div className="flex flex-wrap gap-2">
          {CANONICAL_CATEGORIES.map((c) => (
            <label
              key={c.name}
              className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                values.categories.includes(c.name)
                  ? "border-brand bg-brand text-brand-fg"
                  : "border-border text-muted hover:text-fg"
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={values.categories.includes(c.name)}
                onChange={() => toggleCategory(c.name)}
              />
              {c.name}
            </label>
          ))}
        </div>
        <input
          className="input mt-1"
          placeholder="Outras categorias, separadas por vírgula (opcional)"
          value={customCategoriesText}
          onChange={(e) => setCustomCategoriesText(e.target.value)}
        />
        <span className="text-xs text-muted">
          Só as 6 categorias fixas viram seção na home. Categorias personalizadas ficam acessíveis
          pelo produto, mas não ganham seção própria.
        </span>
      </div>

      <Row label="Parcelas no PIX (1 = à vista)">
        <input
          type="number"
          min={1}
          max={24}
          className="input max-w-40"
          value={values.installments}
          onChange={(e) => set("installments", e.target.value)}
        />
      </Row>

      <div className="grid grid-cols-2 gap-4">
        <Row label="Estoque">
          <input
            required
            type="number"
            min={0}
            className="input"
            value={values.stock}
            onChange={(e) => set("stock", e.target.value)}
          />
        </Row>
        <Row label="Ordem de exibição">
          <input
            type="number"
            className="input"
            value={values.sortOrder}
            onChange={(e) => set("sortOrder", e.target.value)}
          />
        </Row>
      </div>

      <Row label="ID do produto na BravoPay (opcional)">
        <input
          className="input"
          placeholder="prod_xxx"
          value={values.productIdBravoPay}
          onChange={(e) => set("productIdBravoPay", e.target.value)}
        />
      </Row>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={values.active} onChange={(e) => set("active", e.target.checked)} />
          Ativo
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={values.featured} onChange={(e) => set("featured", e.target.checked)} />
          Destaque
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-muted">
          &ldquo;Você também vai gostar&rdquo; — escolha até 4 produtos ({values.relatedProductIds.length}/4)
        </p>
        <div className="grid max-h-56 grid-cols-2 gap-2 overflow-y-auto rounded-md border border-border p-3 sm:grid-cols-3">
          {allProducts
            .filter((p) => p.id !== values.id)
            .map((p) => (
              <label key={p.id} className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={values.relatedProductIds.includes(p.id)}
                  onChange={() => toggleRelated(p.id)}
                  disabled={!values.relatedProductIds.includes(p.id) && values.relatedProductIds.length >= 4}
                />
                <span className="truncate">{p.name}</span>
              </label>
            ))}
          {allProducts.length === 0 && <p className="text-xs text-muted">Nenhum outro produto cadastrado ainda.</p>}
        </div>
      </div>

      {error && <p className="text-sm font-medium text-danger">{error}</p>}

      <Button type="submit" disabled={saving} className="mt-2 w-fit">
        {saving ? "Salvando..." : "Salvar produto"}
      </Button>
    </form>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
