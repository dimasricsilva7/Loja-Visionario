"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

interface Props {
  initial: {
    storeName: string;
    logoUrl: string | null;
    heroImageUrl: string | null;
    heroImage2Url: string | null;
    heroImage3Url: string | null;
    marqueeLogo1Url: string | null;
    marqueeLogo2Url: string | null;
    shippingCents: number;
    offerCountdownMinutes: number;
  };
}

export function SettingsForm({ initial }: Props) {
  const router = useRouter();
  const [storeName, setStoreName] = useState(initial.storeName);
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl ?? "");
  const [heroImageUrl, setHeroImageUrl] = useState(initial.heroImageUrl ?? "");
  const [heroImage2Url, setHeroImage2Url] = useState(initial.heroImage2Url ?? "");
  const [heroImage3Url, setHeroImage3Url] = useState(initial.heroImage3Url ?? "");
  const [marqueeLogo1Url, setMarqueeLogo1Url] = useState(initial.marqueeLogo1Url ?? "");
  const [marqueeLogo2Url, setMarqueeLogo2Url] = useState(initial.marqueeLogo2Url ?? "");
  const [shippingPrice, setShippingPrice] = useState((initial.shippingCents / 100).toFixed(2));
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
          heroImageUrl: heroImageUrl.trim() || null,
          heroImage2Url: heroImage2Url.trim() || null,
          heroImage3Url: heroImage3Url.trim() || null,
          marqueeLogo1Url: marqueeLogo1Url.trim() || null,
          marqueeLogo2Url: marqueeLogo2Url.trim() || null,
          shippingCents: Math.max(0, Math.round(Number(shippingPrice.replace(",", ".")) * 100) || 0),
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
        <span className="font-medium text-muted">Imagem 1 da hero (opcional)</span>
        <input
          className="input"
          value={heroImageUrl}
          onChange={(e) => setHeroImageUrl(e.target.value)}
          placeholder="https://..."
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-muted">Imagem 2 da hero (opcional)</span>
        <input
          className="input"
          value={heroImage2Url}
          onChange={(e) => setHeroImage2Url(e.target.value)}
          placeholder="https://..."
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-muted">Imagem 3 da hero (opcional)</span>
        <input
          className="input"
          value={heroImage3Url}
          onChange={(e) => setHeroImage3Url(e.target.value)}
          placeholder="https://..."
        />
        <span className="text-xs text-muted">
          Envie até 3 fotos/artes próprias — elas alternam automaticamente na hero. Com só 1
          preenchida, ela fica fixa. Vazio usa um fundo gerado automaticamente.
        </span>
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-muted">Logo 1 da barra rotativa (opcional)</span>
        <input
          className="input"
          value={marqueeLogo1Url}
          onChange={(e) => setMarqueeLogo1Url(e.target.value)}
          placeholder="https://..."
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-muted">Logo 2 da barra rotativa (opcional)</span>
        <input
          className="input"
          value={marqueeLogo2Url}
          onChange={(e) => setMarqueeLogo2Url(e.target.value)}
          placeholder="https://..."
        />
        <span className="text-xs text-muted">
          A barra que fica passando no meio da home alterna essas duas imagens. Se vazio, usa o nome da loja.
        </span>
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-muted">Valor do frete (R$)</span>
        <input
          inputMode="decimal"
          className="input"
          value={shippingPrice}
          onChange={(e) => setShippingPrice(e.target.value)}
          placeholder="0.00"
        />
        <span className="text-xs text-muted">
          Deixe 0 para frete grátis (mostra selo &ldquo;Frete grátis&rdquo; nos produtos).
        </span>
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
