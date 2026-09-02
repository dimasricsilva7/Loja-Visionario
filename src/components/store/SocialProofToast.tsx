"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { generateFakePurchaseEvent } from "@/lib/social-proof";
import { CloseIcon } from "@/components/icons";

interface ToastProduct {
  name: string;
  image: string;
}

export function SocialProofToast({ products }: { products: ToastProduct[] }) {
  const [visible, setVisible] = useState(false);
  const [tick, setTick] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (products.length === 0 || dismissed) return;

    const showTimer = setTimeout(() => setVisible(true), 4000);
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setTick((t) => t + 1);
        setVisible(true);
      }, 500);
    }, 14000);

    return () => {
      clearTimeout(showTimer);
      clearInterval(interval);
    };
  }, [products.length, dismissed]);

  if (products.length === 0 || dismissed) return null;

  const seed = tick + 1;
  const event = generateFakePurchaseEvent(seed);
  const product = products[seed % products.length];

  return (
    <div
      className={`fixed bottom-20 left-4 z-40 flex w-[calc(100%-2rem)] max-w-xs items-center gap-3 rounded-lg border border-border bg-surface p-3 shadow-card transition-all duration-500 sm:bottom-4 sm:w-auto ${
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
      }`}
    >
      <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-md border border-border bg-surface-2">
        <Image src={product.image} alt="" fill className="object-cover" sizes="40px" />
      </div>
      <div className="min-w-0 flex-1 text-xs">
        <p className="truncate font-semibold">
          {event.name} <span className="text-brand">comprou</span>
        </p>
        <p className="truncate text-muted">{product.name}</p>
        <p className="text-[11px] text-muted">
          {event.city} · há {event.minutesAgo} min
        </p>
      </div>
      <button
        type="button"
        aria-label="Fechar"
        onClick={() => setDismissed(true)}
        className="shrink-0 self-start text-muted hover:text-fg"
      >
        <CloseIcon />
      </button>
    </div>
  );
}
