"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "lv_offer_deadline";

function getOrCreateDeadline(minutes: number): number {
  if (typeof window === "undefined") return Date.now() + minutes * 60_000;

  const stored = window.localStorage.getItem(STORAGE_KEY);
  const now = Date.now();

  if (stored) {
    const deadline = parseInt(stored, 10);
    if (!Number.isNaN(deadline) && deadline > now) {
      return deadline;
    }
  }

  const deadline = now + minutes * 60_000;
  window.localStorage.setItem(STORAGE_KEY, String(deadline));
  return deadline;
}

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function OfferBar({ minutes = 15 }: { minutes?: number }) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const deadline = getOrCreateDeadline(minutes);

    const tick = () => {
      const diff = deadline - Date.now();
      if (diff <= 0) {
        setRemaining(0);
        setExpired(true);
        return;
      }
      setRemaining(diff);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [minutes]);

  if (remaining === null) return null;

  if (expired) {
    return (
      <div className="bg-surface-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted">
        Oferta encerrada — confira nossos preços regulares
      </div>
    );
  }

  return (
    <div className="bg-brand py-2 text-center text-xs font-bold uppercase tracking-wide text-brand-fg sm:text-sm">
      Oferta especial — termina em {formatRemaining(remaining)}
    </div>
  );
}
