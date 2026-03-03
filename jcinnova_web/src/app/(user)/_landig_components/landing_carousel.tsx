"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import "./landing_carousel.css";

type Company = {
  id: number;
  name: string;
  image_url: string;
};

const PAGE_SIZE = 15;
const TARGET_ITEMS = 30;

async function fetchCompaniesPage(
  cursor: number | null,
  pageSize: number,
): Promise<{ items: Company[]; nextCursor: number | null }> {
  const qs = new URLSearchParams();
  qs.set("limit", String(pageSize));
  if (cursor !== null) qs.set("cursor", String(cursor));

  const res = await fetch(`/api/companies?${qs.toString()}`, {
    // ✅ CACHE SOLO PARA ESTE FETCH
    next: { revalidate: 600 }, // 5 minutos
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error || "Error cargando empresas");
  }

  return {
    items: Array.isArray(data?.items) ? data.items : [],
    nextCursor:
      data?.nextCursor !== undefined && data?.nextCursor !== null
        ? data.nextCursor
        : null,
  };
}

function repeatToAtLeast<T>(arr: T[], min: number): T[] {
  if (arr.length === 0) return [];
  const out: T[] = [];
  while (out.length < min) out.push(...arr);
  return out.slice(0, Math.max(min, arr.length));
}

export default function CompaniesInfiniteCarousel() {
  const [items, setItems] = useState<Company[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchPage(cursor: number | null) {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const { items: newItems, nextCursor: newCursor } =
        await fetchCompaniesPage(cursor, PAGE_SIZE);

      setItems((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const merged = [...prev];
        for (const it of newItems) {
          if (!seen.has(it.id)) merged.push(it);
        }
        return merged;
      });

      setNextCursor(newCursor);
      setInitialLoaded(true);
    } catch (e: any) {
      setError(e?.message || "Error inesperado");
    }

    setLoading(false);
  }

  // ✅ Carga inicial
  useEffect(() => {
    fetchPage(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Traer más hasta TARGET_ITEMS
  useEffect(() => {
    if (!initialLoaded) return;
    if (loading) return;
    if (nextCursor === null) return;
    if (items.length >= TARGET_ITEMS) return;

    fetchPage(nextCursor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLoaded, items.length, nextCursor, loading]);

  // Repetir si hay pocos para que el loop no se rompa
  const base = useMemo(() => repeatToAtLeast(items, 8), [items]);

  const loopItems = useMemo(
    () => (base.length ? [...base, ...base] : []),
    [base],
  );

  const durationSeconds = useMemo(() => {
    const s = base.length ? base.length * 2 : 50;
    return Math.max(35, Math.min(60, s));
  }, [base.length]);

  // Fuerza reinicio de animación si cambia el contenido
  const trackKey = useMemo(() => {
    const ids = base.map((x) => x.id).join("-");
    return `${base.length}:${ids}`;
  }, [base]);

  return (
    <section className="w-full">
      <div className="carouselShell">
        <div className="fadeLeft" />
        <div className="fadeRight" />

        <div
          className="marquee"
          style={
            {
              ["--duration" as any]: `${durationSeconds}s`,
            } as React.CSSProperties
          }
          aria-label="Companies carousel"
        >
          <div className="track" key={trackKey}>
            {loopItems.map((c, loopIdx) => {
              const isDup = loopIdx >= base.length;
              const copy = isDup ? "b" : "a";

              return (
                <div
                  key={`${c.id}-${copy}-${loopIdx}`}
                  className="tile"
                  aria-hidden={isDup}
                >
                  <Image
                    src={c.image_url}
                    alt={c.name}
                    className="img"
                    width={140}
                    height={70}
                    priority={loopIdx < 8}
                    loading={loopIdx < 8 ? "eager" : "lazy"}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {error && (
        <div className="px-6 mt-3 text-sm text-red-600">❌ {error}</div>
      )}

      {!error && initialLoaded && items.length === 0 && (
        <div className="px-6 mt-3 text-sm text-gray-600">
          No hay empresas todavía.
        </div>
      )}
    </section>
  );
}
