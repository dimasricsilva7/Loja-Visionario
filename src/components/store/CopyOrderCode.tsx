"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function CopyOrderCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // silencioso — o código também fica visível para copiar manualmente
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input readOnly value={code} className="input flex-1 truncate text-xs" onFocus={(e) => e.currentTarget.select()} />
      <Button type="button" variant="secondary" size="sm" onClick={handleCopy}>
        {copied ? "Copiado!" : "Copiar"}
      </Button>
    </div>
  );
}
