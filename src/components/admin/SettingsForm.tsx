"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

interface Props {
  initial: { storeName: string; logoUrl: string | null; offerCountdownMinutes: number };
}

export function SettingsForm({ initial }: Props) {
  const router = useRouter();
  const [storeName, setStoreName] = useState(initial.storeName);
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl ?? "");
  const [minutes, setMinutes] = useState(String(initial.offerCountdownMinutes));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName: storeName.trim(),
          logoUrl: logoUrl.trim() || null,
          offerCountdownMinutes: parseInt(minutes || "15", 10),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Não foi possível salvar.");
        return;
      }

      setSaved(true);
      router.refresh();
    } catch {
      setError("Falha de conexão.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-4 rounded-lg border border-border bg-surface p-5">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-muted">Nome da loja</span>
        <input className="input" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-muted">URL do logo (opcional)</span>
        <input className="input" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-muted">Duração da oferta (minutos)</span>
        <input
          type="number"
          min={1}
          max={120}
          className="input"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
        />
      </label>

      {error && <p className="text-sm font-medium text-danger">{error}</p>}
      {saved && <p className="text-sm font-medium text-success">Configurações salvas.</p>}

      <Button type="submit" disabled={saving} className="w-fit">
        {saving ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
