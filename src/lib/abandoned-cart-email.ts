import { formatCentsToBRL } from "@/lib/money";

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

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || "";
}

/**
 * HTML de e-mail precisa de tudo inline (sem <style> externo, sem classes) —
 * a maioria dos clientes de e-mail (Gmail, Outlook) ignora ou remove isso.
 */
export function buildAbandonedCartEmail(data: AbandonedCartEmailData): { subject: string; html: string; text: string } {
  const checkoutUrl = `${data.siteUrl}/checkout/${data.productSlug}`;
  const totalCents = data.totalCents + data.shippingCents;
  const name = firstName(data.customerName);

  const subject = `${name}, seu pedido #${data.orderNumber} ainda está te esperando`;

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#141414;border-radius:16px;overflow:hidden;border:1px solid #262626;">
            <tr>
              <td style="padding:28px 32px;border-bottom:1px solid #262626;">
                <span style="font-size:14px;font-weight:800;letter-spacing:0.06em;color:#ffffff;text-transform:uppercase;">Visionário</span>
              </td>
            </tr>

            <tr>
              <td style="padding:36px 32px 8px;">
                <h1 style="margin:0;font-size:22px;line-height:1.3;font-weight:800;color:#ffffff;">
                  Você deixou algo pra trás, ${name} 👀
                </h1>
                <p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#a3a3a3;">
                  Seu pagamento do pedido <strong style="color:#ffffff;">#${data.orderNumber}</strong> ainda não foi concluído.
                  Guardamos sua peça, mas o estoque é limitado — finalize agora antes que esgote.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:24px 32px 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;border-radius:12px;border:1px solid #262626;">
                  <tr>
                    <td style="padding:20px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td width="72" style="vertical-align:top;">
                            <img
                              src="${data.productImage}"
                              alt="${data.productName}"
                              width="64"
                              height="80"
                              style="display:block;width:64px;height:80px;object-fit:cover;border-radius:8px;border:1px solid #262626;"
                            />
                          </td>
                          <td style="vertical-align:top;padding-left:14px;">
                            <p style="margin:0;font-size:15px;font-weight:700;color:#ffffff;">${data.productName}</p>
                            ${data.size ? `<p style="margin:4px 0 0;font-size:13px;color:#a3a3a3;">Tamanho: ${data.size}</p>` : ""}
                            <p style="margin:4px 0 0;font-size:13px;color:#a3a3a3;">Quantidade: ${data.quantity}</p>
                          </td>
                        </tr>
                      </table>

                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;border-top:1px solid #262626;padding-top:14px;">
                        <tr>
                          <td style="font-size:13px;color:#a3a3a3;padding:3px 0;">Produto</td>
                          <td align="right" style="font-size:13px;color:#e5e5e5;padding:3px 0;">${formatCentsToBRL(data.totalCents)}</td>
                        </tr>
                        <tr>
                          <td style="font-size:13px;color:#a3a3a3;padding:3px 0;">Frete</td>
                          <td align="right" style="font-size:13px;color:#e5e5e5;padding:3px 0;">${data.shippingCents === 0 ? "Grátis" : formatCentsToBRL(data.shippingCents)}</td>
                        </tr>
                        <tr>
                          <td style="font-size:15px;font-weight:800;color:#ffffff;padding:10px 0 0;">Total</td>
                          <td align="right" style="font-size:15px;font-weight:800;color:#1db954;padding:10px 0 0;">${formatCentsToBRL(totalCents)}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:28px 32px 8px;" align="center">
                <a
                  href="${checkoutUrl}"
                  style="display:inline-block;width:100%;box-sizing:border-box;background-color:#1db954;color:#0a0a0a;font-size:15px;font-weight:800;text-decoration:none;padding:16px 24px;border-radius:10px;text-align:center;"
                >
                  Finalizar minha compra
                </a>
              </td>
            </tr>

            <tr>
              <td style="padding:8px 32px 32px;" align="center">
                <p style="margin:0;font-size:12px;color:#737373;">
                  Pagamento via PIX, aprovação na hora. Se você já concluiu esse pagamento, pode ignorar este e-mail.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:20px 32px;border-top:1px solid #262626;" align="center">
                <p style="margin:0;font-size:11px;color:#525252;">Visionário — este é um e-mail sobre um pedido que você iniciou em nossa loja.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `${name}, seu pedido #${data.orderNumber} ainda não foi pago.\n\n${data.productName}${data.size ? ` (Tamanho ${data.size})` : ""} x${data.quantity}\nTotal: ${formatCentsToBRL(totalCents)}\n\nFinalize sua compra: ${checkoutUrl}\n\nSe já pagou, ignore este e-mail.`;

  return { subject, html, text };
}
