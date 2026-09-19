"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";

type Template = "abandoned" | "confirmed";

export function TestEmailCard() {
  const [email, setEmail] = useState("");
  const [template, setTemplate] = useState<Template>("abandoned");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: email, template }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Falha ao enviar" });
        return;
      }
      setMessage({ type: "success", text: `E-mail de teste enviado pra ${email}.` });
    } catch {
      setMessage({ type: "error", text: "Falha de conexão." });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-xl rounded-lg border border-border bg-surface p-5">
      <h2 className="text-sm font-bold">Testar e-mails transacionais</h2>
      <p className="mt-1 text-xs text-muted">
        Envia o template com um produto real e um pedido fictício, só pra conferir a aparência.
      </p>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => setTemplate("abandoned")}
          className={`flex-1 rounded-md border px-3 py-2 text-xs font-semibold transition ${
            template === "abandoned" ? "border-brand bg-brand text-brand-fg" : "border-border bg-surface-2 text-muted"
          }`}
        >
          Carrinho abandonado
        </button>
        <button
          type="button"
          onClick={() => setTemplate("confirmed")}
          className={`flex-1 rounded-md border px-3 py-2 text-xs font-semibold transition ${
            template === "confirmed" ? "border-brand bg-brand text-brand-fg" : "border-border bg-surface-2 text-muted"
          }`}
        >
          Compra aprovada
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          required
          className="input flex-1"
          placeholder="seuemail@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" disabled={sending} size="md">
          {sending ? "Enviando…" : "Enviar teste"}
        </Button>
      </form>
      {message && (
        <p className={`mt-3 text-sm ${message.type === "success" ? "text-brand" : "text-danger"}`}>{message.text}</p>
      )}
    </div>
  );
}
