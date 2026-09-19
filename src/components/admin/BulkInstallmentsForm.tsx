"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";

type Mode = "enable" | "disable";

export function BulkInstallmentsForm({ categories }: { categories: string[] }) {
  const [category, setCategory] = useState(categories[0] ?? "");
  const [mode, setMode] = useState<Mode>("enable");
  const [installments, setInstallments] = useState("3");
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

    if (mode === "enable") {
      const n = Number(installments);
      if (!Number.isInteger(n) || n < 2 || n > 24) {
        setMessage({ type: "error", text: "Informe um número de parcelas entre 2 e 24." });
        return;
      }
      if (!confirm(`Ativar parcelamento em até ${n}x no PIX pra todos os produtos da categoria "${category}"?`)) return;
      body = { category, mode: "enable", installments: n };
    } else {
      if (!confirm(`Remover o parcelamento (voltar pra à vista) de todos os produtos da categoria "${category}"?`)) return;
      body = { category, mode: "disable" };
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/products/bulk-installments", {
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
              { key: "enable", label: "Ativar parcelamento" },
              { key: "disable", label: "Remover parcelamento" },
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

      {mode === "enable" && (
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Número de parcelas</span>
          <input
            className="input"
            inputMode="numeric"
            value={installments}
            onChange={(e) => setInstallments(e.target.value)}
            placeholder="3"
          />
          <span className="text-xs text-muted">
            O valor de cada parcela é calculado automaticamente no checkout (preço ÷ parcelas).
          </span>
        </label>
      )}

      {mode === "disable" && (
        <p className="text-xs text-muted">
          Os produtos da categoria voltam a aceitar só pagamento à vista no PIX.
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
