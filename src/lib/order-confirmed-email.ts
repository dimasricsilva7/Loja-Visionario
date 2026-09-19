import { formatCentsToBRL } from "@/lib/money";
import { renderOrderEmailShell, firstName } from "@/lib/order-email-shell";

export interface OrderConfirmedEmailData {
  customerName: string;
  orderNumber: string;
  siteUrl: string;
  productName: string;
  productImage: string;
  size: string | null;
  quantity: number;
  totalCents: number;
  shippingCents: number;
}

export function buildOrderConfirmedEmail(data: OrderConfirmedEmailData): { subject: string; html: string; text: string } {
  const name = firstName(data.customerName);
  const subject = `Pagamento aprovado — pedido #${data.orderNumber}`;
  const totalCents = data.totalCents + data.shippingCents;
  const trackingUrl = `${data.siteUrl}/rastreio?codigo=${encodeURIComponent(data.orderNumber)}`;

  const html = renderOrderEmailShell({
    orderNumber: data.orderNumber,
    productName: data.productName,
    productImage: data.productImage,
    size: data.size,
    quantity: data.quantity,
    totalCents: data.totalCents,
    shippingCents: data.shippingCents,
    headingEmoji: "🎉",
    heading: `Pagamento aprovado, ${name}!`,
    introHtml: `Recebemos a confirmação do pagamento do seu pedido <strong style="color:#ffffff;">#${data.orderNumber}</strong>. Já estamos preparando tudo pra enviar.`,
    ctaLabel: "Acompanhar meu pedido",
    ctaUrl: trackingUrl,
    footerNote: "Guarde este e-mail — o código do pedido é a forma mais rápida de rastrear sua entrega.",
  });

  const text = `Pagamento aprovado, ${name}!\n\nPedido #${data.orderNumber}\n${data.productName}${data.size ? ` (Tamanho ${data.size})` : ""} x${data.quantity}\nTotal: ${formatCentsToBRL(totalCents)}\n\nAcompanhe seu pedido: ${trackingUrl}`;

  return { subject, html, text };
}
