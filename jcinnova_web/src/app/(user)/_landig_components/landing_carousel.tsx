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

  const res = await fetch(`/api/companies?${qs.toString()}`, { method: "GET" });
  const data = await res.json();

  if (!res.ok) {
    let errMsg = "Error cargando empresas";
    if (data?.error) errMsg = data.error;
    throw new Error(errMsg);
  }

  const items: Company[] = Array.isArray(data?.items) ? data.items : [];
  const nextCursor: number | null =
    data?.nextCursor !== undefined && data?.nextCursor !== null
      ? data.nextCursor
      : null;

  return { items, nextCursor };
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
      setError(e?.message ?? "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  // Primera carga (cuando entra a la página)
  useEffect(() => {
    fetchPage(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Seguir paginando hasta TARGET_ITEMS (si hay más)
  useEffect(() => {
    if (!initialLoaded) return;
    if (loading) return;
    if (nextCursor === null) return;
    if (items.length >= TARGET_ITEMS) return;

    fetchPage(nextCursor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLoaded, items.length, nextCursor, loading]);

  // Safe: evita carrusel vacío
  const safe = useMemo(() => {
    if (items.length >= 8) return items;
    if (items.length > 0) return [...items, ...items, ...items];
    return [];
  }, [items]);

  // Loop continuo
  const loopItems = useMemo(
    () => (safe.length ? [...safe, ...safe] : []),
    [safe],
  );

  // ✅ Arranca apenas haya algo decente (no esperes TARGET_ITEMS)
  const ready = safe.length >= 8;

  // Duración estable
  const durationSeconds = useMemo(() => {
    const base = safe.length ? safe.length * 2 : 50;
    return Math.max(45, Math.min(60, base));
  }, [safe.length]);

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
              ["--play" as any]: ready ? "running" : "paused",
            } as React.CSSProperties
          }
          aria-label="Companies carousel"
        >
          <div className="track">
            {loopItems.map((c, loopIdx) => {
              const isDup = loopIdx >= safe.length;
              const copy = isDup ? "b" : "a";
              return (
                <div
                  key={`${c.id}-${copy}`}
                  className="tile"
                  aria-hidden={isDup}
                >
                  <Image
                    src={c.image_url}
                    alt={c.name}
                    className="img"
                    width={120}
                    height={120}
                    unoptimized
                    priority={loopIdx < 6} /* ✅ fuerza primeras a cargar */
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
