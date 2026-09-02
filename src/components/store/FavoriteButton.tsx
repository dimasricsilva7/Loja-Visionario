"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HeartIcon } from "@/components/icons";

export function FavoriteButton({ productId, className = "" }: { productId: string; className?: string }) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetch("/api/favorites")
      .then((res) => (res.ok ? res.json() : { products: [] }))
      .then((data) => {
        const ids: string[] = (data.products || []).map((p: { id: string }) => p.id);
        setFavorited(ids.includes(productId));
      })
      .catch(() => {})
      .finally(() => setChecked(true));
  }, [productId]);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      if (favorited) {
        const res = await fetch(`/api/favorites?productId=${productId}`, { method: "DELETE" });
        if (res.status === 401) return router.push("/conta/login");
        setFavorited(false);
      } else {
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        if (res.status === 401) return router.push("/conta/login");
        setFavorited(true);
      }
    } finally {
      setLoading(false);
    }
  }

  if (!checked) return null;

  return (
    <button
      type="button"
      aria-label={favorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      onClick={toggle}
      disabled={loading}
      className={`flex h-8 w-8 items-center justify-center rounded-full bg-white text-black shadow-sm transition ${className}`}
    >
      <HeartIcon filled={favorited} className={favorited ? "text-danger" : "text-black"} />
    </button>
  );
}
