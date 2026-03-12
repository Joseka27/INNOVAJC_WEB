"use client";

import { useEffect, useMemo, useState } from "react";
import { LazyMotion, domAnimation } from "framer-motion";
import Link from "next/link";
import "./user_prices.css";

type PriceRow = {
  id: number;
  title: string | null;
  description: string | null;
  category: string | null;
  characteristics: string | null;
  created_at?: string | null;
};

type CategoryRow = {
  id: number;
  page: string;
  name: string;
  created_at?: string | null;
};

const PAGE_KEY = "prices";
const FETCH_LIMIT = 500;

function parseCharacteristics(req: string | null): string[] {
  const s = (req ?? "").trim();
  if (!s) return [];

  return s
    .split(/\r?\n|;/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

function formatCategoryLabel(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => {
      if (word === "erp") return "ERP";
      if (word === "rrhh") return "RRHH";
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

async function fetchPricePage(
  offset: number,
  limit: number,
): Promise<PriceRow[]> {
  const qs = new URLSearchParams();
  qs.set("limit", String(limit));
  qs.set("offset", String(offset));

  const res = await fetch(`/api/prices?${qs.toString()}`, {
    method: "GET",
    cache: "no-store",
  });

  const raw = await res.text();
  let data: any = null;

  try {
    if (raw) data = JSON.parse(raw);
  } catch {
    throw new Error(
      `La API no devolvió JSON. Revisa /api/prices (status ${res.status}).`,
    );
  }

  if (!res.ok) {
    let errMsg = "Error cargando precios";
    if (data && data.error) errMsg = data.error;
    throw new Error(errMsg);
  }

  return data && Array.isArray(data.items) ? data.items : [];
}

async function fetchCategories(page: string): Promise<string[]> {
  const res = await fetch(`/api/categories?page=${encodeURIComponent(page)}`, {
    method: "GET",
    cache: "no-store",
  });

  const raw = await res.text();
  let data: any = null;

  try {
    if (raw) data = JSON.parse(raw);
  } catch {
    throw new Error(
      `La API no devolvió JSON. Revisa /api/categories (status ${res.status}).`,
    );
  }

  if (!res.ok) {
    let errMsg = "Error cargando categorías";
    if (data && data.error) errMsg = data.error;
    throw new Error(errMsg);
  }

  const items: CategoryRow[] = Array.isArray(data) ? data : [];
  return items.map((x) => x.name).filter(Boolean);
}

export default function PricesPage() {
  const [active, setActive] = useState("Todos");
  const [query, setQuery] = useState("");

  const [rows, setRows] = useState<PriceRow[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchAllPrices() {
    setLoading(true);
    setError(null);

    try {
      const all: PriceRow[] = [];
      let offset = 0;

      while (true) {
        const batch = await fetchPricePage(offset, FETCH_LIMIT);
        all.push(...batch);

        if (batch.length < FETCH_LIMIT) break;

        offset += FETCH_LIMIT;
        if (offset > 5000) break;
      }

      setRows(all);
    } catch (e: any) {
      setError(e?.message ?? "Error inesperado cargando precios.");
      setRows([]);
    }

    setLoading(false);
  }

  async function loadCategories() {
    setCategoriesLoading(true);

    try {
      const items = await fetchCategories(PAGE_KEY);
      setCategories(items);

      setActive((prev) => {
        if (prev === "Todos") return prev;
        return items.includes(prev) ? prev : "Todos";
      });
    } catch (e: any) {
      setError((prev) => prev ?? e?.message ?? "Error cargando categorías.");
      setCategories([]);
      setActive("Todos");
    }

    setCategoriesLoading(false);
  }

  useEffect(() => {
    void Promise.all([fetchAllPrices(), loadCategories()]);
  }, []);

  const pricesUI = useMemo(() => {
    return rows
      .filter((r) => typeof r.id === "number")
      .map((r) => {
        const category = (r.category ?? "").toString();

        return {
          id: r.id,
          title: (r.title ?? "Servicio").toString(),
          description: (r.description ?? "").toString(),
          category,
          characteristics: parseCharacteristics(r.characteristics),
          created_at: r.created_at ?? new Date().toISOString(),
        };
      })
      .sort((a, b) => (b.created_at > a.created_at ? 1 : -1));
  }, [rows]);

  const filtered = useMemo(() => {
    const base =
      active === "Todos"
        ? pricesUI
        : pricesUI.filter((d) => d.category === active);

    const q = query.trim().toLowerCase();
    if (!q) return base;

    return base.filter((d) => {
      const haystack =
        `${d.title} ${d.description} ${d.category} ${d.characteristics.join(" ")}`.toLowerCase();

      return haystack.includes(q);
    });
  }, [active, query, pricesUI]);

  const filterOptions = useMemo(() => ["Todos", ...categories], [categories]);

  return (
    <LazyMotion features={domAnimation}>
      <div className="pg_prices">
        <section className="pg_prices-list">
          <div className="pg_prices-listInner">
            <div className="pg_prices-head">
              <h2>
                Planes y <span className="pg_down-grad">Precios</span> de
                nuestros Sistemas
              </h2>

              <p>
                Explora nuestros servicios, soluciones empresariales y
                herramientas disponibles para tu empresa.
              </p>
            </div>

            <div className="pg_prices-toolbar">
              <div className="pg_prices-filters">
                {filterOptions.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`pg_prices-filterBtn ${active === p ? "is-active" : ""}`}
                    onClick={() => setActive(p)}
                    disabled={categoriesLoading && p !== "Todos"}
                  >
                    {p === "Todos" ? "Todos" : formatCategoryLabel(p)}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="pg_prices-empty">Cargando precios…</div>
            ) : error ? (
              <div className="pg_prices-empty">❌ {error}</div>
            ) : filtered.length === 0 ? (
              <div className="pg_prices-empty">
                No hay planes para este servicio
              </div>
            ) : (
              <div className="pg_prices-grid">
                {filtered.map((p) => (
                  <article key={p.id} className="pg_prices-card">
                    <div className="pg_prices-cardTop">
                      <div className="pg_prices-info">
                        <div className="pg_prices-titleRow">
                          <h3 className="pg_prices-title">{p.title}</h3>
                        </div>

                        <div className="pg_prices-desc">{p.description}</div>

                        <span className="pg_prices-chip">
                          {p.category
                            ? formatCategoryLabel(p.category)
                            : "Sin categoría"}
                        </span>
                      </div>
                    </div>

                    {p.characteristics?.length ? (
                      <div className="pg_prices-req">
                        <div className="pg_prices-reqTitle">
                          Beneficios del Plan:
                        </div>

                        <ul className="pg_prices-reqList">
                          {p.characteristics.map((r, i) => (
                            <li
                              key={`${p.id}-${i}-${r}`}
                              className="pg_prices-reqItem"
                            >
                              <span className="ct_icon is-success" aria-hidden>
                                <svg
                                  width="18"
                                  height="18"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <path
                                    d="M20 6 9 17l-5-5"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </span>

                              <span className="pg_prices-reqText">{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    <Link href="/contact" className="pg_prices-contactbutton">
                      Consultar Plan
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </LazyMotion>
  );
}
