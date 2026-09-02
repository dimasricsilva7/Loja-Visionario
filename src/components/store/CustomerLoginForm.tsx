"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function CustomerLoginForm({ redirectTo = "/conta" }: { redirectTo?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Não foi possível entrar.");
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("Falha de conexão.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-sm flex-col gap-4 rounded-lg border border-border bg-surface p-6 sm:p-8">
      <h1 className="text-xl font-black tracking-tight">Entrar na minha conta</h1>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-muted">E-mail</span>
        <input required type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-muted">Senha</span>
        <input
          required
          type="password"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
      </label>

      {error && <p className="text-sm font-medium text-danger">{error}</p>}

      <Button type="submit" disabled={loading} fullWidth>
        {loading ? "Entrando..." : "Entrar"}
      </Button>

      <p className="text-center text-sm text-muted">
        Não tem conta?{" "}
        <Link
          href={`/conta/cadastro${redirectTo !== "/conta" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
          className="font-semibold text-brand hover:underline"
        >
          Criar conta
        </Link>
      </p>
    </form>
  );
}
