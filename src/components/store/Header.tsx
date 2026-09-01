"use client";

import Link from "next/link";
import { useState } from "react";

export function Header({ storeName }: { storeName: string }) {
  const [open, setOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Início" },
    { href: "/#produtos", label: "Produtos" },
    { href: "/#sobre", label: "Sobre" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="text-lg font-black tracking-tight">
          {storeName.toUpperCase()}
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted transition hover:text-fg"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/#produtos"
            className="hidden h-10 items-center rounded-md bg-brand px-4 text-sm font-bold text-brand-fg md:inline-flex"
          >
            Comprar agora
          </Link>
          <button
            type="button"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border md:hidden"
          >
            <span className="sr-only">Menu</span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              {open ? (
                <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              ) : (
                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border bg-bg md:hidden">
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
