"use client";

import { useEffect, useMemo, useState } from "react";
import { LazyMotion, m, domAnimation } from "framer-motion";
import Link from "next/link";
import "./user_products.css";
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
    throw new Error(data?.error ?? "Error cargando módulos");
  }

  return Array.isArray(data?.items) ? data.items : [];
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

export default function AboutServices() {
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setModules([]);
      setError(e?.message ?? "Error inesperado cargando módulos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchAllModules();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, ModuleItem[]>();

    for (const m of modules) {
      const cat = (m.module_category ?? "").trim() || "Sin categoría";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(m);
    }

    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0], "es"))
      .map(([cat, items]) => ({
        cat,
        catLabel: formatCategoryLabel(cat),
        items: items.sort((a, b) => a.title.localeCompare(b.title, "es")),
      }));
  }, [modules]);

  return (
    <LazyMotion features={domAnimation}>
      <section className="pg_about_services" id="pg_about_services">
        <div className="pg_about_services-sections">
          <m.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            <div className="pg_about_services-head">
              <h2>
                SECE Software se <span className="relevance">adapta</span> a tu
                negocio
              </h2>
              <p>
                Explora cada módulo del sistema y entra a su página individual
                para ver la información completa, beneficios y alcance
                funcional.
              </p>
            </div>
          </m.div>

          {loading && (
            <div className="pg_about_services-empty">Cargando módulos…</div>
          )}

          {!loading && error && (
            <div className="pg_about_services-empty">{error}</div>
          )}

          {!loading && !error && grouped.length > 0 && (
            <div className="pg_about_services-groups">
              {grouped.map(({ cat, catLabel, items }) => (
                <section key={cat} className="pg_about_services-group">
                  <div
                    className="pg_about_services-catDivider"
                    id={slugify(cat)}
                  >
                    <span className="pg_about_services-catLine" aria-hidden />
                    <h3 className="pg_about_services-catTitle">{catLabel}</h3>
                    <span className="pg_about_services-catLine" aria-hidden />
                  </div>

                  <div className="pg_about_services-grid">
                    {items.map((item) => {
                      const slug = slugify(item.title);

                      return (
                        <article
                          key={item.id}
                          className="pg_about_services-card"
                          id={slug}
                        >
                          <div
                            className="pg_about_services-cardtext"
                            style={{
                              backgroundImage: item.banner_image_url
                                ? `url(${item.banner_image_url})`
                                : undefined,
                            }}
                          >
                            <div className="pg_about_services-overlay">
                              <div className="pg_about_services-cardtop">
                                <h3>{item.title}</h3>
                                <span className="pg_about_services-chip">
                                  {formatCategoryLabel(item.module_category)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="pg_about_services-summary">
                            <p>{item.short_desc}</p>

                            <Link
                              href={`/products/${slug}`}
                              className="pg_about_services-link"
                            >
                              Ver módulo completo
                            </Link>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}

          {!loading && !error && grouped.length === 0 && (
            <div className="pg_about_services-empty">
              No hay módulos disponibles.
            </div>
          )}
        </div>
      </section>
    </LazyMotion>
  );
}
