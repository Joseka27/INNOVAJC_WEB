"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import "./user_downloads.css";

type Platform = "Windows" | "macOS" | "Linux" | "Web" | "Android" | "iOS";

type DownloadItem = {
  id: string;
  name: string;
  tagline: string;
  platform: Platform;
  version: string;
  size: string;
  updated: string; // "2026-02-11" etc
  fileUrl: string;
  notesUrl?: string;
  image: string; // /images/...
  requirements?: string[];
  highlights?: string[];
};

const downloads: DownloadItem[] = [
  {
    id: "sece-desktop-win",
    name: "SECE Desktop",
    tagline: "ERP completo para tu operación diaria.",
    platform: "Windows",
    version: "v1.8.2",
    size: "120 MB",
    updated: "2026-02-11",
    fileUrl: "/downloads/SECE-Desktop-Windows.exe",
    notesUrl: "/downloads/release-notes/sece-desktop",
    image: "/images/LogoInnova.png",
    requirements: [
      "Windows 10/11",
      "4GB RAM (8GB recomendado)",
      "500MB libres",
    ],
    highlights: [
      "Instalador guiado",
      "Actualizaciones automáticas",
      "Soporte técnico",
    ],
  },
  {
    id: "sece-web",
    name: "SECE Web",
    tagline: "Accede desde cualquier dispositivo sin instalar.",
    platform: "Web",
    version: "v2.3.0",
    size: "—",
    updated: "2026-02-05",
    fileUrl: "/login",
    notesUrl: "/downloads/release-notes/sece-web",
    image: "/images/LogoInnova.png",
    requirements: ["Chrome/Edge/Firefox actualizado", "Conexión estable"],
    highlights: ["Multi-sucursal", "Reportes exportables", "Acceso por roles"],
  },
  {
    id: "sece-mobile-android",
    name: "SECE Mobile",
    tagline: "Consultas rápidas y operaciones básicas.",
    platform: "Android",
    version: "v0.9.4",
    size: "28 MB",
    updated: "2026-01-30",
    fileUrl: "/downloads/SECE-Mobile-Android.apk",
    notesUrl: "/downloads/release-notes/sece-mobile",
    image: "/images/LogoInnova.png",
    requirements: ["Android 10+", "Permisos: cámara (opcional)"],
    highlights: ["Inventario rápido", "Pedidos", "Notificaciones"],
  },
];

const PLATFORMS: Array<Platform | "Todos"> = [
  "Todos",
  "Windows",
  "macOS",
  "Linux",
  "Web",
  "Android",
  "iOS",
];

function fmtDate(iso: string) {
  // formato simple tipo 2026-02-11 -> 11/02/2026
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export default function Downloads() {
  const [active, setActive] = useState<(typeof PLATFORMS)[number]>("Todos");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const base =
      active === "Todos"
        ? downloads
        : downloads.filter((d) => d.platform === active);

    const qq = q.trim().toLowerCase();
    if (!qq) return base;

    return base.filter((d) => {
      const haystack =
        `${d.name} ${d.tagline} ${d.platform} ${d.version}`.toLowerCase();
      return haystack.includes(qq);
    });
  }, [active, q]);

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
                Instalador oficial, notas de versión y requisitos. Todo en un
                solo lugar para que tu empresa mantenga el control con SECE.
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
                      Descargas oficiales SECE
                    </div>
                  </div>
                </div>

                <div className="pg_down-heroStats">
                  <div className="pg_down-stat">
                    <div className="pg_down-statNum">{downloads.length}</div>
                    <div className="pg_down-statLabel">Apps disponibles</div>
                  </div>
                  <div className="pg_down-stat">
                    <div className="pg_down-statNum">24/7</div>
                    <div className="pg_down-statLabel">Acceso</div>
                  </div>
                  <div className="pg_down-stat">
                    <div className="pg_down-statNum">Seguridad</div>
                    <div className="pg_down-statLabel">Fuente oficial</div>
                  </div>
                </div>

                <div className="pg_down-heroHint">
                  El sistema ideal para el control de tu empresa
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* DESCARGAS */}
      <section className="pg_down-list" id="descargas">
        <div className="pg_down-listInner">
          <div className="pg_down-head">
            <h2>Descargas</h2>
            <p>
              Filtra por plataforma y encuentra la versión adecuada para tu
              empresa.
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
                  {p}
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

          {filtered.length === 0 ? (
            <div className="pg_down-empty">
              No hay resultados con esos filtros.
            </div>
          ) : (
            <div className="pg_down-grid">
              {filtered.map((d) => (
                <article key={d.id} className="pg_down-card">
                  <div className="pg_down-cardTop">
                    <div className="pg_down-app">
                      <div className="pg_down-appLogo">
                        <Image
                          src={d.image}
                          alt={d.name}
                          width={56}
                          height={44}
                          className="pg_down-appLogoImg"
                        />
                      </div>

                      <div className="pg_down-appInfo">
                        <div className="pg_down-appNameRow">
                          <h3 className="pg_down-appName">{d.name}</h3>
                          <span className="pg_down-chip">{d.platform}</span>
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
                        <strong>{fmtDate(d.updated)}</strong>
                      </div>
                    </div>
                  </div>

                  {d.highlights?.length ? (
                    <ul className="pg_down-highlights">
                      {d.highlights.slice(0, 3).map((h) => (
                        <li key={h} className="pg_down-hi">
                          <span className="pg_down-dot" aria-hidden />
                          {h}
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {d.requirements?.length ? (
                    <div className="pg_down-req">
                      <div className="pg_down-reqTitle">Requisitos</div>
                      <ul className="pg_down-reqList">
                        {d.requirements.slice(0, 3).map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <div className="pg_down-cardActions">
                    <a className="pg_down-btnPrimary" href={d.fileUrl}>
                      {d.platform === "Web" ? "Abrir" : "Descargar"}
                    </a>
                    {d.notesUrl ? (
                      <a className="pg_down-btnGhost" href={d.notesUrl}>
                        Notas
                      </a>
                    ) : (
                      <span className="pg_down-btnGhost is-disabled">
                        Notas
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SEGURIDAD / INFO */}
      <section className="pg_down-safety" id="seguridad">
        <div className="pg_down-safetyInner">
          <div className="pg_down-safetyHead">
            <span className="pg_down-pill">Recomendaciones</span>
            <h2 className="pg_down-safetyTitle">
              Seguridad y requisitos mínimos
            </h2>
            <p className="pg_down-safetyText">
              Para evitar instalaciones corruptas o archivos modificados,
              descarga siempre desde este Centro de Descargas. Si tu antivirus o
              Windows SmartScreen muestra advertencias, valida que el archivo
              provenga de esta URL.
            </p>
          </div>

          <div className="pg_down-safetyGrid">
            <div className="pg_down-safetyCard">
              <h3>Buenas prácticas</h3>
              <ul>
                <li>Verifica la versión y fecha de actualización.</li>
                <li>No instales desde enlaces compartidos por terceros.</li>
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
