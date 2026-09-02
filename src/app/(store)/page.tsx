import { Hero } from "@/components/store/Hero";
import { TrustBadges } from "@/components/store/TrustBadges";
import { CategoryRow } from "@/components/store/CategoryRow";
import { Testimonials } from "@/components/store/Testimonials";
import { LogoMarquee } from "@/components/store/LogoMarquee";
import { SocialProofToast } from "@/components/store/SocialProofToast";
import { getActiveProducts, getProductsGroupedByCategory } from "@/lib/products";
import { getStoreSettings } from "@/lib/settings";
import { getCategorySubtitle, isCanonicalCategory } from "@/lib/categories";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [allGroups, settings, allProducts] = await Promise.all([
    getProductsGroupedByCategory(),
    getStoreSettings(),
    getActiveProducts(),
  ]);

  // Só as 6 categorias fixas aparecem como seções na home; outras
  // categorias continuam acessíveis pelo produto/checkout diretamente.
  const groups = allGroups.filter((g) => isCanonicalCategory(g.category));

  return (
    <>
      <Hero storeName={settings.storeName} heroImageUrl={settings.heroImageUrl} />
      <TrustBadges />

      <div id="produtos">
        {groups.map(({ category, products }, index) => (
          <CategoryRow
            key={category}
            category={category}
            subtitle={getCategorySubtitle(category)}
            products={products}
            tone={index % 2 === 0 ? "dark" : "gray"}
            freeShipping={settings.shippingCents === 0}
          />
        ))}
      </div>

      <LogoMarquee
        storeName={settings.storeName}
        logo1Url={settings.marqueeLogo1Url}
        logo2Url={settings.marqueeLogo2Url}
      />
      <Testimonials />

      <SocialProofToast
        products={allProducts.slice(0, 8).map((p) => ({ name: p.name, image: p.image }))}
      />
    </>
  );
}
