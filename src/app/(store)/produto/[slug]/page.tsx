import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getProductBySlug } from "@/lib/products";
import { discountPercent, formatCentsToBRL } from "@/lib/money";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  return {
    title: product.name,
    description: product.description.slice(0, 155),
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 155),
      images: [{ url: product.image }],
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product || !product.active) {
    notFound();
  }

  const discount = discountPercent(product.priceCents, product.compareAtPriceCents);
  const gallery = [product.image, ...product.images].filter(Boolean);
  const outOfStock = product.stock <= 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: gallery,
    offers: {
      "@type": "Offer",
      priceCurrency: "BRL",
      price: (product.priceCents / 100).toFixed(2),
      availability: outOfStock
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
    },
  };

  return (
    <div className="container-page py-8 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg border border-border bg-surface-2">
            <Image src={gallery[0]} alt={product.name} fill className="object-cover" priority sizes="(max-width: 1024px) 100vw, 50vw" />
          </div>
          {gallery.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {gallery.slice(1, 5).map((src, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-md border border-border bg-surface-2">
                  <Image src={src} alt={`${product.name} ${i + 2}`} fill className="object-cover" sizes="120px" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {product.badge && <Badge label={product.badge} color={product.badgeColor} />}
            {discount && <Badge label={`-${discount}% OFF`} color="#ff5c5c" />}
          </div>

          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{product.name}</h1>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black">{formatCentsToBRL(product.priceCents)}</span>
            {product.compareAtPriceCents && (
              <span className="text-base text-muted line-through">
                {formatCentsToBRL(product.compareAtPriceCents)}
              </span>
            )}
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">
            à vista no PIX, aprovação imediata
          </p>

          <p className="whitespace-pre-line text-sm leading-relaxed text-muted">{product.description}</p>

          <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
            {outOfStock ? (
              <span className="rounded-md border border-border bg-surface-2 py-3 text-center text-sm font-bold text-muted">
                Produto esgotado
              </span>
            ) : (
              <ButtonLink href={`/checkout/${product.slug}`} size="lg" fullWidth>
                Comprar agora
              </ButtonLink>
            )}
            <div className="flex items-center gap-2 text-xs text-muted">
              <span>🔒</span>
              <span>Pagamento processado com segurança via PIX</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
