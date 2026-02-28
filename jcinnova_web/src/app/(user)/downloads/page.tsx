"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import "./user_downloads.css";
import { createClient } from "@/lib/supabase/browserClient";

type Platform = "Todos" | "Software" | "Documentacion" | "Soporte" | "Reportes";

type DownloadRow = {
  id: number;
  title: string | null;
  description: string | null;
  size: string | null;
  version: string | null;
  type_file: Platform | null;
  app_image: string | null;
  file_url: string | null;
  requirements: string | null;
  created_at?: string | null;
};

const DOWNLOADS_BUCKET = "downloads";

const PLATFORMS: Array<Platform | "Todos"> = [
  "Todos",
  "Software",
  "Documentacion",
  "Soporte",
  "Reportes",
];

//limite de 500apps
const FETCH_LIMIT = 500;

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

export default function Downloads() {
  const supabase = createClient();

  const [active, setActive] = useState<(typeof PLATFORMS)[number]>("Todos");
  const [q, setQ] = useState("");

  const [rows, setRows] = useState<DownloadRow[]>([]);
  const [loading, setLoading] = useState(false);
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
        const qs = new URLSearchParams();
        qs.set("limit", String(FETCH_LIMIT));
        qs.set("offset", String(offset));

        const res = await fetch(`/api/downloads?${qs.toString()}`, {
          method: "GET",
          cache: "no-store",
        });

        const raw = await res.text();
        let data: any = null;

        try {
          data = raw ? JSON.parse(raw) : null;
        } catch {
          throw new Error(
            `La API no devolvió JSON. Revisa /api/downloads (status ${res.status}).`,
          );
        }

        if (!res.ok) throw new Error(data?.error ?? "Error cargando downloads");

        const batch: DownloadRow[] = Array.isArray(data?.items)
          ? data.items
          : [];
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
    } finally {
      setLoading(false);
    }
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
          .createSignedUrl(path, 60 * 30); // 30 min

        if (!error && data?.signedUrl) next[path] = data.signedUrl;
      }),
    );

    if (Object.keys(next).length) {
      setSignedUrlByPath((prev) => ({ ...prev, ...next }));
    }
  }

  useEffect(() => {
    fetchAllDownloads();
  }, []);

  const downloadsUI = useMemo(() => {
    return rows
      .filter((r) => typeof r.id === "number")
      .map((r) => {
        const platform = (r.type_file ?? "windows") as Platform;

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

  return (
    <div className="pg_down">
      {/* HERO */}
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
                versión y requisitos, documentacion, reportes, entre otros. Todo
                en un solo lugar para tu empresa.
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

            <motion.div
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
            </motion.div>
          </div>
        </div>
      </section>

      <section className="pg_down-list" id="descargas">
        <div className="pg_down-listInner">
          <div className="pg_down-head">
            <h2>Descargas</h2>
            <p>
              Aqui podras encontrar todo lo que necesites, desde el sorftware
              hasta documentacion adecuada
            </p>
          </div>

          <div className="pg_down-toolbar">
            <div
              className="pg_down-filters"
              role="tablist"
              aria-label="Filtros"
            >
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`pg_down-filterBtn ${active === p ? "is-active" : ""}`}
                  onClick={() => setActive(p)}
                >
                  {p === "Todos" ? "Todos" : p}
                </button>
              ))}
            </div>

            <div className="pg_down-search">
              <input
                className="pg_down-searchInput"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar (ej: SECE, Windows, v1.8...)"
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
              No hay resultados para esta categoria
            </div>
          ) : (
            <div className="pg_down-grid">
              {filtered.map((d) => (
                <article key={d.id} className="pg_down-card">
                  <div className="pg_down-cardTop">
                    <div className="pg_down-app">
                      <div className="pg_down-appLogo">
                        {d.coverUrl ? (
                          <img
                            src={d.coverUrl}
                            alt={d.name}
                            className="pg_down-appLogoImg"
                            width={56}
                            height={44}
                            loading="lazy"
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
                            {d.platform.toUpperCase()}
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
                        {d.requirements.map((r, idx) => (
                          <li key={`${d.id}-req-${idx}`}>{r}</li>
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
              Descarga siempre desde este Sitio ofiacial. Si tu antivirus o
              muestra advertencias, valida que el archivo provenga de esta URL y
              que tu equipo cuente con las caracteristicas minimas que el
              sistema requiere.
            </p>
          </div>

          <div className="pg_down-safetyGrid">
            <div className="pg_down-safetyCard">
              <h3>Recomendaciones</h3>
              <ul>
                <li>
                  Verifica que el sistema siempre este Actualizado a su ultima
                  version por seguridad
                </li>
                <li>No instales desde paginas no oficiales</li>
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
  );
}
