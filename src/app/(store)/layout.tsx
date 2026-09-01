import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";
import { getStoreSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const settings = await getStoreSettings();

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header storeName={settings.storeName} />
      <main className="flex-1">{children}</main>
      <Footer storeName={settings.storeName} />
    </div>
  );
}
