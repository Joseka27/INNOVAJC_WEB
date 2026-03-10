"use client";

import { useEffect, useMemo, useState } from "react";
import { LazyMotion, m, domAnimation } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { slugify } from "@/app/(user)/_utils/helpers";

type ModuleItem = {
  id: number;
  title: string;
  module_category: string;
  short_desc: string;
  long_desc: string;
  banner_image_url: string;
};

const FETCH_LIMIT = 200;

const DESKTOP_PER_PAGE = 8;

const MOBILE_PER_PAGE = 4;

const MOBILE_MAX = 620;

async function fetchModulePage(
  offset: number,
  limit: number,
): Promise<ModuleItem[]> {
  const qs = new URLSearchParams();
  qs.set("limit", String(limit));
  qs.set("offset", String(offset));

  const res = await fetch(`/api/modules?${qs.toString()}`, {
    method: "GET",
    cache: "no-store",
  });

  const raw = await res.text();
  let data: any = null;
  try {
    if (raw) data = JSON.parse(raw);
  } catch {
    throw new Error(
      `La API no devolvió JSON. Revisa /api/modules (status ${res.status}).`,
    );
  }

  if (!res.ok) {
    let errMsg = "Error cargando módulos";
    if (data && data.error) {
      errMsg = data.error;
    }
    throw new Error(errMsg);
  }

  let batch: ModuleItem[] = [];
  if (data && Array.isArray(data.items)) {
    batch = data.items;
  }
  return batch;
}

export default function ServicesSection() {
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeCat, setActiveCat] = useState<string>("Todos");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DESKTOP_PER_PAGE);

  // ✅ Detectar tamaño pantalla
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_MAX}px)`);

    const apply = () => {
      setPerPage(mq.matches ? MOBILE_PER_PAGE : DESKTOP_PER_PAGE);
      setPage(1);
    };

    apply();
    mq.addEventListener("change", apply);

    return () => mq.removeEventListener("change", apply);
  }, []);

  // ✅ Scroll suave a la sección restando 20px
  const scrollToSection = () => {
    const el = document.getElementById("subtitle");
    if (!el) return;

    const y = el.getBoundingClientRect().top + window.scrollY - 20;

    window.scrollTo({
      top: y,
      behavior: "smooth",
    });
  };

  async function fetchAllModules() {
    setLoading(true);
    setError(null);

    try {
      const all: ModuleItem[] = [];
      let offset = 0;

      while (true) {
        const batch = await fetchModulePage(offset, FETCH_LIMIT);
        all.push(...batch);

        if (batch.length < FETCH_LIMIT) break;

        offset += FETCH_LIMIT;

        if (offset > 5000) break;
      }

      setModules(all);
    } catch (e: any) {
      let errMsg = "Error inesperado cargando módulos.";
      if (e && e.message) {
        errMsg = e.message;
      }
      setError(errMsg);
      setModules([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchAllModules();
  }, []);

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  const pageItems = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page, perPage]);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <LazyMotion features={domAnimation}>
      <section className="pg_main-presentation-part4" id="servicios">
        <div className="pg_main-part4-sections">
          <m.div
            className="h1-span-part6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            <div className="pg_main-part4-head">
              <h2>Todo tu negocio en un solo sistema</h2>
              <p id="subtitle">
                Módulos integrados para controlar las distintas operaciones de
                tu empresa. Totalmente ajustables a tu negocio
              </p>
            </div>
          </m.div>

          {loading && (
            <div className="pg_main-part4-empty">Cargando módulos…</div>
          )}

          {!loading && error && (
            <div className="pg_main-part4-empty">❌ {error}</div>
          )}

          {!loading && !error && (
            <div className="pg_main-part4-grid " id="cards">
              {pageItems.map((item, idx) => (
                <article key={item.id} className="pg_main-part4-card">
                  <div className="pg_main-part4-media" aria-hidden>
                    <Image
                      src={item.banner_image_url}
                      alt=""
                      fill
                      className="pg_main-part4-img"
                      priority={idx < 2 && page === 1}
                      sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 320px"
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
                    <Link href={`/about/${slugify(item.title)}`}>
                      Más información ↗
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!loading && !error && filtered.length > perPage && (
            <div className="pg_main-part4-pagination" aria-label="Paginación">
              <button
                type="button"
                className="pg_main-part4-pagebtn"
                onClick={() => {
                  setPage((p) => Math.max(1, p - 1));
                  scrollToSection();
                }}
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
                onClick={() => {
                  setPage((p) => Math.min(totalPages, p + 1));
                  scrollToSection();
                }}
                disabled={!canNext}
              >
                Siguiente →
              </button>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="pg_main-part4-empty">
              No hay módulos para esta categoría.
            </div>
          )}
        </div>
      </section>
    </LazyMotion>
  );
}
