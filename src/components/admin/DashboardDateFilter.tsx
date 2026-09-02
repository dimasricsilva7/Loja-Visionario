"use client";

import { useRouter, useSearchParams } from "next/navigation";

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function DashboardDateFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  function applyRange(nextFrom: string, nextTo: string) {
    const params = new URLSearchParams();
    if (nextFrom) params.set("from", nextFrom);
    if (nextTo) params.set("to", nextTo);
    router.push(`/admin${params.toString() ? `?${params.toString()}` : ""}`);
  }

  function setPreset(days: number | "all") {
    if (days === "all") return applyRange("", "");
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - (days - 1));
    applyRange(toISODate(start), toISODate(today));
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-1 text-xs text-muted">
        De
        <input
          type="date"
          className="input h-9"
          value={from}
          onChange={(e) => applyRange(e.target.value, to)}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-muted">
        Até
        <input
          type="date"
          className="input h-9"
          value={to}
          onChange={(e) => applyRange(from, e.target.value)}
        />
      </label>
      <div className="flex gap-1.5">
        <button type="button" onClick={() => setPreset(1)} className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-surface-2">
          Hoje
        </button>
        <button type="button" onClick={() => setPreset(7)} className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-surface-2">
          7 dias
        </button>
        <button type="button" onClick={() => setPreset(30)} className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-surface-2">
          30 dias
        </button>
        <button type="button" onClick={() => setPreset("all")} className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-surface-2">
          Tudo
        </button>
      </div>
    </div>
  );
}
