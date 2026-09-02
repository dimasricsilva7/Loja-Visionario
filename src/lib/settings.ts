import { prisma } from "./prisma";

export const DEFAULT_STORE_SETTINGS = {
  id: "singleton",
  storeName: "Norte",
  logoUrl: null as string | null,
  heroImageUrl: null as string | null,
  marqueeLogo1Url: null as string | null,
  marqueeLogo2Url: null as string | null,
  shippingCents: 0,
  currency: "BRL",
  offerCountdownMinutes: 15,
};

export async function getStoreSettings() {
  try {
    const settings = await prisma.storeSettings.findUnique({ where: { id: "singleton" } });
    return settings ?? DEFAULT_STORE_SETTINGS;
  } catch {
    return DEFAULT_STORE_SETTINGS;
  }
}

export async function upsertStoreSettings(data: {
  storeName: string;
  logoUrl?: string | null;
  heroImageUrl?: string | null;
  marqueeLogo1Url?: string | null;
  marqueeLogo2Url?: string | null;
  shippingCents: number;
  offerCountdownMinutes: number;
}) {
  return prisma.storeSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...data },
    update: data,
  });
}
