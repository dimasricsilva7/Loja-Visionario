"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { CloseIcon, DashboardIcon, LogoutIcon, MenuIcon, OrdersIcon, ProductsIcon, SettingsIcon } from "@/components/icons";

const links = [
  { href: "/admin", label: "Dashboard", Icon: DashboardIcon },
  { href: "/admin/pedidos", label: "Pedidos", Icon: OrdersIcon },
  { href: "/admin/produtos", label: "Produtos", Icon: ProductsIcon },
  { href: "/admin/configuracoes", label: "Configurações", Icon: SettingsIcon },
];

export function AdminShell({
  email,
  storeName,
  children,
}: {
  email: string;
  storeName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const Nav = (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {links.map((link) => {
        const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            className={clsx(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition",
              active ? "bg-brand text-brand-fg" : "text-muted hover:bg-surface-2 hover:text-fg"
            )}
          >
            <link.Icon />
            {link.label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={handleLogout}
        className="mt-auto flex items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium text-muted transition hover:bg-surface-2 hover:text-danger"
      >
        <LogoutIcon />
        Sair
      </button>
    </nav>
  );

  return (
    <div className="flex min-h-screen w-full bg-bg">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface lg:flex">
        <div className="flex h-16 items-center border-b border-border px-4 text-sm font-black tracking-tight">
          {storeName.toUpperCase()} · ADMIN
        </div>
        {Nav}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-4 lg:px-6">
          <button
            type="button"
            aria-label="Abrir menu"
            onClick={() => setOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border lg:hidden"
          >
            <MenuIcon />
          </button>
          <span className="text-sm font-bold lg:hidden">{storeName.toUpperCase()} · ADMIN</span>
          <span className="ml-auto text-xs text-muted">{email}</span>
        </header>

        <main className="min-w-0 flex-1 overflow-x-hidden p-4 lg:p-6">{children}</main>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="relative flex w-64 flex-col border-r border-border bg-surface">
            <div className="flex h-16 items-center justify-between border-b border-border px-4 text-sm font-black">
              {storeName.toUpperCase()} · ADMIN
              <button type="button" onClick={() => setOpen(false)} aria-label="Fechar menu">
                <CloseIcon />
              </button>
            </div>
            {Nav}
          </div>
        </div>
      )}
    </div>
  );
}
