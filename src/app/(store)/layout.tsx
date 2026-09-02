import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";
import { BottomNav } from "@/components/store/BottomNav";
import { getStoreSettings } from "@/lib/settings";
import { getCustomerSession } from "@/lib/customer-session";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [settings, customerSession] = await Promise.all([getStoreSettings(), getCustomerSession()]);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header storeName={settings.storeName} logoUrl={settings.logoUrl} />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <Footer storeName={settings.storeName} logoUrl={settings.logoUrl} />
      <BottomNav loggedIn={Boolean(customerSession)} />
    </div>
  );
}
