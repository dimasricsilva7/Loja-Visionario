import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/customer-session";
import { CustomerAccountView } from "@/components/store/CustomerAccountView";

export const metadata: Metadata = { title: "Minha conta", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function CustomerAccountPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/conta/login");

  return (
    <div className="container-page py-10 sm:py-14">
      <CustomerAccountView name={customer.name} email={customer.email} />
    </div>
  );
}
