import { Hero } from "@/components/store/Hero";
import { TrustBadges } from "@/components/store/TrustBadges";
import { CategoryRow } from "@/components/store/CategoryRow";
import { Testimonials } from "@/components/store/Testimonials";
import { LogoMarquee } from "@/components/store/LogoMarquee";
import { SocialProofToast } from "@/components/store/SocialProofToast";
import { getActiveProducts, getProductsGroupedByCategory } from "@/lib/products";
import { getStoreSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [groups, settings, allProducts] = await Promise.all([
    getProductsGroupedByCategory(),
    getStoreSettings(),
    getActiveProducts(),
  ]);

  return (
    <>
      <Hero storeName={settings.storeName} />
      <TrustBadges />

      <div id="produtos">
        {groups.map(({ category, products }) => (
          <CategoryRow key={category} category={category} products={products} />
        ))}
      </div>

      <LogoMarquee storeName={settings.storeName} />
      <Testimonials />

      <SocialProofToast
        products={allProducts.slice(0, 8).map((p) => ({ name: p.name, image: p.image }))}
      />
    </>
  );
}
