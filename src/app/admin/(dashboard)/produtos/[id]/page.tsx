import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/ProductForm";

export const metadata: Metadata = { title: "Editar produto" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) notFound();

  const relations = await prisma.productRelation.findMany({
    where: { productId: id },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-black tracking-tight">Editar produto</h1>
      <ProductForm
        initial={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          price: (product.priceCents / 100).toFixed(2),
          compareAtPrice: product.compareAtPriceCents ? (product.compareAtPriceCents / 100).toFixed(2) : "",
          image: product.image,
          images: product.images.join("\n"),
          badge: product.badge ?? "",
          badgeColor: product.badgeColor ?? "#1db954",
          stock: String(product.stock),
          active: product.active,
          featured: product.featured,
          sortOrder: String(product.sortOrder),
          category: product.category,
          installments: String(product.installments),
          productIdBravoPay: product.productIdBravoPay ?? "",
          relatedProductIds: relations.map((r) => r.relatedProductId),
        }}
      />
    </div>
  );
}
