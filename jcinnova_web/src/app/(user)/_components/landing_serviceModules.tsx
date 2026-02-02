"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { categories, servicesItems, Category } from "./landing_data";
import { motion } from "framer-motion";

const PER_PAGE = 8;

export default function ServicesSection() {
  const [activeCat, setActiveCat] = useState<Category>("Todos");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (activeCat === "Todos") return servicesItems;
    return servicesItems.filter((s) => s.category === activeCat);
  }, [activeCat]);

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

        {/* Filtro por categoría */}
        <div
          className="pg_main-part4-filters"
          role="tablist"
          aria-label="Filtrar servicios"
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

        {/* Grid */}
        <div className="pg_main-part4-grid">
          {pageItems.map((item) => (
            <article key={item.title} className="pg_main-part4-card">
              <div className="pg_main-part4-media" aria-hidden>
                <img
                  src={item.image}
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
                  <span className="pg_main-part4-chip">{item.category}</span>
                </div>
                <p>{item.text}</p>
              </div>
              <div className="pg_main-part4-cardmoreinfo">
                <p>Mas información ↗</p>
              </div>
            </article>
          ))}
        </div>

        {filtered.length > PER_PAGE && (
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
        {filtered.length === 0 && (
          <div className="pg_main-part4-empty">
            No hay servicios para esta categoría.
          </div>
        )}
      </div>
    </section>
  );
}
