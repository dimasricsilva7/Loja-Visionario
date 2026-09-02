import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/customer-session";
import { ProductGrid } from "@/components/store/ProductGrid";

export const metadata: Metadata = { title: "Favoritos", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/conta/login");

  const favorites = await prisma.favorite.findMany({
    where: { customerId: customer.id },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });

  const products = favorites.map((f) => f.product).filter((p) => p.active);

  return (
    <div className="container-page py-10 sm:py-14">
      <h1 className="mb-2 text-2xl font-black tracking-tight">Meus favoritos</h1>
      <p className="mb-6 text-sm text-muted">
        Produtos que você salvou.{" "}
        <Link href="/produtos" className="text-brand hover:underline">
          Ver todos os produtos
        </Link>
      </p>
      <ProductGrid products={products} />
    </div>
  );
}
