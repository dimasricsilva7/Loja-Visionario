import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckoutClient } from "@/components/store/CheckoutClient";
import { getProductBySlug } from "@/lib/products";

export const metadata: Metadata = {
  title: "Finalizar compra",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CheckoutPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product || !product.active) {
    notFound();
  }

  if (product.stock <= 0) {
    return (
      <div className="container-page py-16 text-center">
        <h1 className="text-xl font-bold">Produto esgotado</h1>
        <p className="mt-2 text-sm text-muted">Este produto não está disponível no momento.</p>
      </div>
    );
  }

  return (
    <CheckoutClient
      product={{
        id: product.id,
        slug: product.slug,
        name: product.name,
        image: product.image,
        priceCents: product.priceCents,
        compareAtPriceCents: product.compareAtPriceCents,
      }}
    />
  );
}
