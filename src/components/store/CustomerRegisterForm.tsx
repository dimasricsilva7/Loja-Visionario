"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatBRPhone, formatCEP, formatCPF, onlyDigits } from "@/lib/br-validators";

export function CustomerRegisterForm({ redirectTo = "/conta" }: { redirectTo?: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [cep, setCep] = useState("");
  const [address, setAddress] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCepBlur() {
    const digits = onlyDigits(cep);
    if (digits.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setAddress(data.logradouro || "");
        setNeighborhood(data.bairro || "");
        setCity(data.localidade || "");
        setState(data.uf || "");
      }
    } catch {
      // segue com preenchimento manual
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          cpf: onlyDigits(cpf),
          phone: onlyDigits(phone),
          cep: onlyDigits(cep),
          address,
          number,
          complement,
          neighborhood,
          city,
          state,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Não foi possível criar sua conta.");
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
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-lg flex-col gap-4 rounded-lg border border-border bg-surface p-6 sm:p-8">
      <h1 className="text-xl font-black tracking-tight">Criar minha conta</h1>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-muted">Nome completo</span>
        <input required className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-muted">E-mail</span>
          <input required type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-muted">Senha</span>
          <input required type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-muted">CPF</span>
          <input required className="input" value={cpf} onChange={(e) => setCpf(formatCPF(e.target.value))} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-muted">Telefone</span>
          <input required className="input" value={phone} onChange={(e) => setPhone(formatBRPhone(e.target.value))} />
        </label>
      </div>

      <p className="mt-2 text-xs font-bold uppercase tracking-wide text-muted">Endereço (opcional)</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-muted">CEP</span>
          <input className="input" value={cep} onChange={(e) => setCep(formatCEP(e.target.value))} onBlur={handleCepBlur} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-muted">Número</span>
          <input className="input" value={number} onChange={(e) => setNumber(e.target.value)} />
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-muted">Endereço</span>
        <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-muted">Complemento (opcional)</span>
        <input className="input" value={complement} onChange={(e) => setComplement(e.target.value)} />
      </label>

      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_80px]">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-muted">Bairro</span>
          <input className="input" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-muted">Cidade</span>
          <input className="input" value={city} onChange={(e) => setCity(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-muted">UF</span>
          <input className="input" maxLength={2} value={state} onChange={(e) => setState(e.target.value.toUpperCase())} />
        </label>
      </div>

      {error && <p className="text-sm font-medium text-danger">{error}</p>}

      <Button type="submit" disabled={loading} fullWidth>
        {loading ? "Criando conta..." : "Criar conta"}
      </Button>

      <p className="text-center text-sm text-muted">
        Já tem conta?{" "}
        <Link
          href={`/conta/login${redirectTo !== "/conta" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
          className="font-semibold text-brand hover:underline"
        >
          Entrar
        </Link>
      </p>
    </form>
  );
}
