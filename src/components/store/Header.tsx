"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export function Header({ storeName, logoUrl }: { storeName: string; logoUrl?: string | null }) {
  const [open, setOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Início" },
    { href: "/#produtos", label: "Produtos" },
    { href: "/#sobre", label: "Sobre" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-black/90 backdrop-blur">
      <div className="container-page grid h-16 grid-cols-3 items-center">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center text-fg md:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              {open ? (
                <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              ) : (
                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              )}
            </svg>
          </button>
          <button
            type="button"
            aria-label="Buscar"
            className="hidden h-10 w-10 items-center justify-center text-fg md:inline-flex"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.6" />
              <path d="M12.5 12.5L16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <Link href="/" className="justify-self-center">
          {logoUrl ? (
            <span className="relative block h-9 w-32">
              <Image src={logoUrl} alt={storeName} fill className="object-contain" sizes="128px" />
            </span>
          ) : (
            <span className="text-lg font-black tracking-widest">{storeName.toUpperCase()}</span>
          )}
        </Link>

        <Link
          href="/#produtos"
          aria-label="Carrinho"
          className="flex h-10 w-10 items-center justify-self-end text-fg"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M5 6.5h10l-.8 8.7a1.5 1.5 0 0 1-1.5 1.3H7.3a1.5 1.5 0 0 1-1.5-1.3L5 6.5Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path d="M7.2 6.5V5a2.8 2.8 0 1 1 5.6 0v1.5" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </Link>
      </div>

      {open && (
        <nav className="border-t border-border bg-black md:hidden">
          <div className="container-page flex flex-col py-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-b border-border py-3 text-sm font-medium text-fg last:border-none"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
