"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LazyMotion, m, domAnimation } from "framer-motion";
import "./user_downloads.css";
import { createClient } from "@/lib/supabase/browserClient";

type DownloadRow = {
  id: number;
  title: string | null;
  description: string | null;
  size: string | null;
  version: string | null;
  type_file: string | null;
  app_image: string | null;
  file_url: string | null;
  requirements: string | null;
  created_at?: string | null;
};

type CategoryRow = {
  id: number;
  page: string;
  name: string;
  created_at?: string | null;
};

const DOWNLOADS_BUCKET = "downloads";
const PAGE_KEY = "downloads";
const FETCH_LIMIT = 500;

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

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const day = String(d.getDate()).padStart(2, "0");
  const mon = String(d.getMonth() + 1).padStart(2, "0");
  const yr = d.getFullYear();
  return `${day}/${mon}/${yr}`;
}

function parseRequirements(req: string | null): string[] {
  const s = (req ?? "").trim();
  if (!s) return [];
  return s
    .split(/\r?\n|;|,/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

async function fetchDownloadPage(
  offset: number,
  limit: number,
): Promise<DownloadRow[]> {
  const qs = new URLSearchParams();
  qs.set("limit", String(limit));
  qs.set("offset", String(offset));

  const res = await fetch(`/api/downloads?${qs.toString()}`, {
    method: "GET",
    cache: "no-store",
  });

  const raw = await res.text();
  let data: any = null;
  try {
    if (raw) data = JSON.parse(raw);
  } catch {
    throw new Error(
      `La API no devolvió JSON. Revisa /api/downloads (status ${res.status}).`,
    );
  }

  if (!res.ok) {
    let errMsg = "Error cargando downloads";
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

export default function Downloads() {
  const supabase = createClient();

  const [active, setActive] = useState("Todos");
  const [q, setQ] = useState("");

  const [rows, setRows] = useState<DownloadRow[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [signedUrlByPath, setSignedUrlByPath] = useState<
    Record<string, string>
  >({});

  async function fetchAllDownloads() {
    setLoading(true);
    setError(null);

    try {
      const all: DownloadRow[] = [];
      let offset = 0;

      while (true) {
        const batch = await fetchDownloadPage(offset, FETCH_LIMIT);
        all.push(...batch);

        if (batch.length < FETCH_LIMIT) break;

        offset += FETCH_LIMIT;
        if (offset > 5000) break;
      }

      setRows(all);
      void prefetchCovers(all);
    } catch (e: any) {
      setError(e?.message ?? "Error inesperado cargando downloads.");
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

  async function prefetchCovers(items: DownloadRow[]) {
    const paths = Array.from(
      new Set(
        items
          .map((d) => d.app_image)
          .filter((x): x is string => typeof x === "string" && !!x),
      ),
    );

    if (paths.length === 0) return;

    const next: Record<string, string> = {};

    await Promise.all(
      paths.map(async (path) => {
        if (signedUrlByPath[path]) return;

        const { data, error } = await supabase.storage
          .from(DOWNLOADS_BUCKET)
          .createSignedUrl(path, 60 * 30);

        if (!error && data?.signedUrl) next[path] = data.signedUrl;
      }),
    );

    if (Object.keys(next).length) {
      setSignedUrlByPath((prev) => ({ ...prev, ...next }));
    }
  }

  useEffect(() => {
    void Promise.all([fetchAllDownloads(), loadCategories()]);
  }, []);

  const downloadsUI = useMemo(() => {
    return rows
      .filter((r) => typeof r.id === "number")
      .map((r) => {
        const platform = (r.type_file ?? "").toString();

        const coverUrl =
          r.app_image && signedUrlByPath[r.app_image]
            ? signedUrlByPath[r.app_image]
            : null;

        const updatedISO = (
          r.created_at ?? new Date().toISOString()
        ).toString();

        return {
          id: r.id,
          name: (r.title ?? "App").toString(),
          tagline: (r.description ?? "").toString(),
          platform,
          version: (r.version ?? "—").toString(),
          size: (r.size ?? "—").toString(),
          updatedISO,
          fileHref: `/api/downloads/${r.id}/download`,
          coverUrl,
          requirements: parseRequirements(r.requirements),
        };
      })
      .sort((a, b) => (b.updatedISO > a.updatedISO ? 1 : -1));
  }, [rows, signedUrlByPath]);

  const filtered = useMemo(() => {
    const base =
      active === "Todos"
        ? downloadsUI
        : downloadsUI.filter((d) => d.platform === active);

    const qq = q.trim().toLowerCase();
    if (!qq) return base;

    return base.filter((d) => {
      const haystack =
        `${d.name} ${d.tagline} ${d.platform} ${d.version}`.toLowerCase();
      return haystack.includes(qq);
    });
  }, [active, q, downloadsUI]);

  const filterOptions = useMemo(() => ["Todos", ...categories], [categories]);

  return (
    <LazyMotion features={domAnimation}>
      <div className="pg_down">
        <section className="pg_down-hero" id="inicio">
          <div className="pg_down-heroInner">
            <div className="pg_down-heroSplit">
              <div className="pg_down-heroLeft">
                <span className="pg_down-pill">Centro de descargas</span>

                <h1 className="pg_down-title">
                  Descarga nuestras{" "}
                  <span className="pg_down-grad">aplicaciones</span> y
                  herramientas
                </h1>

                <p className="pg_down-subtitle">
                  Aqui podras encontrar nuestro instalador oficial, notas de
                  versión y requisitos, documentacion, reportes, entre otros.
                  Todo en un solo lugar para tu empresa.
                </p>

                <div className="pg_down-actions">
                  <a className="pg_down-btnPrimary" href="#descargas">
                    Ver descargas
                  </a>
                  <Link className="pg_down-btnGhost" href="/contact">
                    Soporte / Contacto
                  </Link>
                </div>
              </div>

              <m.div
                className="pg_down-heroRight"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                viewport={{ once: true }}
              >
                <div className="pg_down-heroCard">
                  <div className="pg_down-heroBrand">
                    <Image
                      src="/images/LogoInnova.png"
                      alt="InnovaJC"
                      width={90}
                      height={70}
                      priority
                      className="pg_down-heroLogo"
                    />
                    <div>
                      <div className="pg_down-heroBrandTitle">INNOVA JC</div>
                      <div className="pg_down-heroBrandSub">
                        Descargas oficiales
                      </div>
                    </div>
                  </div>

                  <div className="pg_down-heroStats">
                    <div className="pg_down-stat">
                      <div className="pg_down-statNum">Apps</div>
                      <div className="pg_down-statLabel">En un solo lugar</div>
                    </div>
                    <div className="pg_down-stat">
                      <div className="pg_down-statNum">24/7</div>
                      <div className="pg_down-statLabel">Acceso</div>
                    </div>
                    <div className="pg_down-stat">
                      <div className="pg_down-statNum">Seguridad</div>
                      <div className="pg_down-statLabel">Pagina oficial</div>
                    </div>
                  </div>

                  <div className="pg_down-heroHint">
                    Pagina oficial de Descargas en InnovaJC
                  </div>
                </div>
              </m.div>
            </div>
          </div>
        </section>

        <section className="pg_down-list" id="descargas">
          <div className="pg_down-listInner">
            <div className="pg_down-head">
              <h2>Descargas</h2>
              <p>
                Aqui podras encontrar todo lo que necesites, desde el software
                hasta documentación adecuada
              </p>
            </div>

            <div className="pg_down-toolbar">
              <div
                className="pg_down-filters"
                role="tablist"
                aria-label="Filtros"
              >
                {filterOptions.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`pg_down-filterBtn ${active === p ? "is-active" : ""}`}
                    onClick={() => setActive(p)}
                    disabled={categoriesLoading && p !== "Todos"}
                  >
                    {p === "Todos" ? "Todos" : formatCategoryLabel(p)}
                  </button>
                ))}
              </div>

              <div className="pg_down-search">
                <span className="pg_down-searchIcon" aria-hidden="true">
                  <Image
                    src="/images/mainpage/lupa.png"
                    alt=""
                    width={16}
                    height={16}
                  />
                </span>

                <input
                  className="pg_down-searchInput"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar archivos"
                  aria-label="Buscar descargas"
                />
              </div>
            </div>

            {loading ? (
              <div className="pg_down-empty">Cargando descargas…</div>
            ) : error ? (
              <div className="pg_down-empty">❌ {error}</div>
            ) : filtered.length === 0 ? (
              <div className="pg_down-empty">
                No hay resultados para esta categoría
              </div>
            ) : (
              <div className="pg_down-grid">
                {filtered.map((d) => (
                  <article key={d.id} className="pg_down-card">
                    <div className="pg_down-cardTop">
                      <div className="pg_down-app">
                        <div className="pg_down-appLogo">
                          {d.coverUrl ? (
                            <Image
                              src={d.coverUrl}
                              alt={d.name}
                              width={56}
                              height={44}
                              className="pg_down-appLogoImg"
                              unoptimized
                            />
                          ) : (
                            <Image
                              src="/images/LogoInnova.png"
                              alt={d.name}
                              width={56}
                              height={44}
                              className="pg_down-appLogoImg"
                            />
                          )}
                        </div>

                        <div className="pg_down-appInfo">
                          <div className="pg_down-appNameRow">
                            <h3 className="pg_down-appName">{d.name}</h3>
                            <span className="pg_down-chip">
                              {d.platform
                                ? formatCategoryLabel(d.platform)
                                : "Sin categoría"}
                            </span>
                          </div>
                          <div className="pg_down-appTagline">{d.tagline}</div>
                        </div>
                      </div>

                      <div className="pg_down-meta">
                        <div className="pg_down-metaItem">
                          <span>Versión</span>
                          <strong>{d.version}</strong>
                        </div>
                        <div className="pg_down-metaItem">
                          <span>Tamaño</span>
                          <strong>{d.size}</strong>
                        </div>
                        <div className="pg_down-metaItem">
                          <span>Actualizado</span>
                          <strong>{fmtDate(d.updatedISO)}</strong>
                        </div>
                      </div>
                    </div>

                    {d.requirements?.length ? (
                      <div className="pg_down-req">
                        <div className="pg_down-reqTitle">Requisitos</div>

                        <ul className="pg_down-reqList">
                          {d.requirements.map((r) => (
                            <li key={`${d.id}-req-${r}`}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    <div className="pg_down-cardActions">
                      <a className="pg_down-btnPrimary" href={d.fileHref}>
                        Descargar
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="pg_down-safety" id="seguridad">
          <div className="pg_down-safetyInner">
            <div className="pg_down-safetyHead">
              <span className="pg_down-pill-section3">Recomendaciones</span>
              <h2 className="pg_down-safetyTitle">
                Seguridad y requisitos mínimos
              </h2>
              <p className="pg_down-safetyText">
                Descarga siempre desde este sitio oficial. Si tu antivirus
                muestra advertencias, valida que el archivo provenga de esta URL
                y que tu equipo cuente con las características mínimas que el
                sistema requiere.
              </p>
            </div>

            <div className="pg_down-safetyGrid">
              <div className="pg_down-safetyCard">
                <h3>Recomendaciones</h3>
                <ul>
                  <li>Verifica que el sistema esté actualizado.</li>
                  <li>No instales desde páginas no oficiales.</li>
                  <li>Si tienes dudas, contáctanos antes de instalar.</li>
                </ul>
              </div>

              <div className="pg_down-safetyCard">
                <h3>Soporte</h3>
                <ul>
                  <li>Instalación y configuración guiada.</li>
                  <li>Resolución de errores y actualizaciones.</li>
                  <li>Capacitación básica para tu equipo.</li>
                </ul>
                <Link className="pg_down-safetyCta" href="/contact">
                  Ir a contacto →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </LazyMotion>
  );
}
