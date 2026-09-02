import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/store/ProductGrid";
import { getActiveProducts } from "@/lib/products";
import { slugifyCategory } from "@/components/store/CategoryRow";
import { getStoreSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function matchCategory(categories: string[], slug: string): string | undefined {
  return categories.find((c) => slugifyCategory(c) === slug);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const products = await getActiveProducts();
  const match = products.map((p) => matchCategory(p.categories, slug)).find(Boolean);
  return { title: match || "Categoria" };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const [products, settings] = await Promise.all([getActiveProducts(), getStoreSettings()]);
  const categoryProducts = products.filter((p) => matchCategory(p.categories, slug));

  if (categoryProducts.length === 0) {
    notFound();
  }

  const categoryName = matchCategory(categoryProducts[0].categories, slug);

  return (
    <ProductGrid
      products={categoryProducts}
      title={categoryName}
      freeShipping={settings.shippingCents === 0}
    />
  );
}
