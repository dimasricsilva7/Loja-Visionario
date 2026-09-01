const BASE_URL = process.env.BRAVOPAY_BASE_URL || "https://bravopay.club/api/v1";

export class BravoPayError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "BravoPayError";
    this.status = status;
  }
}

function getApiKey(): string {
  const key = process.env.BRAVOPAY_API_KEY;
  if (!key) {
    throw new Error("BRAVOPAY_API_KEY não configurada no ambiente do servidor");
  }
  return key;
}

export interface BravoPayCustomer {
  name: string;
  email: string;
  phone: string;
  cpf: string;
}

export interface BravoPayUTM {
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
  content?: string | null;
  term?: string | null;
  fbclid?: string | null;
  ttclid?: string | null;
  gclid?: string | null;
}

export interface CreatePixTransactionInput {
  amountCents: number;
  customer: BravoPayCustomer;
  externalReference: string;
  productIdBravoPay?: string | null;
  utm?: BravoPayUTM;
}

export interface BravoPayTransaction {
  id: string;
  object: string;
  status: string;
  method: string;
  amount_cents: number;
  currency: string;
  pix?: {
    copy_paste: string;
    expires_at: string;
  };
  [key: string]: unknown;
}

async function bravoPayFetch(path: string, init: RequestInit): Promise<BravoPayTransaction> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let detail = "";
    try {
      detail = await response.text();
    } catch {
      // ignore
    }
    throw new BravoPayError(
      `BravoPay respondeu ${response.status} em ${path}: ${detail.slice(0, 300)}`,
      response.status
    );
  }

  return (await response.json()) as BravoPayTransaction;
}

export async function createPixTransaction(
  input: CreatePixTransactionInput
): Promise<BravoPayTransaction> {
  const body: Record<string, unknown> = {
    amount_cents: input.amountCents,
    method: "pix",
    customer: {
      name: input.customer.name,
      email: input.customer.email,
      phone: input.customer.phone,
      cpf: input.customer.cpf,
    },
    external_reference: input.externalReference,
    utm: {
      source: input.utm?.source ?? null,
      medium: input.utm?.medium ?? null,
      campaign: input.utm?.campaign ?? null,
      content: input.utm?.content ?? null,
      term: input.utm?.term ?? null,
      fbclid: input.utm?.fbclid ?? null,
      ttclid: input.utm?.ttclid ?? null,
      gclid: input.utm?.gclid ?? null,
    },
  };

  if (input.productIdBravoPay) {
    body.product_id = input.productIdBravoPay;
  }

  return bravoPayFetch("/transactions", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getTransaction(transactionId: string): Promise<BravoPayTransaction> {
  return bravoPayFetch(`/transactions/${encodeURIComponent(transactionId)}`, {
    method: "GET",
  });
}
