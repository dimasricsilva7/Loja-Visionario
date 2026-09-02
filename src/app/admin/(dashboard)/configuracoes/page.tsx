import type { Metadata } from "next";
import { getStoreSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const metadata: Metadata = { title: "Configurações" };

export default async function AdminSettingsPage() {
  const settings = await getStoreSettings();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-black tracking-tight">Configurações</h1>
      <SettingsForm
        initial={{
          storeName: settings.storeName,
          logoUrl: settings.logoUrl,
          heroImageUrl: settings.heroImageUrl,
          offerCountdownMinutes: settings.offerCountdownMinutes,
        }}
      />
    </div>
  );
}
