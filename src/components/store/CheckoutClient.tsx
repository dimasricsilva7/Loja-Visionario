"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/Button";
import { formatCentsToBRL } from "@/lib/money";
import { formatBRPhone, formatCPF, isValidBRPhone, isValidCPF, onlyDigits } from "@/lib/br-validators";
import { getStoredUTM } from "@/lib/utm";

interface CheckoutProduct {
  id: string;
  slug: string;
  name: string;
  image: string;
  priceCents: number;
  compareAtPriceCents: number | null;
}

type Step = "form" | "payment";
type OrderStatus = "PENDING" | "PAID" | "EXPIRED" | "REFUNDED" | "FAILED" | "CANCELED";

interface PaymentState {
  orderId: string;
  status: OrderStatus;
  pix: { copyPaste: string; expiresAt: string };
}

const POLL_INTERVAL_MS = 3000;
const TERMINAL: OrderStatus[] = ["PAID", "EXPIRED", "REFUNDED", "FAILED", "CANCELED"];

export function CheckoutClient({ product }: { product: CheckoutProduct }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");

  const [payment, setPayment] = useState<PaymentState | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    if (step !== "payment" || !payment) return;
    if (TERMINAL.includes(payment.status)) return;

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/transactions/${payment.orderId}`);
        if (!res.ok) return;
        const data = (await res.json()) as { status: OrderStatus };

        setPayment((prev) => (prev ? { ...prev, status: data.status } : prev));

        if (data.status === "PAID") {
          if (pollRef.current) clearInterval(pollRef.current);
          router.push(`/obrigado?pedido=${payment.orderId}`);
        } else if (TERMINAL.includes(data.status)) {
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        // instabilidade momentânea; tenta novamente no próximo ciclo
      }
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, payment?.orderId, payment?.status]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 3) return setError("Informe seu nome completo.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Informe um e-mail válido.");
    if (!isValidBRPhone(phone)) return setError("Informe um telefone válido com DDD.");
    if (!isValidCPF(cpf)) return setError("Informe um CPF válido.");

    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSlug: product.slug,
          customer: {
            name: name.trim(),
            email: email.trim(),
            phone: onlyDigits(phone),
            cpf: onlyDigits(cpf),
          },
          utm: getStoredUTM(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Não foi possível processar seu pedido.");
        return;
      }

      setPayment({ orderId: data.orderId, status: data.status, pix: data.pix });
      setStep("payment");
    } catch {
      setError("Falha de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopy() {
    if (!payment) return;
    try {
      await navigator.clipboard.writeText(payment.pix.copyPaste);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("Não foi possível copiar automaticamente. Selecione o código manualmente.");
    }
  }

  return (
    <div className="container-page grid gap-8 py-8 sm:py-12 lg:grid-cols-[1fr_380px]">
      <div className="order-2 lg:order-1">
        {step === "form" ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5 sm:p-6">
            <h1 className="text-xl font-black tracking-tight">Seus dados</h1>

            <Field label="Nome completo">
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="Seu nome completo"
                autoComplete="name"
              />
            </Field>

            <Field label="E-mail">
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="seuemail@exemplo.com"
                autoComplete="email"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Telefone">
                <input
                  required
                  value={phone}
                  onChange={(e) => setPhone(formatBRPhone(e.target.value))}
                  className="input"
                  placeholder="(11) 99999-9999"
                  inputMode="numeric"
                  autoComplete="tel"
                />
              </Field>

              <Field label="CPF">
                <input
                  required
                  value={cpf}
                  onChange={(e) => setCpf(formatCPF(e.target.value))}
                  className="input"
                  placeholder="999.999.999-99"
                  inputMode="numeric"
                />
              </Field>
            </div>

            {error && <p className="text-sm font-medium text-danger">{error}</p>}

            <Button type="submit" size="lg" disabled={submitting} className="mt-2">
              {submitting ? "Gerando pagamento..." : `Pagar ${formatCentsToBRL(product.priceCents)} com PIX`}
            </Button>

            <div className="flex items-center gap-2 text-xs text-muted">
              <span>🔒</span>
              <span>Seus dados estão protegidos e o pagamento é processado com segurança.</span>
            </div>
          </form>
        ) : (
          payment && <PaymentPanel payment={payment} copied={copied} onCopy={handleCopy} />
        )}
      </div>

      <aside className="order-1 h-fit rounded-lg border border-border bg-surface p-5 sm:p-6 lg:order-2">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted">Resumo do pedido</h2>
        <div className="flex gap-3">
          <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-surface-2">
            <Image src={product.image} alt={product.name} fill className="object-cover" sizes="64px" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">{product.name}</p>
            <p className="text-xs text-muted">Quantidade: 1</p>
          </div>
        </div>

        <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Subtotal</span>
            <span>{formatCentsToBRL(product.priceCents)}</span>
          </div>
          {product.compareAtPriceCents && (
            <div className="flex justify-between text-brand">
              <span>Desconto</span>
              <span>-{formatCentsToBRL(product.compareAtPriceCents - product.priceCents)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-border pt-2 text-base font-black">
            <span>Total</span>
            <span>{formatCentsToBRL(product.priceCents)}</span>
          </div>
        </div>

        <div className="mt-4 rounded-md bg-surface-2 p-3 text-xs text-muted">
          Pagamento único via PIX. Aprovação em segundos após a confirmação bancária.
        </div>
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

function PaymentPanel({
  payment,
  copied,
  onCopy,
}: {
  payment: PaymentState;
  copied: boolean;
  onCopy: () => void;
}) {
  if (payment.status === "EXPIRED" || payment.status === "FAILED" || payment.status === "CANCELED") {
    return (
      <div className="rounded-lg border border-border bg-surface p-6 text-center">
        <p className="text-lg font-bold text-danger">Pagamento não concluído</p>
        <p className="mt-2 text-sm text-muted">
          O código PIX expirou ou o pagamento não pôde ser confirmado. Volte e tente novamente.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 rounded-lg border border-border bg-surface p-5 text-center sm:p-8">
      <h1 className="text-xl font-black tracking-tight">Pague com PIX para confirmar</h1>
      <p className="text-sm text-muted">
        Abra o app do seu banco, escaneie o QR Code ou use o código copia e cola abaixo.
      </p>

      <div className="rounded-lg bg-white p-4">
        <QRCode value={payment.pix.copyPaste} size={200} />
      </div>

      <div className="w-full">
        <label className="mb-1.5 block text-left text-xs font-bold uppercase tracking-wide text-muted">
          PIX copia e cola
        </label>
        <div className="flex gap-2">
          <input
            readOnly
            value={payment.pix.copyPaste}
            className="input flex-1 truncate text-xs"
            onFocus={(e) => e.currentTarget.select()}
          />
          <Button type="button" variant="secondary" onClick={onCopy}>
            {copied ? "Copiado!" : "Copiar"}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm font-semibold text-muted">
        <span className="h-2 w-2 animate-pulse-soft rounded-full bg-brand" />
        Aguardando confirmação do pagamento...
      </div>

      <div className="w-full rounded-md bg-surface-2 p-3 text-xs text-muted">
        Pagamento processado com segurança. Assim que identificarmos a confirmação, você será
        redirecionado automaticamente.
      </div>
    </div>
  );
}
