import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckoutClient } from "@/components/store/CheckoutClient";
import { OfferBar } from "@/components/store/OfferBar";
import { getProductBySlug } from "@/lib/products";
import { getStoreSettings } from "@/lib/settings";
import { PRODUCT_SIZES } from "@/lib/br-validators";

export const metadata: Metadata = {
  title: "Finalizar compra",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tamanho?: string; qtd?: string }>;
}

export default async function CheckoutPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { tamanho, qtd } = await searchParams;
  const [product, settings] = await Promise.all([getProductBySlug(slug), getStoreSettings()]);

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

  const initialSize = PRODUCT_SIZES.includes(tamanho as (typeof PRODUCT_SIZES)[number])
    ? (tamanho as (typeof PRODUCT_SIZES)[number])
    : undefined;
  const parsedQtd = parseInt(qtd || "1", 10);
  const initialQuantity = Number.isFinite(parsedQtd) ? Math.max(1, Math.min(10, parsedQtd, product.stock)) : 1;

  return (
    <>
      <OfferBar minutes={settings.offerCountdownMinutes} />
      <CheckoutClient
        initialSize={initialSize}
        initialQuantity={initialQuantity}
        shippingCents={settings.shippingCents}
        product={{
          id: product.id,
          slug: product.slug,
          name: product.name,
          image: product.image,
          priceCents: product.priceCents,
          compareAtPriceCents: product.compareAtPriceCents,
          installments: product.installments,
        }}
      />
    </>
  );
}
