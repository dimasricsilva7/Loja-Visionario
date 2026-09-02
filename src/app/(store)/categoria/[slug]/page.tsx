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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const products = await getActiveProducts();
  const match = products.find((p) => slugifyCategory(p.category) === slug);
  return { title: match?.category || "Categoria" };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const [products, settings] = await Promise.all([getActiveProducts(), getStoreSettings()]);
  const categoryProducts = products.filter((p) => slugifyCategory(p.category) === slug);

  if (categoryProducts.length === 0) {
    notFound();
  }

  return (
    <ProductGrid
      products={categoryProducts}
      title={categoryProducts[0].category}
      freeShipping={settings.shippingCents === 0}
    />
  );
}
