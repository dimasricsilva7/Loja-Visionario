"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeartIcon, HomeIcon, PersonIcon, ProductsListIcon } from "@/components/icons";

export function BottomNav({ loggedIn }: { loggedIn: boolean }) {
  const pathname = usePathname();

  const items = [
    { href: "/", label: "Início", Icon: HomeIcon, active: pathname === "/" },
    { href: "/produtos", label: "Produtos", Icon: ProductsListIcon, active: pathname.startsWith("/produtos") },
    { href: "/favoritos", label: "Favoritos", Icon: HeartIcon, active: pathname.startsWith("/favoritos") },
    {
      href: loggedIn ? "/conta" : "/conta/login",
      label: "Conta",
      Icon: PersonIcon,
      active: pathname.startsWith("/conta"),
    },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-black/95 backdrop-blur md:hidden">
      {items.map(({ href, label, Icon, active }) => (
        <Link
          key={href}
          href={href}
          className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium ${
            active ? "text-brand" : "text-muted"
          }`}
        >
          <Icon className="h-5 w-5" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
