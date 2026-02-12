"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import "./about_modules.css";
import { slugify } from "@/app/(user)/_utils/helpers";

type ModuleItem = {
  id: number;
  title: string;
  module_category: string;
  short_desc: string;
  long_desc: string;
  image_url: string;
};

// Si tu API tiene muchos módulos, puedes subir este número.
const FETCH_LIMIT = 200;

export default function AboutServices() {
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeCat] = useState<string>("Todos"); // (por ahora no hay UI de filtros)

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

  useEffect(() => {
    if (loading) return;
    if (error) return;
    if (modules.length === 0) return;

    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const id = hash ? hash.replace("#", "") : "";
    if (!id) return;

    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }, [loading, error, modules]);

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

  // ✅ Agrupar por categoría (ya filtrado)
  const grouped = useMemo(() => {
    const map = new Map<string, ModuleItem[]>();

    for (const m of filtered) {
      const cat = (m.module_category ?? "").trim() || "Sin categoría";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(m);
    }

    // Ordenar categorías + ordenar módulos dentro de cada categoría
    const orderedCats = Array.from(map.keys()).sort((a, b) =>
      a.localeCompare(b),
    );

    return orderedCats.map((cat) => ({
      cat,
      items: (map.get(cat) ?? []).sort((a, b) =>
        a.title.localeCompare(b.title),
      ),
    }));
  }, [filtered]);

  return (
    <section className="pg_about_services" id="pg_about_services">
      <div className="pg_about_services-sections">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          <div className="pg_about_services-head">
            <h2>Servicios que SECE-Software te ofrece</h2>
            <p>
              Ofrecemos servicios tecnológicos enfocados en la optimización y
              control empresarial, incluyendo implementación de sistemas ERP,
              configuración de módulos, soporte técnico y acompañamiento
              continuo. Nuestras soluciones están diseñadas para adaptarse a las
              necesidades de cada empresa, garantizando eficiencia, seguridad y
              escalabilidad.
            </p>
          </div>
        </motion.div>

        {/* Estado loading / error */}
        {loading && (
          <div className="pg_about_services-empty">Cargando módulos…</div>
        )}
        {!loading && error && (
          <div className="pg_about_services-empty">❌ {error}</div>
        )}

        {/* ✅ Categorías + Grid por categoría */}
        {!loading && !error && (
          <div className="pg_about_services-groups">
            {grouped.map(({ cat, items }) => (
              <section key={cat} className="pg_about_services-group">
                {/* ---Categoria--- */}
                <div className="pg_about_services-catDivider" id={slugify(cat)}>
                  <span className="pg_about_services-catLine" aria-hidden />
                  <h3 className="pg_about_services-catTitle">{cat}</h3>
                  <span className="pg_about_services-catLine" aria-hidden />
                </div>

                {/* Grid de esa categoría */}
                <div className="pg_about_services-grid">
                  {items.map((item) => (
                    <article
                      key={item.id}
                      className="pg_about_services-card"
                      id={String(slugify(item.title))}
                    >
                      <div
                        className="pg_about_services-cardtext"
                        style={{
                          backgroundImage: item.image_url
                            ? `url(${item.image_url})`
                            : undefined,
                        }}
                      >
                        <div className="pg_about_services-overlay">
                          <div className="pg_about_services-cardtop">
                            <h3>{item.title}</h3>
                            <span className="pg_about_services-chip">
                              {item.module_category}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="pg_about_services-desc">{item.long_desc}</p>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Estado vacío */}
        {!loading && !error && filtered.length === 0 && (
          <div className="pg_about_services-empty">
            No hay módulos para esta categoría.
          </div>
        )}
      </div>
    </section>
  );
}
