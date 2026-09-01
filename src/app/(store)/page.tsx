import { Hero } from "@/components/store/Hero";
import { TrustBadges } from "@/components/store/TrustBadges";
import { ProductGrid } from "@/components/store/ProductGrid";
import { Testimonials } from "@/components/store/Testimonials";
import { OfferBar } from "@/components/store/OfferBar";
import { getActiveProducts } from "@/lib/products";
import { getStoreSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [products, settings] = await Promise.all([getActiveProducts(), getStoreSettings()]);

  return (
    <>
      <OfferBar minutes={settings.offerCountdownMinutes} />
      <Hero storeName={settings.storeName} />
      <TrustBadges />
      <ProductGrid products={products} title="Coleção completa" />
      <Testimonials />
    </>
  );
}
