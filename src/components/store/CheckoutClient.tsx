"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/Button";
import { formatCentsToBRL } from "@/lib/money";
import {
  formatBRPhone,
  formatCEP,
  formatCPF,
  isValidBRPhone,
  isValidCEP,
  isValidCPF,
  onlyDigits,
  PRODUCT_SIZES,
  type ProductSize,
} from "@/lib/br-validators";
import { getStoredUTM } from "@/lib/utm";
import { getOrCreateSessionEventId, trackPixelEvent } from "@/lib/meta-pixel-client";
import { CheckCircleIcon, LockIcon, TruckIcon } from "@/components/icons";

interface CheckoutProduct {
  id: string;
  slug: string;
  name: string;
  image: string;
  priceCents: number;
  compareAtPriceCents: number | null;
  installments: number;
}

type Step = "dados" | "frete" | "pagamento";
type OrderStatus = "PENDING" | "PAID" | "EXPIRED" | "REFUNDED" | "FAILED" | "CANCELED";
type PaymentPlan = "AVISTA" | "PARCELADO";

interface PaymentState {
  orderId: string;
  orderNumber: string | null;
  status: OrderStatus;
  amountCents: number;
  installmentCount: number;
  pix: { copyPaste: string; expiresAt: string };
}

const POLL_INTERVAL_MS = 3000;
const TERMINAL: OrderStatus[] = ["PAID", "EXPIRED", "REFUNDED", "FAILED", "CANCELED"];

const STEPS: { key: Step; label: string }[] = [
  { key: "dados", label: "Seus dados" },
  { key: "frete", label: "Entrega" },
  { key: "pagamento", label: "Pagamento" },
];

export function CheckoutClient({
  product,
  initialSize,
  initialQuantity = 1,
  shippingCents,
}: {
  product: CheckoutProduct;
  initialSize?: ProductSize;
  initialQuantity?: number;
  shippingCents: number;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("dados");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [size, setSize] = useState<ProductSize | "">(initialSize || "");
  const [quantity] = useState(initialQuantity);
  const [paymentPlan, setPaymentPlan] = useState<PaymentPlan>("AVISTA");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");

  const [cep, setCep] = useState("");
  const [address, setAddress] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [cepLoading, setCepLoading] = useState(false);

  const [payment, setPayment] = useState<PaymentState | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [checkingAccount, setCheckingAccount] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [accountPromptDismissed, setAccountPromptDismissed] = useState(false);
  const checkoutPath = `/checkout/${product.slug}${size ? `?tamanho=${size}` : ""}`;

  const metaEventIdRef = useRef("");

  useEffect(() => {
    // Um único InitiateCheckout por sessão de checkout deste produto: o mesmo
    // eventId é reenviado pelo servidor (Conversions API) ao confirmar o
    // pedido, para a Meta deduplicar os dois sinais em um só evento.
    const eventId = getOrCreateSessionEventId(`lv_ic_${product.slug}`);
    metaEventIdRef.current = eventId;
    trackPixelEvent(
      "InitiateCheckout",
      {
        value: (product.priceCents * quantity + shippingCents) / 100,
        currency: "BRL",
        content_ids: [product.id],
        content_type: "product",
        contents: [{ id: product.id, quantity, item_price: product.priceCents / 100 }],
        num_items: quantity,
      },
      eventId
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.customer) {
          setLoggedIn(true);
          setName(data.customer.name || "");
          setEmail(data.customer.email || "");
          setPhone(data.customer.phone || "");
          setCpf(data.customer.cpf || "");
          if (data.customer.cep) setCep(data.customer.cep);
          if (data.customer.address) setAddress(data.customer.address);
          if (data.customer.number) setNumber(data.customer.number);
          if (data.customer.complement) setComplement(data.customer.complement);
          if (data.customer.neighborhood) setNeighborhood(data.customer.neighborhood);
          if (data.customer.city) setCity(data.customer.city);
          if (data.customer.state) setState(data.customer.state);
        }
      })
      .catch(() => {})
      .finally(() => setCheckingAccount(false));
  }, []);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    if (step !== "pagamento" || !payment) return;
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

  async function handleCepBlur() {
    const digits = onlyDigits(cep);
    if (digits.length !== 8) return;
    setCepLoading(true);
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
      // ViaCEP indisponível — usuário preenche manualmente
    } finally {
      setCepLoading(false);
    }
  }

  function handleContinueToShipping(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!size) return setError("Selecione um tamanho.");
    if (name.trim().length < 3) return setError("Informe seu nome completo.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Informe um e-mail válido.");
    if (!isValidBRPhone(phone)) return setError("Informe um telefone válido com DDD.");
    if (!isValidCPF(cpf)) return setError("Informe um CPF válido.");
    if (!isValidCEP(cep)) return setError("Informe um CEP válido.");
    if (!address.trim()) return setError("Informe o endereço.");
    if (!number.trim()) return setError("Informe o número.");
    if (!neighborhood.trim()) return setError("Informe o bairro.");
    if (!city.trim()) return setError("Informe a cidade.");
    if (state.trim().length !== 2) return setError("Informe a UF (ex: SP).");

    setStep("frete");
  }

  async function handleConfirmAndPay() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSlug: product.slug,
          size,
          quantity,
          paymentPlan,
          customer: {
            name: name.trim(),
            email: email.trim(),
            phone: onlyDigits(phone),
            cpf: onlyDigits(cpf),
          },
          shipping: {
            cep: onlyDigits(cep),
            address: address.trim(),
            number: number.trim(),
            complement: complement.trim() || undefined,
            neighborhood: neighborhood.trim(),
            city: city.trim(),
            state: state.trim(),
          },
          utm: getStoredUTM(),
          metaEventId: metaEventIdRef.current || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Não foi possível processar seu pedido.");
        return;
      }

      setPayment({
        orderId: data.orderId,
        orderNumber: data.orderNumber,
        status: data.status,
        amountCents: data.amountCents,
        installmentCount: data.installmentCount,
        pix: data.pix,
      });
      setStep("pagamento");
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

  const lineTotalCents = product.priceCents * quantity;
  const installmentAmount =
    product.installments > 1 ? Math.ceil(lineTotalCents / product.installments) : null;
  const productPortion = paymentPlan === "PARCELADO" && installmentAmount ? installmentAmount : lineTotalCents;
  const totalWithShipping = lineTotalCents + shippingCents;
  const chargeTotal = productPortion + shippingCents;

  return (
    <div className="container-page py-6 sm:py-10">
      <StepIndicator current={step} />

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="order-2 lg:order-1">
          {step === "dados" && (
            <div className="flex flex-col gap-6">
              {!checkingAccount && !loggedIn && !accountPromptDismissed && (
                <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted">Tem conta ou quer criar uma pra acompanhar seus pedidos?</p>
                  <div className="flex shrink-0 flex-wrap items-center gap-3">
                    <Link
                      href={`/conta/login?redirect=${encodeURIComponent(checkoutPath)}`}
                      className="text-sm font-semibold text-brand hover:underline"
                    >
                      Entrar
                    </Link>
                    <Link
                      href={`/conta/cadastro?redirect=${encodeURIComponent(checkoutPath)}`}
                      className="text-sm font-semibold text-brand hover:underline"
                    >
                      Criar conta
                    </Link>
                    <button
                      type="button"
                      onClick={() => setAccountPromptDismissed(true)}
                      className="text-sm text-muted hover:text-fg"
                    >
                      Continuar sem conta
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleContinueToShipping} className="flex flex-col gap-6">
                <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5 sm:p-6">
                  <h1 className="text-xl font-black tracking-tight">Tamanho</h1>
                  <div className="flex flex-wrap gap-2">
                    {PRODUCT_SIZES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSize(s)}
                        className={`h-10 w-14 rounded-md border text-sm font-semibold transition ${
                          size === s ? "border-brand bg-brand text-brand-fg" : "border-border bg-surface-2 text-fg"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  {installmentAmount && (
                    <div>
                      <p className="mb-2 text-sm font-semibold text-muted">Forma de pagamento no PIX</p>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <label
                          className={`flex-1 cursor-pointer rounded-md border p-3 text-sm ${
                            paymentPlan === "AVISTA" ? "border-brand bg-surface-2" : "border-border"
                          }`}
                        >
                          <input
                            type="radio"
                            name="paymentPlan"
                            className="mr-2"
                            checked={paymentPlan === "AVISTA"}
                            onChange={() => setPaymentPlan("AVISTA")}
                          />
                          PIX à vista — {formatCentsToBRL(lineTotalCents)}
                        </label>
                        <label
                          className={`flex-1 cursor-pointer rounded-md border p-3 text-sm ${
                            paymentPlan === "PARCELADO" ? "border-brand bg-surface-2" : "border-border"
                          }`}
                        >
                          <input
                            type="radio"
                            name="paymentPlan"
                            className="mr-2"
                            checked={paymentPlan === "PARCELADO"}
                            onChange={() => setPaymentPlan("PARCELADO")}
                          />
                          PIX parcelado — {product.installments}x de {formatCentsToBRL(installmentAmount)}
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5 sm:p-6">
                  <h2 className="text-lg font-bold">Seus dados</h2>

                  <Field label="Nome completo">
                    <input required value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Seu nome completo" autoComplete="name" />
                  </Field>

                  <Field label="E-mail">
                    <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="seuemail@exemplo.com" autoComplete="email" />
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Telefone">
                      <input required value={phone} onChange={(e) => setPhone(formatBRPhone(e.target.value))} className="input" placeholder="(11) 99999-9999" inputMode="numeric" autoComplete="tel" />
                    </Field>
                    <Field label="CPF">
                      <input required value={cpf} onChange={(e) => setCpf(formatCPF(e.target.value))} className="input" placeholder="999.999.999-99" inputMode="numeric" />
                    </Field>
                  </div>
                </div>

                <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5 sm:p-6">
                  <h2 className="text-lg font-bold">Endereço de entrega</h2>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={cepLoading ? "CEP (buscando...)" : "CEP"}>
                      <input required value={cep} onChange={(e) => setCep(formatCEP(e.target.value))} onBlur={handleCepBlur} className="input" placeholder="00000-000" inputMode="numeric" />
                    </Field>
                    <Field label="Número">
                      <input required value={number} onChange={(e) => setNumber(e.target.value)} className="input" placeholder="123" />
                    </Field>
                  </div>

                  <Field label="Endereço">
                    <input required value={address} onChange={(e) => setAddress(e.target.value)} className="input" placeholder="Rua, avenida..." />
                  </Field>

                  <Field label="Complemento (opcional)">
                    <input value={complement} onChange={(e) => setComplement(e.target.value)} className="input" placeholder="Apto, bloco..." />
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-[1fr_1fr_80px]">
                    <Field label="Bairro">
                      <input required value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} className="input" />
                    </Field>
                    <Field label="Cidade">
                      <input required value={city} onChange={(e) => setCity(e.target.value)} className="input" />
                    </Field>
                    <Field label="UF">
                      <input required value={state} onChange={(e) => setState(e.target.value.toUpperCase())} className="input" maxLength={2} />
                    </Field>
                  </div>
                </div>

                {error && <p className="text-sm font-medium text-danger">{error}</p>}

                <Button type="submit" size="lg">
                  Continuar para entrega
                </Button>
              </form>
            </div>
          )}

          {step === "frete" && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5 sm:p-6">
                <h2 className="text-lg font-bold">Método de entrega</h2>
                <div className="rounded-md border border-border bg-surface-2 p-4 text-sm">
                  <p className="text-muted">Entregar em</p>
                  <p className="font-semibold">
                    {address}, {number}
                    {complement ? ` - ${complement}` : ""}
                  </p>
                  <p className="text-muted">
                    {neighborhood} — {city}/{state} · CEP {formatCEP(cep)}
                  </p>
                </div>

                <div className="flex items-center justify-between rounded-md border border-brand bg-surface-2 p-4">
                  <div className="flex items-center gap-3">
                    <TruckIcon className="text-brand" />
                    <div>
                      <p className="text-sm font-bold">Correios — SEDEX</p>
                      <p className="text-xs text-muted">Chega em até 7 dias úteis após a postagem</p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-brand">
                    {shippingCents === 0 ? "Grátis" : formatCentsToBRL(shippingCents)}
                  </span>
                </div>
              </div>

              {error && <p className="text-sm font-medium text-danger">{error}</p>}

              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={() => setStep("dados")}>
                  Voltar
                </Button>
                <Button type="button" size="lg" disabled={submitting} onClick={handleConfirmAndPay} className="flex-1">
                  {submitting ? "Gerando pagamento..." : `Continuar — Pagar ${formatCentsToBRL(chargeTotal)}`}
                </Button>
              </div>
            </div>
          )}

          {step === "pagamento" && payment && (
            <PaymentPanel payment={payment} copied={copied} onCopy={handleCopy} />
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
              {size && <p className="text-xs text-muted">Tamanho: {size}</p>}
              <p className="text-xs text-muted">Quantidade: {quantity}</p>
            </div>
          </div>

          <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Subtotal</span>
              <span>{formatCentsToBRL(lineTotalCents)}</span>
            </div>
            {product.compareAtPriceCents && (
              <div className="flex justify-between text-brand">
                <span>Desconto</span>
                <span>-{formatCentsToBRL((product.compareAtPriceCents - product.priceCents) * quantity)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted">Frete</span>
              <span>{shippingCents === 0 ? "Grátis" : formatCentsToBRL(shippingCents)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base font-black">
              <span>Total</span>
              <span>{formatCentsToBRL(totalWithShipping)}</span>
            </div>
            {paymentPlan === "PARCELADO" && installmentAmount && (
              <p className="pt-1 text-xs text-muted">
                Cobrado hoje: {formatCentsToBRL(chargeTotal)} (1ª de {product.installments} parcelas + frete)
              </p>
            )}
          </div>

          <div className="mt-4 rounded-md bg-surface-2 p-3 text-xs text-muted">
            Pagamento via PIX. Aprovação em segundos após a confirmação bancária.
          </div>
        </aside>
      </div>
    </div>
  );
}

function StepIndicator({ current }: { current: Step }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);

  return (
    <div className="mb-6 flex items-center justify-center gap-3">
      {STEPS.map((s, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <div key={s.key} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  done ? "bg-brand text-brand-fg" : active ? "border-2 border-brand text-brand" : "border border-border text-muted"
                }`}
              >
                {done ? <CheckCircleIcon className="h-4 w-4" /> : i + 1}
              </span>
              <span className={`hidden text-xs font-semibold sm:inline ${active ? "text-fg" : "text-muted"}`}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && <span className="h-px w-6 bg-border sm:w-10" />}
          </div>
        );
      })}
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

  const steps = [
    "Abra o aplicativo do seu banco",
    "Escolha pagar via PIX",
    "Escaneie o QR Code ou use a opção “PIX Copia e Cola”",
    "Confira o valor e confirme o pagamento",
  ];

  return (
    <div className="flex flex-col items-center gap-5 rounded-lg border border-border bg-surface p-5 text-center sm:p-8">
      <h1 className="text-xl font-black tracking-tight">Pague com PIX para confirmar</h1>
      <p className="text-sm text-muted">
        {payment.installmentCount > 1
          ? `1ª de ${payment.installmentCount} parcelas — ${formatCentsToBRL(payment.amountCents)}`
          : formatCentsToBRL(payment.amountCents)}
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

      <div className="w-full rounded-lg border border-border bg-surface-2 p-4 text-left">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Como pagar</p>
        <ol className="flex flex-col gap-2 text-sm">
          {steps.map((s, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-brand-fg">
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>
      </div>

      <div className="flex items-center gap-2 text-sm font-semibold text-muted">
        <span className="h-2 w-2 animate-pulse-soft rounded-full bg-brand" />
        Aguardando confirmação do pagamento...
      </div>

      <div className="flex w-full items-center gap-2 rounded-md bg-surface-2 p-3 text-xs text-muted">
        <LockIcon className="shrink-0" />
        Pagamento processado com segurança. Assim que identificarmos a confirmação, você será
        redirecionado automaticamente.
      </div>
    </div>
  );
}
