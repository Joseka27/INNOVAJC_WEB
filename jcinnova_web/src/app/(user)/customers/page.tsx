"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { LazyMotion, m, domAnimation } from "framer-motion";
import "./user_customers.css";

type SortKey = "relevance" | "name_asc" | "name_desc" | "newest" | "oldest";

type CompanyRow = {
  id: number;
  name: string | null;
  description: string | null;
  image_url: string | null;
  created_at?: string | null;
};

const PAGE_SIZE = 10;

function parseRequirements(req: string | null): string[] {
  const s = (req ?? "").trim();
  if (!s) return [];

  return s
    .split(/\r?\n|;|,/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

function safeStr(v: any) {
  return (v ?? "").toString();
}

function cmpString(a: string, b: string) {
  return a.localeCompare(b, "es", { sensitivity: "base" });
}

export default function CompaniesPage() {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("relevance");

  const [items, setItems] = useState<CompanyRow[]>([]);
  const [total, setTotal] = useState<number | null>(null);

  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [bootError, setBootError] = useState<string | null>(null);

  async function fetchBatch(nextOffset: number) {
    const qs = new URLSearchParams();
    qs.set("limit", String(PAGE_SIZE));
    qs.set("offset", String(nextOffset));

    const res = await fetch(`/api/companies?${qs.toString()}`, {
      method: "GET",
      cache: "no-store",
    });

    const raw = await res.text();
    let data: any = null;

    try {
      if (raw) data = JSON.parse(raw);
    } catch {
      throw new Error(
        `La API no devolvió JSON. Revisa /api/companies (status ${res.status}).`,
      );
    }

    if (!res.ok) {
      const errMsg =
        data && data.error ? data.error : "Error cargando empresas";
      throw new Error(errMsg);
    }

    const batch: CompanyRow[] = Array.isArray(data?.items) ? data.items : [];
    const count: number | null =
      typeof data?.count === "number" ? data.count : null;

    return { batch, count };
  }

  async function initialLoad() {
    try {
      const { batch, count } = await fetchBatch(0);
      setItems(batch);
      setTotal(count);
      setOffset(batch.length);
    } catch (e: any) {
      const errMsg =
        e && e.message ? e.message : "Error inesperado cargando empresas.";
      setBootError(errMsg);
      setItems([]);
      setTotal(null);
      setOffset(0);
    }
    setLoading(false);
  }

  async function loadMore() {
    if (loading) return;
    if (total !== null && offset >= total) return;

    setLoading(true);
    setBootError(null);
    try {
      const { batch, count } = await fetchBatch(offset);
      setItems((prev) => [...prev, ...batch]);
      if (typeof count === "number") setTotal(count);
      setOffset((prev) => prev + batch.length);
    } catch (e: any) {
      const errMsg =
        e && e.message ? e.message : "No se pudieron cargar más empresas.";
      setBootError(errMsg);
    }
    setLoading(false);
  }

  useEffect(() => {
    initialLoad();
  }, []);

  const filteredSorted = useMemo(() => {
    const qq = q.trim().toLowerCase();

    const base = !qq
      ? items
      : items.filter((c) => {
          const name = safeStr(c.name).toLowerCase();
          const desc = safeStr(c.description).toLowerCase();
          return `${name} ${desc}`.includes(qq);
        });

    if (sort === "relevance") {
      if (!qq) return base;

      const starts: CompanyRow[] = [];
      const contains: CompanyRow[] = [];

      for (const c of base) {
        const name = safeStr(c.name).toLowerCase();
        const desc = safeStr(c.description).toLowerCase();
        const hay = `${name} ${desc}`;

        if (hay.startsWith(qq) || name.startsWith(qq)) starts.push(c);
        else contains.push(c);
      }

      return [...starts, ...contains];
    }

    const copy = [...base];

    if (sort === "name_asc") {
      copy.sort((a, b) => cmpString(safeStr(a.name), safeStr(b.name)));
      return copy;
    }

    if (sort === "name_desc") {
      copy.sort((a, b) => cmpString(safeStr(b.name), safeStr(a.name)));
      return copy;
    }

    if (sort === "newest") {
      copy.sort((a, b) =>
        safeStr(b.created_at) > safeStr(a.created_at) ? 1 : -1,
      );
      return copy;
    }

    if (sort === "oldest") {
      copy.sort((a, b) =>
        safeStr(a.created_at) > safeStr(b.created_at) ? 1 : -1,
      );
      return copy;
    }

    return copy;
  }, [items, q, sort]);

  const shownCount = filteredSorted.length;
  const totalLabel = total === null ? "—" : String(total);

  const canLoadMore = total === null ? true : offset < total;

  return (
    <LazyMotion features={domAnimation}>
      <div className="pg_companies">
        <section className="pg_companies-hero" id="companies-hero">
          <div className="pg_companies-heroInner">
            <h1 className="pg_companies-title">
              Empresas que Trabajan y <span className="relevance">Creen</span>{" "}
              en nosotros.
            </h1>

            <div className="pg_companies-toolbar">
              <div className="pg_companies-search">
                <input
                  className="pg_companies-searchInput"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar empresa o descripción…"
                  aria-label="Buscar empresas"
                />
                <button
                  type="button"
                  className="pg_companies-searchBtn"
                  aria-label="Buscar"
                  onClick={() => {
                    (document.activeElement as HTMLElement | null)?.blur?.();
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    aria-hidden="true"
                  >
                    <path
                      fill="currentColor"
                      d="M10 4a6 6 0 104.472 10.03l3.249 3.25a1 1 0 001.415-1.415l-3.25-3.249A6 6 0 0010 4zm-4 6a4 4 0 117.999.001A4 4 0 016 10z"
                    />
                  </svg>
                </button>
              </div>

              <div className="pg_companies-sort">
                <span className="pg_companies-sortLabel">Sort by:</span>
                <select
                  className="pg_companies-sortSelect"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  aria-label="Ordenar empresas"
                >
                  <option value="relevance">Todos</option>
                  <option value="name_asc">Nombre (A–Z)</option>
                  <option value="name_desc">Nombre (Z–A)</option>
                  <option value="newest">Más recientes</option>
                  <option value="oldest">Más antiguas</option>
                </select>
              </div>
            </div>

            <div className="pg_companies-metaRow">
              <div className="pg_companies-results">
                {loading && items.length === 0 ? (
                  <>Cargando…</>
                ) : (
                  <>
                    Resultados <strong>{shownCount}</strong> de{" "}
                    <strong>{totalLabel}</strong>
                  </>
                )}
              </div>

              {q.trim() && (
                <button
                  type="button"
                  className="pg_companies-clear"
                  onClick={() => setQ("")}
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="pg_companies-list">
          <div className="pg_companies-listInner">
            {bootError ? (
              <div className="pg_companies-empty">❌ {bootError}</div>
            ) : !loading && items.length === 0 ? (
              <div className="pg_companies-empty">
                No hay empresas registradas.
              </div>
            ) : !loading && filteredSorted.length === 0 ? (
              <div className="pg_companies-empty">
                No se encontraron resultados para "{q.trim()}".
              </div>
            ) : (
              <div className="pg_companies-grid">
                {filteredSorted.map((c, idx) => {
                  const title = safeStr(c.name) || "Empresa";
                  const desc = parseRequirements(c.description);

                  return (
                    <m.article
                      key={c.id}
                      className="pg_companies-card"
                      initial={{ opacity: 0, y: 18 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.5,
                        delay: Math.min(idx, 10) * 0.03,
                      }}
                      viewport={{ once: true }}
                    >
                      <div className="pg_companies-media">
                        {c.image_url ? (
                          <Image
                            src={c.image_url}
                            alt={title}
                            className="pg_companies-mediaImg"
                            width={200}
                            height={150}
                            unoptimized
                          />
                        ) : (
                          <div className="pg_companies-mediaFallback">
                            {title.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="pg_companies-cardBody">
                        <div className="pg_companies-brand">
                          <div className="pg_companies-brandName">{title}</div>
                        </div>

                        {desc.length > 0 ? (
                          <ul className="pg_companies-desc">
                            {desc.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="pg_companies-desc is-empty">
                            Sin descripción.
                          </p>
                        )}
                      </div>
                    </m.article>
                  );
                })}
              </div>
            )}

            <div className="pg_companies-footer">
              <div className="pg_companies-footerLine" />

              <button
                type="button"
                className="pg_companies-loadMore"
                onClick={loadMore}
                disabled={!canLoadMore || loading}
              >
                {loading
                  ? "Cargando…"
                  : canLoadMore
                    ? "Cargar más resultados"
                    : "No hay más resultados"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </LazyMotion>
  );
}
