import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CustomerRegisterForm } from "@/components/store/CustomerRegisterForm";
import { getCustomerSession } from "@/lib/customer-session";

export const metadata: Metadata = { title: "Criar conta", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function CustomerRegisterPage({ searchParams }: PageProps) {
  const { redirect: redirectTo } = await searchParams;
  const session = await getCustomerSession();
  if (session) redirect(redirectTo || "/conta");

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <CustomerRegisterForm redirectTo={redirectTo || "/conta"} />
    </div>
  );
}
