const RESEND_API_URL = "https://api.resend.com/emails";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface SendEmailResult {
  ok: boolean;
  error?: string;
}

/**
 * Nunca lança: uma falha no envio de e-mail transacional não pode derrubar
 * a rota que o chamou (ex.: o cron de carrinho abandonado processando o
 * próximo pedido). Retorna ok:false em caso de falha, o chamador decide o resto.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    const error = "Resend não configurado (RESEND_API_KEY/RESEND_FROM_EMAIL) — e-mail não enviado";
    console.warn(error);
    return { ok: false, error };
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      const error = `Resend respondeu ${response.status}: ${detail.slice(0, 500)}`;
      console.error(error);
      return { ok: false, error };
    }

    return { ok: true };
  } catch (error) {
    console.error("Falha ao enviar e-mail via Resend", error);
    return { ok: false, error: error instanceof Error ? error.message : "erro desconhecido" };
  }
}
