import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { ProductBuyBox } from "@/components/store/ProductBuyBox";
import { ProductCard } from "@/components/store/ProductCard";
import { ViewingNowBadge } from "@/components/store/ViewingNowBadge";
import { getCuratedRelatedProducts, getProductBySlug } from "@/lib/products";
import { discountPercent, formatCentsToBRL } from "@/lib/money";
import { getFakeRating, getRecentlySoldCount, getViewingNowCount } from "@/lib/social-proof";
import { ClockIcon, RefreshIcon, ShieldIcon, StarIcon, TruckIcon } from "@/components/icons";
import { FavoriteButton } from "@/components/store/FavoriteButton";

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
  const installmentAmount =
    product.installments > 1 ? Math.ceil(product.priceCents / product.installments) : null;

  const { rating, reviews } = getFakeRating(product.id);
  const viewingNow = getViewingNowCount(product.id);
  const recentlySold = getRecentlySoldCount(product.id);
  const related = await getCuratedRelatedProducts(product.id, product.categories);

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
    <div className="theme-light bg-bg text-fg">
    <div className="container-page py-8 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg border border-border bg-surface-2">
            <Image src={gallery[0]} alt={product.name} fill className="object-cover" priority sizes="(max-width: 1024px) 100vw, 50vw" />
            <FavoriteButton productId={product.id} className="absolute right-3 top-3" />
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
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-0.5 text-brand">
              {Array.from({ length: 5 }).map((_, i) => (
                <StarIcon key={i} />
              ))}
              <span className="ml-1 text-xs font-semibold text-fg">
                {rating} ({reviews} avaliações)
              </span>
            </div>
            <ViewingNowBadge count={viewingNow} />
          </div>

          <div className="flex flex-wrap gap-2">
            {product.badge && <Badge label={product.badge} color={product.badgeColor} />}
            {discount && <Badge label={`-${discount}% OFF`} color="#ff5c5c" />}
          </div>

          <p className="text-xs font-bold uppercase tracking-wide text-muted">{product.categories.join(" · ")}</p>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{product.name}</h1>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black text-brand">{formatCentsToBRL(product.priceCents)}</span>
            {product.compareAtPriceCents && (
              <span className="text-base text-muted line-through">
                {formatCentsToBRL(product.compareAtPriceCents)}
              </span>
            )}
          </div>
          {installmentAmount ? (
            <p className="text-xs font-semibold text-muted">
              ou em até {product.installments}x de {formatCentsToBRL(installmentAmount)} no PIX parcelado
            </p>
          ) : (
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">
              à vista no PIX, aprovação imediata
            </p>
          )}
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <ClockIcon className="shrink-0" /> {recentlySold.toLocaleString("pt-BR")} vendidos recentemente
          </p>

          <p className="whitespace-pre-line text-sm leading-relaxed text-muted">{product.description}</p>

          <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
            <ProductBuyBox slug={product.slug} outOfStock={outOfStock} />

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Frete p/ todo Brasil", Icon: TruckIcon },
                { label: "Compra segura", Icon: ShieldIcon },
                { label: "Troca garantida", Icon: RefreshIcon },
              ].map(({ label, Icon }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1.5 rounded-md border border-border p-2.5 text-center"
                >
                  <Icon className="text-brand" />
                  <span className="text-[10px] leading-tight text-muted">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-12 border-t border-border pt-8">
          <h2 className="mb-4 text-xl font-black tracking-tight">Você também vai gostar</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 sm:gap-4">
            {related.map((p) => (
              <div key={p.id} className="w-[46vw] shrink-0 sm:w-56">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
    </div>
  );
}
