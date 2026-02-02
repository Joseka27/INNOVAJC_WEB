"use client";
import "tailwindcss";
import React, { useEffect, useMemo, useState } from "react";
import "./landing_carousel.css";

type Company = {
  id: number;
  name: string;
  image_url: string;
};

const PAGE_SIZE = 15;
const TARGET_ITEMS = 30;

export default function CompaniesInfiniteCarousel() {
  const [items, setItems] = useState<Company[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Botón general: pausa / play del carrusel
  const [isPaused, setIsPaused] = useState(false);

  async function fetchPage(cursor: number | null) {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const qs = new URLSearchParams();
      qs.set("limit", String(PAGE_SIZE));
      if (cursor) qs.set("cursor", String(cursor));

      const res = await fetch(`/api/companies?${qs.toString()}`, {
        method: "GET",
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Error cargando empresas");

      const newItems: Company[] = data.items ?? [];
      const newCursor: number | null = data.nextCursor ?? null;

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

  useEffect(() => {
    fetchPage(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!initialLoaded) return;
    if (loading) return;
    if (nextCursor === null) return;
    if (items.length >= TARGET_ITEMS) return;

    fetchPage(nextCursor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLoaded, items.length, nextCursor, loading]);

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
        {/* fades suaves */}
        <div className="fadeLeft" />
        <div className="fadeRight" />

        {/* ✅ Botón general abajo derecha (pausa/play) */}
        <button
          type="button"
          className="carouselControl"
          onClick={() => setIsPaused((p) => !p)}
          aria-label={isPaused ? "Reanudar carrusel" : "Pausar carrusel"}
          title={isPaused ? "Reanudar" : "Pausar"}
        >
          {isPaused ? "▶" : "❚❚"}
        </button>

        {/* Track */}
        <div
          className="marquee"
          style={
            {
              ["--duration" as any]: `${durationSeconds}s`,
              ["--play" as any]: isPaused ? "paused" : "running",
            } as React.CSSProperties
          }
          aria-label="Companies carousel"
        >
          <div className="track">
            {loopItems.map((c, idx) => {
              const isDup = idx >= safe.length;
              return (
                <div
                  key={`${c.id}-${idx}`}
                  className="tile"
                  aria-hidden={isDup}
                >
                  {/* SOLO IMAGEN */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.image_url}
                    alt={c.name}
                    className="img"
                    loading="lazy"
                    draggable={false}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Si quieres CERO texto siempre, borra este bloque */}
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
