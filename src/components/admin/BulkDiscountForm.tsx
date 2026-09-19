"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";

type Mode = "percent" | "fixed" | "remove";

function toCents(value: string): number | null {
  if (!value.trim()) return null;
  const num = Number(value.replace(",", "."));
  if (Number.isNaN(num) || num <= 0) return null;
  return Math.round(num * 100);
}

export function BulkDiscountForm({ categories }: { categories: string[] }) {
  const [category, setCategory] = useState(categories[0] ?? "");
  const [mode, setMode] = useState<Mode>("percent");
  const [percent, setPercent] = useState("20");
  const [priceReais, setPriceReais] = useState("");
  const [compareAtReais, setCompareAtReais] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (!category) {
      setMessage({ type: "error", text: "Escolha uma categoria." });
      return;
    }

    let body: Record<string, unknown>;

    if (mode === "percent") {
      const pct = Number(percent.replace(",", "."));
      if (!pct || pct <= 0 || pct >= 100) {
        setMessage({ type: "error", text: "Informe um percentual entre 1 e 99." });
        return;
      }
      if (!confirm(`Aplicar ${pct}% de desconto em todos os produtos da categoria "${category}"?`)) return;
      body = { category, mode: "percent", percent: pct };
    } else if (mode === "fixed") {
      const priceCents = toCents(priceReais);
      if (!priceCents) {
        setMessage({ type: "error", text: "Informe o novo preço (\"por\")." });
        return;
      }
      const compareAtPriceCents = compareAtReais.trim() ? toCents(compareAtReais) : null;
      if (!confirm(`Definir todos os produtos da categoria "${category}" com o mesmo preço?`)) return;
      body = { category, mode: "fixed", priceCents, compareAtPriceCents };
    } else {
      if (!confirm(`Remover o desconto de todos os produtos da categoria "${category}"?`)) return;
      body = { category, mode: "remove" };
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/products/bulk-discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Não foi possível aplicar." });
        return;
      }
      setMessage({ type: "success", text: `${data.updated} produto(s) atualizado(s).` });
    } catch {
      setMessage({ type: "error", text: "Falha de conexão. Tente novamente." });
    } finally {
      setSaving(false);
    }
  }

  if (categories.length === 0) {
    return <p className="text-sm text-muted">Cadastre produtos com categoria antes de usar essa ferramenta.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-5 rounded-lg border border-border bg-surface p-5">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Categoria</span>
        <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">O que fazer</span>
        <div className="flex flex-col gap-2 sm:flex-row">
          {(
            [
              { key: "percent", label: "Desconto percentual" },
              { key: "fixed", label: "Preço fixo (de/por)" },
              { key: "remove", label: "Remover desconto" },
            ] as { key: Mode; label: string }[]
          ).map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setMode(opt.key)}
              className={`flex-1 rounded-md border px-3 py-2 text-xs font-semibold transition ${
                mode === opt.key
                  ? "border-brand bg-brand text-brand-fg"
                  : "border-border bg-surface-2 text-muted hover:text-fg"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {mode === "percent" && (
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Percentual de desconto</span>
          <div className="relative">
            <input
              className="input pr-8"
              inputMode="decimal"
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              placeholder="20"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">%</span>
          </div>
          <span className="text-xs text-muted">
            Calcula em cima do preço atual de cada produto e guarda o preço original como o &quot;de&quot; riscado.
          </span>
        </label>
      )}

      {mode === "fixed" && (
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">De (opcional)</span>
            <input
              className="input"
              inputMode="decimal"
              placeholder="199,90"
              value={compareAtReais}
              onChange={(e) => setCompareAtReais(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Por</span>
            <input
              className="input"
              inputMode="decimal"
              placeholder="99,90"
              value={priceReais}
              onChange={(e) => setPriceReais(e.target.value)}
            />
          </label>
          <p className="col-span-2 text-xs text-muted">
            Define o mesmo preço pra todos os produtos da categoria, independente do preço atual de cada um.
          </p>
        </div>
      )}

      {mode === "remove" && (
        <p className="text-xs text-muted">
          Volta cada produto da categoria pro preço original (o valor que estava riscado como &quot;de&quot;).
        </p>
      )}

      {message && (
        <p className={`text-sm ${message.type === "success" ? "text-brand" : "text-danger"}`}>{message.text}</p>
      )}

      <Button type="submit" disabled={saving}>
        {saving ? "Aplicando…" : "Aplicar"}
      </Button>
    </form>
  );
}
