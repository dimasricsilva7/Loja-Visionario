import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CustomerLoginForm } from "@/components/store/CustomerLoginForm";
import { getCustomerSession } from "@/lib/customer-session";

export const metadata: Metadata = { title: "Entrar", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function CustomerLoginPage({ searchParams }: PageProps) {
  const { redirect: redirectTo } = await searchParams;
  const session = await getCustomerSession();
  if (session) redirect(redirectTo || "/conta");

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <CustomerLoginForm redirectTo={redirectTo || "/conta"} />
    </div>
  );
}
