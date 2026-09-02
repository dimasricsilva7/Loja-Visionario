import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/session";
import { AdminShell } from "@/components/admin/AdminShell";
import { getStoreSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const [session, settings] = await Promise.all([getAdminSession(), getStoreSettings()]);
  if (!session) redirect("/admin/login");

  return (
    <AdminShell email={session.email} storeName={settings.storeName}>
      {children}
    </AdminShell>
  );
}
