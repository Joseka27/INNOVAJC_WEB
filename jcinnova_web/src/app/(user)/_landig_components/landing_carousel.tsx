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
  if (cursor) qs.set("cursor", String(cursor));

  const res = await fetch(`/api/companies?${qs.toString()}`, {
    method: "GET",
    cache: "no-store",
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

  useEffect(() => {
    fetchPage(null);
  }, []);

  useEffect(() => {
    if (!initialLoaded) return;
    if (loading) return;
    if (nextCursor === null) return;
    if (items.length >= TARGET_ITEMS) return;

    fetchPage(nextCursor);
  }, [initialLoaded, items.length, nextCursor, loading]);

  // Si hay pocos items los repetimos para que el loop no se rompa
  const safe = useMemo(() => {
    if (items.length >= 8) return items;
    if (items.length > 0) return [...items, ...items, ...items];
    return [];
  }, [items]);

  const loopItems = useMemo(
    () => (safe.length ? [...safe, ...safe] : []),
    [safe],
  );

  const durationSeconds = Math.max(45, Math.min(60, safe.length * 2));

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
                    height={60}
                    priority={loopIdx < 6}
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
