import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth-admin";
import { getStoreSettings, upsertStoreSettings } from "@/lib/settings";

const settingsSchema = z.object({
  storeName: z.string().trim().min(2).max(80),
  logoUrl: z.string().trim().url().nullable().optional(),
  heroImageUrl: z.string().trim().url().nullable().optional(),
  marqueeLogo1Url: z.string().trim().url().nullable().optional(),
  marqueeLogo2Url: z.string().trim().url().nullable().optional(),
  shippingCents: z.number().int().min(0).max(100000),
  offerCountdownMinutes: z.number().int().min(1).max(120),
});

export async function GET() {
  const { response } = await requireAdminApi();
  if (response) return response;

  const settings = await getStoreSettings();
  return NextResponse.json({ settings });
}

export async function PUT(request: NextRequest) {
  const { response } = await requireAdminApi();
  if (response) return response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", issues: parsed.error.flatten() }, { status: 400 });
  }

  const settings = await upsertStoreSettings(parsed.data);

  // O layout da loja e o layout raiz (titulo/metadados) leem essas
  // configuracoes; sem isso o cache de navegacao do Next pode continuar
  // servindo a versao antiga em paginas ja visitadas.
  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");

  return NextResponse.json({ settings });
}
