"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { slugify } from "@/app/(user)/_utils/helpers";

type ModuleItem = {
  id: number;
  title: string;
  module_category: string;
  short_desc: string;
  long_desc: string;
  image_url: string;
};

const PER_PAGE = 8;

// Si tu API tiene muchos módulos, puedes subir este número.
const FETCH_LIMIT = 200;

export default function ServicesSection() {
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeCat, setActiveCat] = useState<string>("Todos");
  const [page, setPage] = useState(1);

  async function fetchAllModules() {
    setLoading(true);
    setError(null);

    try {
      const all: ModuleItem[] = [];
      let offset = 0;

      while (true) {
        const qs = new URLSearchParams();
        qs.set("limit", String(FETCH_LIMIT));
        qs.set("offset", String(offset));

        const res = await fetch(`/api/modules?${qs.toString()}`, {
          method: "GET",
          cache: "no-store",
        });

        const raw = await res.text();
        let data: any = null;
        try {
          data = raw ? JSON.parse(raw) : null;
        } catch {
          throw new Error(
            `La API no devolvió JSON. Revisa /api/modules (status ${res.status}).`,
          );
        }

        if (!res.ok) throw new Error(data?.error ?? "Error cargando módulos");

        const batch: ModuleItem[] = Array.isArray(data?.items)
          ? data.items
          : [];
        all.push(...batch);

        // Si ya no vienen más, cortamos
        if (batch.length < FETCH_LIMIT) break;

        offset += FETCH_LIMIT;

        // Safety guard por si algo raro devuelve siempre lleno
        if (offset > 5000) break;
      }

      setModules(all);
    } catch (e: any) {
      setError(e?.message ?? "Error inesperado cargando módulos.");
      setModules([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAllModules();
  }, []);

  // Categorías dinámicas según lo que venga en DB
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const m of modules) {
      const c = (m.module_category ?? "").trim();
      if (c) set.add(c);
    }
    return ["Todos", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [modules]);

  const filtered = useMemo(() => {
    if (activeCat === "Todos") return modules;
    return modules.filter((m) => m.module_category === activeCat);
  }, [modules, activeCat]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));

  useEffect(() => {
    setPage(1);
  }, [activeCat]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return filtered.slice(start, start + PER_PAGE);
  }, [filtered, page]);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <section className="pg_main-presentation-part4" id="servicios">
      <div className="pg_main-part4-sections">
        <motion.div
          className="h1-span-part6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          <div className="pg_main-part4-head">
            <h2>Todo tu negocio en un solo sistema</h2>
            <p>
              Módulos integrados para controlar las distintas operaciones de tu
              empresa. Totalmente ajustables a tu negocio
            </p>
          </div>
        </motion.div>

        {/* Estado loading / error */}
        {loading && (
          <div className="pg_main-part4-empty">Cargando módulos…</div>
        )}
        {!loading && error && (
          <div className="pg_main-part4-empty">❌ {error}</div>
        )}

        {/* Filtro por categoría */}
        {!loading && !error && (
          <div
            className="pg_main-part4-filters"
            role="tablist"
            aria-label="Filtrar módulos"
          >
            {categories.map((c) => {
              const active = c === activeCat;
              return (
                <button
                  key={c}
                  type="button"
                  className={`pg_main-part4-filterbtn ${active ? "is-active" : ""}`}
                  onClick={() => setActiveCat(c)}
                  role="tab"
                  aria-selected={active}
                >
                  {c}
                </button>
              );
            })}
          </div>
        )}

        {/* Grid */}
        {!loading && !error && (
          <div className="pg_main-part4-grid">
            {pageItems.map((item) => (
              <article key={item.id} className="pg_main-part4-card">
                <div className="pg_main-part4-media" aria-hidden>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image_url}
                    alt=""
                    width={100}
                    height={100}
                    className="pg_main-part4-img"
                    loading="lazy"
                  />
                </div>

                <div className="pg_main-part4-cardtext">
                  <div className="pg_main-part4-cardtop">
                    <h3>{item.title}</h3>
                    <span className="pg_main-part4-chip">
                      {item.module_category}
                    </span>
                  </div>
                  <p>{item.short_desc}</p>
                </div>

                <div className="pg_main-part4-cardmoreinfo">
                  <Link href={`/about#${slugify(item.title)}`}>
                    Más información ↗
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Paginación */}
        {!loading && !error && filtered.length > PER_PAGE && (
          <div className="pg_main-part4-pagination" aria-label="Paginación">
            <button
              type="button"
              className="pg_main-part4-pagebtn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!canPrev}
            >
              ← Anterior
            </button>

            <div className="pg_main-part4-pagestatus">
              Página <b>{page}</b> de <b>{totalPages}</b>
            </div>

            <button
              type="button"
              className="pg_main-part4-pagebtn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={!canNext}
            >
              Siguiente →
            </button>
          </div>
        )}

        {/* Estado vacío */}
        {!loading && !error && filtered.length === 0 && (
          <div className="pg_main-part4-empty">
            No hay módulos para esta categoría.
          </div>
        )}
      </div>
    </section>
  );
}
