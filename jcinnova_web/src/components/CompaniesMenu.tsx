"use client";
import "tailwindcss";
import { useEffect, useMemo, useRef, useState } from "react";

type Company = {
  id: number;
  name: string;
  image_url: string;
};

const PAGE_SIZE = 15;

export default function CompaniesInfiniteCarousel() {
  const [items, setItems] = useState<Company[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  // Para evitar duplicados si el backend repite algo
  const ids = useMemo(() => new Set(items.map((x) => x.id)), [items]);

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
      setError(e.message ?? "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  // Carga inicial
  useEffect(() => {
    fetchPage(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Infinite load: cuando el sentinel entra en viewport
  useEffect(() => {
    if (!sentinelRef.current) return;

    const el = sentinelRef.current;

    const io = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some((e) => e.isIntersecting);
        if (!isVisible) return;
        if (loading) return;
        if (nextCursor === null && initialLoaded) return; // no hay más
        fetchPage(nextCursor);
      },
      {
        root: null,
        rootMargin: "400px", // precarga antes de llegar al final
        threshold: 0.01,
      },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [nextCursor, loading, initialLoaded]); // ok

  function scrollByCards(dir: "left" | "right") {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const card = scroller.querySelector<HTMLElement>("[data-card]");
    const step = card ? card.offsetWidth + 16 : 320; // +gap
    scroller.scrollBy({
      left: dir === "left" ? -step : step,
      behavior: "smooth",
    });
  }

  return (
    <section className="w-full py-10">
      <div className="px-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Companies we work with</h2>
          <p className="text-sm text-gray-600">
            Desliza para ver más (carga infinita)
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => scrollByCards("left")}
            className="border rounded-full px-3 py-2"
            aria-label="Scroll left"
          >
            ←
          </button>
          <button
            onClick={() => scrollByCards("right")}
            className="border rounded-full px-3 py-2"
            aria-label="Scroll right"
          >
            →
          </button>
        </div>
      </div>

      <div className="mt-6 relative">
        <div
          ref={scrollerRef}
          className="px-6 flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-3"
          style={{ scrollbarWidth: "thin" }}
        >
          {items.map((c) => (
            <article
              key={c.id}
              data-card
              className="snap-start shrink-0 md:w-[320px] rounded-2xl border overflow-hidden"
            >
              <div className="w-full bg-gray-100 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.image_url}
                  alt={c.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-4">
                <div className="font-semibold truncate">{c.name}</div>
                <div className="text-xs text-gray-500">#{c.id}</div>
              </div>
            </article>
          ))}

          {/* Skeletons mientras carga */}
          {loading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={`sk-${i}`}
                className="snap-start shrink-0 md:w-[320px] rounded-2xl border overflow-hidden animate-pulse"
              >
                <div className=" bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}

          {/* Sentinel dentro del scroller para disparar cargar más */}
          <div ref={sentinelRef} className=" shrink-0" />
        </div>

        {/* Estados */}
        <div className="px-6 mt-3 text-sm">
          {error && <div className="text-red-600">❌ {error}</div>}

          {!error && initialLoaded && items.length === 0 && (
            <div className="text-gray-600">No hay empresas todavía.</div>
          )}

          {!error &&
            initialLoaded &&
            nextCursor === null &&
            items.length > 0 && (
              <div className="text-gray-500">✅ No hay más para cargar.</div>
            )}
        </div>
      </div>
    </section>
  );
}
