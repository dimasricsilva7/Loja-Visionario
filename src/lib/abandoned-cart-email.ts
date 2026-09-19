import { formatCentsToBRL } from "@/lib/money";
import { renderOrderEmailShell, firstName } from "@/lib/order-email-shell";

export interface AbandonedCartEmailData {
  customerName: string;
  orderNumber: string;
  siteUrl: string;
  productSlug: string;
  productName: string;
  productImage: string;
  size: string | null;
  quantity: number;
  totalCents: number;
  shippingCents: number;
}

export function buildAbandonedCartEmail(data: AbandonedCartEmailData): { subject: string; html: string; text: string } {
  const name = firstName(data.customerName);
  const subject = `${name}, seu pedido #${data.orderNumber} ainda está te esperando`;
  const totalCents = data.totalCents + data.shippingCents;

  // utm_source=email identifica no admin (coluna Origem) e no relatório de
  // campanhas que a compra veio da recuperação de carrinho, não de tráfego
  // pago — é assim que dá pra saber se o e-mail de remarketing converteu.
  const checkoutUrl = `${data.siteUrl}/checkout/${data.productSlug}?utm_source=email&utm_medium=remarketing&utm_campaign=carrinho_abandonado&utm_content=${encodeURIComponent(data.orderNumber)}`;

  const html = renderOrderEmailShell({
    orderNumber: data.orderNumber,
    productName: data.productName,
    productImage: data.productImage,
    size: data.size,
    quantity: data.quantity,
    totalCents: data.totalCents,
    shippingCents: data.shippingCents,
    headingEmoji: "👀",
    heading: `Você deixou algo pra trás, ${name}`,
    introHtml: `Seu pagamento do pedido <strong style="color:#ffffff;">#${data.orderNumber}</strong> ainda não foi concluído. Guardamos sua peça, mas o estoque é limitado — finalize agora antes que esgote.`,
    ctaLabel: "Finalizar minha compra",
    ctaUrl: checkoutUrl,
    footerNote: "Pagamento via PIX, aprovação na hora. Se você já concluiu esse pagamento, pode ignorar este e-mail.",
  });

  const text = `${name}, seu pedido #${data.orderNumber} ainda não foi pago.\n\n${data.productName}${data.size ? ` (Tamanho ${data.size})` : ""} x${data.quantity}\nTotal: ${formatCentsToBRL(totalCents)}\n\nFinalize sua compra: ${checkoutUrl}\n\nSe já pagou, ignore este e-mail.`;

  return { subject, html, text };
}
