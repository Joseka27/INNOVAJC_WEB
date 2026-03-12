"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Module } from "@/models/modulesModel";
import "./modulesslugpage.css";

const FETCH_LIMIT = 200;
const RECOMMEND_LIMIT = 4;

function slugify(text: string) {
  return String(text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseTextBlocks(text: string | null | undefined): string[] {
  const clean = String(text ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();

  if (!clean) return [];

  return clean
    .split(/\n\s*\n/g)
    .map((block) => block.trim())
    .filter(Boolean);
}

function formatCategoryLabel(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => {
      const lower = word.toLowerCase();
      if (lower === "erp") return "ERP";
      if (lower === "rrhh") return "RRHH";
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

function parseLines(block: string): string[] {
  return block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function isListBlock(block: string) {
  const lines = parseLines(block);
  if (!lines.length) return false;
  return lines.every((line) => /^[-•*]\s+/.test(line));
}

function cleanListLine(line: string) {
  return line.replace(/^[-•*]\s+/, "").trim();
}

function normalizeCategory(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

async function fetchAllModules(): Promise<Module[]> {
  const all: Module[] = [];
  let offset = 0;

  while (true) {
    const res = await fetch(
      `/api/modules?limit=${FETCH_LIMIT}&offset=${offset}`,
      {
        cache: "no-store",
      },
    );

    const raw = await res.text();
    let data: any = null;

    try {
      if (raw) data = JSON.parse(raw);
    } catch {
      throw new Error(`La API no devolvió JSON (status ${res.status}).`);
    }

    if (!res.ok) {
      throw new Error(data?.error ?? "Error cargando módulos");
    }

    const items: Module[] = Array.isArray(data?.items)
      ? data.items.map((m: any) => ({
          ...m,
          gallery_images: Array.isArray(m.gallery_images)
            ? m.gallery_images
            : [],
        }))
      : [];

    all.push(...items);

    if (items.length < FETCH_LIMIT) break;

    offset += FETCH_LIMIT;
    if (offset > 5000) break;
  }

  return all;
}

export default function AboutModuleDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = String(params?.slug ?? "");

  const [loading, setLoading] = useState(true);
  const [allModules, setAllModules] = useState<Module[]>([]);
  const [moduleItem, setModuleItem] = useState<Module | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        const modules = await fetchAllModules();
        const found = modules.find((m) => slugify(m.title) === slug) ?? null;

        if (!cancelled) {
          setAllModules(modules);
          setModuleItem(found);
        }
      } catch (err: any) {
        if (!cancelled) {
          setAllModules([]);
          setModuleItem(null);
          setError(err?.message ?? "No se pudo cargar el módulo.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (slug) {
      void run();
    } else {
      setLoading(false);
      setAllModules([]);
      setModuleItem(null);
    }

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const longBlocks = useMemo(
    () => parseTextBlocks(moduleItem?.long_desc),
    [moduleItem?.long_desc],
  );

  const secondBlocks = useMemo(
    () => parseTextBlocks(moduleItem?.second_text),
    [moduleItem?.second_text],
  );

  const galleryImages = useMemo(
    () =>
      Array.isArray(moduleItem?.gallery_images)
        ? moduleItem.gallery_images
        : [],
    [moduleItem],
  );

  const visibleGallery = useMemo(
    () => galleryImages.slice(0, 4),
    [galleryImages],
  );

  const hiddenCount = Math.max(0, galleryImages.length - 4);

  const selectedImage =
    selectedIndex !== null && galleryImages[selectedIndex]
      ? galleryImages[selectedIndex]
      : null;

  const recommendedModules = useMemo(() => {
    if (!moduleItem || !allModules.length) return [];

    const currentId = moduleItem.id;
    const currentCategory = normalizeCategory(moduleItem.module_category);

    const candidates = allModules.filter((m) => m.id !== currentId);

    const sameCategory = candidates
      .filter((m) => normalizeCategory(m.module_category) === currentCategory)
      .sort((a, b) => a.title.localeCompare(b.title, "es"));

    const otherCategories = candidates
      .filter((m) => normalizeCategory(m.module_category) !== currentCategory)
      .sort((a, b) => a.title.localeCompare(b.title, "es"));

    return [...sameCategory, ...otherCategories].slice(0, RECOMMEND_LIMIT);
  }, [allModules, moduleItem]);

  function openGalleryAt(index: number) {
    if (!galleryImages.length) return;
    setSelectedIndex(index);
  }

  function closeGallery() {
    setSelectedIndex(null);
  }

  function showPrevImage() {
    if (!galleryImages.length || selectedIndex === null) return;
    setSelectedIndex(
      (selectedIndex - 1 + galleryImages.length) % galleryImages.length,
    );
  }

  function showNextImage() {
    if (!galleryImages.length || selectedIndex === null) return;
    setSelectedIndex((selectedIndex + 1) % galleryImages.length);
  }

  useEffect(() => {
    if (selectedIndex === null) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeGallery();
      if (e.key === "ArrowLeft") showPrevImage();
      if (e.key === "ArrowRight") showNextImage();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedIndex, galleryImages.length]);

  if (!loading && !error && !moduleItem) {
    notFound();
  }

  return (
    <>
      <section className="pg_about_module_detail">
        <div className="pg_about_module_detail-inner">
          {loading && (
            <div className="pg_about_module_detail-empty">Cargando módulo…</div>
          )}

          {!loading && error && (
            <div className="pg_about_module_detail-empty">{error}</div>
          )}

          {!loading && !error && moduleItem && (
            <>
              <div
                className="pg_about_module_detail-hero"
                style={{
                  backgroundImage: moduleItem.banner_image_url
                    ? `url(${moduleItem.banner_image_url})`
                    : undefined,
                }}
              >
                <div className="pg_about_module_detail-overlay">
                  <span className="pg_about_module_detail-chip">
                    {formatCategoryLabel(moduleItem.module_category)}
                  </span>

                  <h1>{moduleItem.title}</h1>
                  <p>{moduleItem.short_desc}</p>
                </div>
              </div>

              <div className="pg_about_module_detail-actions">
                <Link href="/product" className="pg_about_module_detail-back">
                  ← Volver a módulos
                </Link>

                <Link
                  href="/contact"
                  className="pg_about_module_detail-contact"
                >
                  Solicitar información
                </Link>
              </div>

              {(galleryImages.length > 0 || longBlocks.length > 0) && (
                <section className="pg_about_module_detail-dual">
                  {galleryImages.length > 0 && (
                    <div className="pg_about_module_detail-gallerySection">
                      <h2 className="pg_about_module_detail-title">
                        Galería del módulo
                      </h2>

                      <div className="pg_about_module_detail-galleryGrid">
                        {visibleGallery.map((img, index) => {
                          const isLastVisible = index === 3;
                          const showMoreOverlay =
                            isLastVisible && hiddenCount > 0;

                          return (
                            <button
                              key={`${img}-${index}`}
                              type="button"
                              className="pg_about_module_detail-thumb"
                              onClick={() => openGalleryAt(index)}
                              aria-label={`Abrir imagen ${index + 1}`}
                            >
                              <Image
                                src={img}
                                alt={`${moduleItem.title} imagen ${index + 1}`}
                                fill
                                unoptimized
                                className="pg_about_module_detail-thumbImg"
                              />

                              <span className="pg_about_module_detail-thumbOverlay">
                                <span className="pg_about_module_detail-zoomIcon">
                                  <Image
                                    src="/images/mainpage/lupa.png"
                                    alt=""
                                    width={16}
                                    height={16}
                                    className="pg_prices-searchIconImg"
                                  />
                                </span>
                              </span>

                              {showMoreOverlay && (
                                <span className="pg_about_module_detail-moreCount">
                                  +{hiddenCount}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {longBlocks.length > 0 && (
                    <div className="pg_about_module_detail-textPanel">
                      <h2 className="pg_about_module_detail-title">
                        Descripción del Modulo
                      </h2>

                      <div className="pg_about_module_detail-body">
                        {longBlocks.map((block, index) => {
                          if (isListBlock(block)) {
                            const lines = parseLines(block).map(cleanListLine);

                            return (
                              <div
                                key={`long-list-${index}`}
                                className="pg_about_module_detail-section"
                              >
                                <ul className="pg_about_module_detail-list">
                                  {lines.map((line, i) => (
                                    <li key={`long-li-${index}-${i}`}>
                                      {line}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={`long-paragraph-${index}`}
                              className="pg_about_module_detail-section"
                            >
                              <p className="pg_about_module_detail-paragraph">
                                {block}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {(secondBlocks.length > 0 || moduleItem.featured_image_url) && (
                <section className="pg_about_module_detail-secondary">
                  <div className="pg_about_module_detail-secondaryText">
                    {secondBlocks.length > 0 && (
                      <div className="pg_about_module_detail-body">
                        {secondBlocks.map((block, index) => {
                          if (isListBlock(block)) {
                            const lines = parseLines(block).map(cleanListLine);

                            return (
                              <div
                                key={`second-list-${index}`}
                                className="pg_about_module_detail-section"
                              >
                                <ul className="pg_about_module_detail-list">
                                  {lines.map((line, i) => (
                                    <li key={`second-li-${index}-${i}`}>
                                      {line}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={`second-paragraph-${index}`}
                              className="pg_about_module_detail-section"
                            >
                              <p className="pg_about_module_detail-paragraph">
                                {block}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {moduleItem.featured_image_url && (
                    <div className="pg_about_module_detail-featuredWrap">
                      <button
                        type="button"
                        className="pg_about_module_detail-featuredButton"
                        onClick={() => {
                          if (galleryImages.length > 0) {
                            openGalleryAt(0);
                          }
                        }}
                        aria-label="Ver galería"
                      >
                        <div className="pg_about_module_detail-featuredImageBox">
                          <Image
                            src={moduleItem.featured_image_url}
                            alt={`${moduleItem.title} imagen destacada`}
                            fill
                            unoptimized
                            className="pg_about_module_detail-featuredImage"
                          />
                        </div>
                      </button>
                    </div>
                  )}
                </section>
              )}

              {recommendedModules.length > 0 && (
                <section className="pg_about_module_detail-recommendations">
                  <div className="pg_about_module_detail-recommendationsHead">
                    <h2>Otros módulos recomendados</h2>
                    <p>
                      Te pueden interesar más opciones relacionadas con este
                      módulo.
                    </p>
                  </div>

                  <div className="pg_about_module_detail-recommendationsGrid">
                    {recommendedModules.map((item) => {
                      const itemSlug = slugify(item.title);
                      const sameCategory =
                        normalizeCategory(item.module_category) ===
                        normalizeCategory(moduleItem.module_category);

                      return (
                        <article
                          key={item.id}
                          className="pg_about_module_detail-recommendationCard"
                        >
                          <div
                            className="pg_about_module_detail-recommendationHero"
                            style={{
                              backgroundImage: item.banner_image_url
                                ? `url(${item.banner_image_url})`
                                : undefined,
                            }}
                          >
                            <div className="pg_about_module_detail-recommendationOverlay">
                              <span className="pg_about_module_detail-recommendationChip">
                                {formatCategoryLabel(item.module_category)}
                              </span>

                              {sameCategory && (
                                <span className="pg_about_module_detail-recommendationBadge">
                                  Misma categoría
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="pg_about_module_detail-recommendationBody">
                            <h3>{item.title}</h3>
                            <p>{item.short_desc}</p>

                            <Link
                              href={`/products/${itemSlug}`}
                              className="pg_about_module_detail-recommendationLink"
                            >
                              Visitar módulo
                            </Link>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </section>

      {selectedImage && (
        <div className="pg_about_module_detail-lightbox" onClick={closeGallery}>
          <div
            className="pg_about_module_detail-lightboxInner"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="pg_about_module_detail-lightboxClose"
              onClick={closeGallery}
              aria-label="Cerrar imagen"
            >
              ×
            </button>

            <button
              type="button"
              className="pg_about_module_detail-lightboxArrow pg_about_module_detail-lightboxArrowLeft"
              onClick={showPrevImage}
              aria-label="Imagen anterior"
            >
              ‹
            </button>

            <img
              src={selectedImage}
              alt="Vista ampliada"
              className="pg_about_module_detail-lightboxImg"
            />

            <button
              type="button"
              className="pg_about_module_detail-lightboxArrow pg_about_module_detail-lightboxArrowRight"
              onClick={showNextImage}
              aria-label="Imagen siguiente"
            >
              ›
            </button>

            <div className="pg_about_module_detail-lightboxCounter">
              {selectedIndex! + 1} / {galleryImages.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
