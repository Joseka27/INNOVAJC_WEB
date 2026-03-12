"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import type { Module } from "@/models/modulesModel";
import { createClient } from "@/lib/supabase/browserClient";
import { resizeImageToWebp } from "@/lib/images/resizeImage";
import {
  uploadModuleImage,
  uploadModuleGalleryImages,
  deleteModuleImage,
  extractModuleStoragePath,
} from "@/lib/storage/modulesBucket";

import "./dashboard_modules.css";

import {
  Toasts,
  useToasts,
} from "@/app/(admin)/admin/_admin_components/useToast";
import { useAdminGate } from "@/app/(admin)/admin/_admin_components/useAdmingate";
import { useIdleLogout } from "@/app/(admin)/admin/_admin_components/useIdlelogout";
import CategoryManager, {
  type CategoryRow,
} from "@/app/(admin)/admin/_admin_components/categoryManage";

const PAGE_SIZE = 10;
const SHORT_DESC_LIMIT = 150;
const LONG_DESC_LIMIT = 4000;
const SECOND_TEXT_LIMIT = 10000;
const MAX_GALLERY_FILES = 20;
const PAGE_KEY = "modules";

type PreviewItem = {
  file: File;
  previewUrl: string;
};

function fileListToArray(list: FileList | null): File[] {
  return list ? Array.from(list) : [];
}

function safeArray(v: string[] | null | undefined) {
  return Array.isArray(v) ? v : [];
}

function cleanText(v: string) {
  return v.trim();
}

function makePreviewItems(files: File[]): PreviewItem[] {
  return files.map((file) => ({
    file,
    previewUrl: URL.createObjectURL(file),
  }));
}

function revokePreviewItems(items: PreviewItem[]) {
  for (const item of items) {
    URL.revokeObjectURL(item.previewUrl);
  }
}

function formatCategoryLabel(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => {
      if (word === "rrhh") return "RRHH";
      if (word === "erp") return "ERP";
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

export default function AdminModulesPage() {
  const router = useRouter();
  const supabase = createClient();

  const { toasts, push, remove, clearAll } = useToasts();
  const { booting, userEmail, isAdmin } = useAdminGate();

  useIdleLogout(push, {
    idleMs: 30 * 60 * 1000,
    sessionMaxMs: 60 * 60 * 1000,
  });

  const createBannerRef = useRef<HTMLInputElement | null>(null);
  const createFeaturedRef = useRef<HTMLInputElement | null>(null);
  const createGalleryRef = useRef<HTMLInputElement | null>(null);

  const editBannerRef = useRef<HTMLInputElement | null>(null);
  const editFeaturedRef = useRef<HTMLInputElement | null>(null);
  const editGalleryRef = useRef<HTMLInputElement | null>(null);
  const editBoxRef = useRef<HTMLDivElement | null>(null);

  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);

  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  const [page, setPage] = useState(0);
  const [total, setTotal] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("Todos");

  // CREATE
  const [title, setTitle] = useState("");
  const [moduleCategory, setModuleCategory] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [longDesc, setLongDesc] = useState("");
  const [secondText, setSecondText] = useState("");

  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [featuredFile, setFeaturedFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<PreviewItem[]>([]);

  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | null>(null);
  const [featuredPreviewUrl, setFeaturedPreviewUrl] = useState<string | null>(
    null,
  );

  const [creating, setCreating] = useState(false);

  // EDIT
  const [editingId, setEditingId] = useState<number | null>(null);

  const editingModule = useMemo(
    () => modules.find((m) => m.id === editingId) ?? null,
    [modules, editingId],
  );

  const [editTitle, setEditTitle] = useState("");
  const [editModuleCategory, setEditModuleCategory] = useState("");
  const [editShortDesc, setEditShortDesc] = useState("");
  const [editLongDesc, setEditLongDesc] = useState("");
  const [editSecondText, setEditSecondText] = useState("");

  const [editBannerFile, setEditBannerFile] = useState<File | null>(null);
  const [editFeaturedFile, setEditFeaturedFile] = useState<File | null>(null);
  const [editGalleryFiles, setEditGalleryFiles] = useState<File[]>([]);
  const [editGalleryPreviews, setEditGalleryPreviews] = useState<PreviewItem[]>(
    [],
  );

  const [editBannerPreviewUrl, setEditBannerPreviewUrl] = useState<
    string | null
  >(null);
  const [editFeaturedPreviewUrl, setEditFeaturedPreviewUrl] = useState<
    string | null
  >(null);

  const [editExistingGallery, setEditExistingGallery] = useState<string[]>([]);
  const [editRemoveFeatured, setEditRemoveFeatured] = useState(false);

  const [saving, setSaving] = useState(false);

  const maxPage =
    total !== null ? Math.max(0, Math.ceil(total / PAGE_SIZE) - 1) : null;

  const isLastPage =
    maxPage !== null ? page >= maxPage : modules.length < PAGE_SIZE;

  const filteredModules = useMemo(() => {
    const q = query.trim().toLowerCase();

    return modules.filter((m) => {
      const matchesCategory =
        filterCategory === "Todos" || m.module_category === filterCategory;

      if (!matchesCategory) return false;

      if (!q) return true;

      const hay =
        `${m.title ?? ""} ${m.module_category ?? ""} ${m.short_desc ?? ""} ${m.long_desc ?? ""} ${m.second_text ?? ""}`.toLowerCase();

      return hay.includes(q);
    });
  }, [modules, query, filterCategory]);

  useEffect(() => {
    if (!bannerFile) {
      setBannerPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(bannerFile);
    setBannerPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [bannerFile]);

  useEffect(() => {
    if (!featuredFile) {
      setFeaturedPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(featuredFile);
    setFeaturedPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [featuredFile]);

  useEffect(() => {
    if (!editBannerFile) {
      setEditBannerPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(editBannerFile);
    setEditBannerPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [editBannerFile]);

  useEffect(() => {
    if (!editFeaturedFile) {
      setEditFeaturedPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(editFeaturedFile);
    setEditFeaturedPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [editFeaturedFile]);

  useEffect(() => {
    return () => {
      revokePreviewItems(galleryPreviews);
      revokePreviewItems(editGalleryPreviews);
    };
  }, [galleryPreviews, editGalleryPreviews]);

  function setCreateGalleryWithPreviews(files: File[]) {
    setGalleryFiles(files);

    setGalleryPreviews((prev) => {
      revokePreviewItems(prev);
      return makePreviewItems(files);
    });
  }

  function setEditGalleryWithPreviews(files: File[]) {
    setEditGalleryFiles(files);

    setEditGalleryPreviews((prev) => {
      revokePreviewItems(prev);
      return makePreviewItems(files);
    });
  }

  function removeNewCreateGalleryAt(index: number) {
    setGalleryPreviews((prev) => {
      const item = prev[index];
      if (item) URL.revokeObjectURL(item.previewUrl);

      const next = prev.filter((_, i) => i !== index);
      setGalleryFiles(next.map((x) => x.file));
      return next;
    });
  }

  function removeNewEditGalleryAt(index: number) {
    setEditGalleryPreviews((prev) => {
      const item = prev[index];
      if (item) URL.revokeObjectURL(item.previewUrl);

      const next = prev.filter((_, i) => i !== index);
      setEditGalleryFiles(next.map((x) => x.file));
      return next;
    });
  }

  function removeExistingEditGalleryAt(index: number) {
    setEditExistingGallery((prev) => prev.filter((_, i) => i !== index));
  }

  async function resetForms() {
    revokePreviewItems(galleryPreviews);
    revokePreviewItems(editGalleryPreviews);

    setTitle("");
    setModuleCategory("");
    setShortDesc("");
    setLongDesc("");
    setSecondText("");

    setBannerFile(null);
    setFeaturedFile(null);
    setGalleryFiles([]);
    setGalleryPreviews([]);
    setBannerPreviewUrl(null);
    setFeaturedPreviewUrl(null);

    if (createBannerRef.current) createBannerRef.current.value = "";
    if (createFeaturedRef.current) createFeaturedRef.current.value = "";
    if (createGalleryRef.current) createGalleryRef.current.value = "";

    setEditingId(null);
    setEditTitle("");
    setEditModuleCategory("");
    setEditShortDesc("");
    setEditLongDesc("");
    setEditSecondText("");

    setEditBannerFile(null);
    setEditFeaturedFile(null);
    setEditGalleryFiles([]);
    setEditGalleryPreviews([]);
    setEditBannerPreviewUrl(null);
    setEditFeaturedPreviewUrl(null);
    setEditExistingGallery([]);
    setEditRemoveFeatured(false);

    if (editBannerRef.current) editBannerRef.current.value = "";
    if (editFeaturedRef.current) editFeaturedRef.current.value = "";
    if (editGalleryRef.current) editGalleryRef.current.value = "";
  }

  function syncCategoriesState(items: CategoryRow[]) {
    setCategories(items);

    setFilterCategory((prev) => {
      if (prev === "Todos") return prev;
      return items.some((x) => x.name === prev) ? prev : "Todos";
    });

    setModuleCategory((prev) =>
      prev && items.some((x) => x.name === prev) ? prev : "",
    );

    setEditModuleCategory((prev) =>
      prev && items.some((x) => x.name === prev) ? prev : "",
    );
  }

  useEffect(() => {
    if (!booting && userEmail && isAdmin) {
      void Promise.all([loadCategories(), loadModules(0)]);
    }
  }, [booting, userEmail, isAdmin]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", cache: "no-store" });

    clearAll();
    await resetForms();
    setModules([]);
    setCategories([]);
    setTotal(null);
    setPage(0);

    router.replace("/admin");
  }

  async function loadCategories() {
    setCategoriesLoading(true);

    try {
      const res = await fetch(`/api/categories?page=${PAGE_KEY}`, {
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
        throw new Error(data?.error ?? "Error cargando categorías");
      }

      const items: CategoryRow[] = Array.isArray(data) ? data : [];
      syncCategoriesState(items);
    } catch (err: any) {
      push({
        type: "error",
        title: "Error",
        message: err?.message ?? "No se pudieron cargar las categorías.",
      });
    }

    setCategoriesLoading(false);
  }

  async function loadModules(p = page) {
    if (total !== null) {
      const mp = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);
      if (p < 0 || p > mp) return;
    }

    setLoading(true);

    try {
      const offset = p * PAGE_SIZE;

      const res = await fetch(
        `/api/modules?limit=${PAGE_SIZE}&offset=${offset}`,
        { cache: "no-store" },
      );

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

      const moduleItems: Module[] = Array.isArray(data?.items)
        ? data.items.map((m: any) => ({
            ...m,
            gallery_images: Array.isArray(m.gallery_images)
              ? m.gallery_images
              : [],
          }))
        : [];

      setModules(moduleItems);
      setTotal(typeof data?.count === "number" ? data.count : null);
      setPage(p);
    } catch (err: any) {
      push({
        type: "error",
        title: "Error",
        message: err?.message ?? "No se pudieron cargar los módulos.",
      });
    }

    setLoading(false);
  }

  function validateBaseFields(args: {
    title: string;
    category: string;
    shortDesc: string;
    longDesc: string;
    secondText: string;
    requireBanner?: boolean;
    bannerFile?: File | null;
    galleryCount?: number;
  }) {
    const {
      title,
      category,
      shortDesc,
      longDesc,
      secondText,
      requireBanner = false,
      bannerFile = null,
      galleryCount = 0,
    } = args;

    const cleanTitle = cleanText(title);
    const cleanShort = cleanText(shortDesc);
    const cleanLong = cleanText(longDesc);
    const cleanSecond = cleanText(secondText);

    if (cleanTitle.length < 2) {
      throw new Error("El título debe tener al menos 2 caracteres.");
    }

    if (!category) {
      throw new Error("Selecciona una categoría.");
    }

    if (!cleanShort) {
      throw new Error("La descripción corta es requerida.");
    }

    if (cleanShort.length > SHORT_DESC_LIMIT) {
      throw new Error(
        `La descripción corta no puede pasar de ${SHORT_DESC_LIMIT} caracteres.`,
      );
    }

    if (!cleanLong) {
      throw new Error("La descripción larga es requerida.");
    }

    if (cleanLong.length > LONG_DESC_LIMIT) {
      throw new Error(
        `La descripción larga no puede pasar de ${LONG_DESC_LIMIT} caracteres.`,
      );
    }

    if (cleanSecond.length > SECOND_TEXT_LIMIT) {
      throw new Error(
        `El segundo texto no puede pasar de ${SECOND_TEXT_LIMIT} caracteres.`,
      );
    }

    if (requireBanner && !bannerFile) {
      throw new Error("Selecciona la imagen banner.");
    }

    if (galleryCount > MAX_GALLERY_FILES) {
      throw new Error(
        `La galería no puede tener más de ${MAX_GALLERY_FILES} imágenes.`,
      );
    }
  }

  async function createModule(e: React.FormEvent) {
    e.preventDefault();
    if (creating) return;

    try {
      validateBaseFields({
        title,
        category: moduleCategory,
        shortDesc,
        longDesc,
        secondText,
        requireBanner: true,
        bannerFile,
        galleryCount: galleryFiles.length,
      });
    } catch (err: any) {
      push({
        type: "error",
        title: "Dato inválido",
        message: err?.message ?? "Revisa los datos del formulario.",
      });
      return;
    }

    setCreating(true);

    try {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        push({
          type: "error",
          title: "Sesión inválida",
          message: "Vuelve a iniciar sesión.",
        });
        setCreating(false);
        return;
      }

      const resizedBanner = await resizeImageToWebp(bannerFile!);
      const bannerUploaded = await uploadModuleImage(
        supabase,
        resizedBanner,
        userData.user.id,
      );

      let featuredUrl: string | null = null;

      if (featuredFile) {
        const resizedFeatured = await resizeImageToWebp(featuredFile);
        const featuredUploaded = await uploadModuleImage(
          supabase,
          resizedFeatured,
          userData.user.id,
        );
        featuredUrl = featuredUploaded.publicUrl;
      }

      let galleryUrls: string[] = [];

      if (galleryFiles.length) {
        const resizedGallery = await Promise.all(
          galleryFiles.map((f) => resizeImageToWebp(f)),
        );

        const galleryUploaded = await uploadModuleGalleryImages(
          supabase,
          resizedGallery,
          userData.user.id,
        );

        galleryUrls = galleryUploaded.map((g) => g.publicUrl);
      }

      const res = await fetch("/api/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: cleanText(title),
          module_category: moduleCategory,
          short_desc: cleanText(shortDesc),
          long_desc: cleanText(longDesc),
          second_text: cleanText(secondText) || null,
          banner_image_url: bannerUploaded.publicUrl,
          featured_image_url: featuredUrl,
          gallery_images: galleryUrls,
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Error creando módulo.");
      }

      push({
        type: "success",
        title: "Listo",
        message: "Módulo creado correctamente.",
        durationMs: 1800,
      });

      await resetForms();
      await loadModules(0);
    } catch (err: any) {
      push({
        type: "error",
        title: "Error",
        message: err?.message ?? "Ocurrió un error inesperado.",
      });
    }

    setCreating(false);
  }

  function startEdit(m: Module) {
    revokePreviewItems(editGalleryPreviews);

    setEditingId(m.id);
    setEditTitle(m.title ?? "");
    setEditModuleCategory((m.module_category as string) ?? "");
    setEditShortDesc(m.short_desc ?? "");
    setEditLongDesc(m.long_desc ?? "");
    setEditSecondText(m.second_text ?? "");

    setEditBannerFile(null);
    setEditFeaturedFile(null);
    setEditGalleryFiles([]);
    setEditGalleryPreviews([]);
    setEditExistingGallery(safeArray(m.gallery_images));
    setEditRemoveFeatured(false);

    if (editBannerRef.current) editBannerRef.current.value = "";
    if (editFeaturedRef.current) editFeaturedRef.current.value = "";
    if (editGalleryRef.current) editGalleryRef.current.value = "";
  }

  async function saveEdit() {
    if (!editingModule || saving) return;

    try {
      validateBaseFields({
        title: editTitle,
        category: editModuleCategory,
        shortDesc: editShortDesc,
        longDesc: editLongDesc,
        secondText: editSecondText,
        galleryCount: editExistingGallery.length + editGalleryFiles.length,
      });
    } catch (err: any) {
      push({
        type: "error",
        title: "Dato inválido",
        message: err?.message ?? "Revisa los datos del formulario.",
      });
      return;
    }

    setSaving(true);

    try {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        push({
          type: "error",
          title: "Sesión inválida",
          message: "Vuelve a iniciar sesión.",
        });
        setSaving(false);
        return;
      }

      let newBannerUrl: string | undefined;
      let newFeaturedUrl: string | null | undefined = undefined;

      if (editBannerFile) {
        const resizedBanner = await resizeImageToWebp(editBannerFile);
        const uploadedBanner = await uploadModuleImage(
          supabase,
          resizedBanner,
          userData.user.id,
        );
        newBannerUrl = uploadedBanner.publicUrl;
      }

      if (editRemoveFeatured) {
        newFeaturedUrl = null;
      } else if (editFeaturedFile) {
        const resizedFeatured = await resizeImageToWebp(editFeaturedFile);
        const uploadedFeatured = await uploadModuleImage(
          supabase,
          resizedFeatured,
          userData.user.id,
        );
        newFeaturedUrl = uploadedFeatured.publicUrl;
      }

      let appendedGalleryUrls: string[] = [];

      if (editGalleryFiles.length) {
        const resizedGallery = await Promise.all(
          editGalleryFiles.map((f) => resizeImageToWebp(f)),
        );

        const uploadedGallery = await uploadModuleGalleryImages(
          supabase,
          resizedGallery,
          userData.user.id,
        );

        appendedGalleryUrls = uploadedGallery.map((g) => g.publicUrl);
      }

      const finalGallery = [...editExistingGallery, ...appendedGalleryUrls];

      const removedGallery = safeArray(editingModule.gallery_images).filter(
        (url) => !editExistingGallery.includes(url),
      );

      const res = await fetch(`/api/modules/${editingModule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: cleanText(editTitle),
          module_category: editModuleCategory,
          short_desc: cleanText(editShortDesc),
          long_desc: cleanText(editLongDesc),
          second_text: cleanText(editSecondText) || null,
          ...(newBannerUrl ? { banner_image_url: newBannerUrl } : {}),
          ...(newFeaturedUrl !== undefined
            ? { featured_image_url: newFeaturedUrl }
            : {}),
          gallery_images: finalGallery,
          old_banner_image_url: editingModule.banner_image_url,
          old_featured_image_url: editingModule.featured_image_url,
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Error guardando cambios.");
      }

      for (const url of removedGallery) {
        try {
          const path = extractModuleStoragePath(url);
          if (path) {
            await deleteModuleImage(supabase, path);
          }
        } catch {
          // evitar romper guardado por limpieza fallida
        }
      }

      if (
        editRemoveFeatured &&
        editingModule.featured_image_url &&
        !editFeaturedFile
      ) {
        try {
          const path = extractModuleStoragePath(
            editingModule.featured_image_url,
          );
          if (path) {
            await deleteModuleImage(supabase, path);
          }
        } catch {
          // evitar romper guardado por limpieza fallida
        }
      }

      push({
        type: "success",
        title: "Actualizado",
        message: "Cambios guardados.",
        durationMs: 1800,
      });

      setEditingId(null);
      setEditBannerFile(null);
      setEditFeaturedFile(null);
      setEditGalleryFiles([]);
      revokePreviewItems(editGalleryPreviews);
      setEditGalleryPreviews([]);
      setEditExistingGallery([]);
      setEditRemoveFeatured(false);

      if (editBannerRef.current) editBannerRef.current.value = "";
      if (editFeaturedRef.current) editFeaturedRef.current.value = "";
      if (editGalleryRef.current) editGalleryRef.current.value = "";

      await loadModules(page);
    } catch (err: any) {
      push({
        type: "error",
        title: "Error",
        message: err?.message ?? "Ocurrió un error inesperado.",
      });
    }

    setSaving(false);
  }

  async function removeModule(id: number) {
    const moduleItem = modules.find((m) => m.id === id);

    const confirmId = push({
      type: "info",
      title: "Confirmación",
      message: `¿Eliminar el módulo "${moduleItem?.title ?? "este módulo"}"? Esta acción no se puede deshacer.`,
      actions: [
        { label: "Cancelar", onClick: () => remove(confirmId) },
        {
          label: "Eliminar",
          onClick: async () => {
            remove(confirmId);

            try {
              const res = await fetch(`/api/modules/${id}`, {
                method: "DELETE",
              });

              if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                throw new Error(d.error ?? "No se pudo eliminar.");
              }

              push({
                type: "success",
                title: "Eliminado",
                message: `Módulo "${moduleItem?.title ?? ""}" eliminado.`,
                durationMs: 1800,
              });

              const nextTotal = total !== null ? Math.max(0, total - 1) : null;
              const nextMaxPage =
                nextTotal !== null
                  ? Math.max(0, Math.ceil(nextTotal / PAGE_SIZE) - 1)
                  : page;

              await loadModules(Math.min(page, nextMaxPage));
            } catch (err: any) {
              push({
                type: "error",
                title: "Error",
                message:
                  err?.message ?? "No se pudo eliminar. Intenta de nuevo.",
              });
            }
          },
        },
      ],
    });

    void confirmId;
  }

  if (booting) return <div className="p-6"></div>;
  if (!userEmail || !isAdmin) return <div className="p-6">Redirigiendo…</div>;

  return (
    <>
      <Toasts items={toasts} onClose={remove} />

      <div className="pg_module">
        <div id="dashboard_scroll" className="module_dashboard">
          <div className="module_dashboard_logaccount">
            <div className="module_panelinfo">
              <h1>PANEL ADMINISTRADOR MÓDULOS</h1>
              <p>Cuenta: {userEmail}</p>
            </div>
          </div>

          <section className="module_config">
            <div className="module_dashboard_actions">
              <h2>Agregar Módulo</h2>

              <form
                onSubmit={createModule}
                className="module_dashboard_actions_form"
              >
                <input
                  className="module_name_field"
                  placeholder="Título del módulo"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />

                <div className="module_category_picker">
                  <button
                    type="button"
                    className="module_category_add_btn"
                    onClick={() => setShowCategoryManager(true)}
                    aria-label="Administrar categorías"
                    title="Administrar categorías"
                  >
                    +
                  </button>

                  <select
                    className="module_select_field"
                    value={moduleCategory}
                    onChange={(e) => setModuleCategory(e.target.value)}
                    disabled={categoriesLoading}
                  >
                    <option value="" disabled>
                      {categoriesLoading
                        ? "Cargando categorías…"
                        : "Selecciona categoría…"}
                    </option>

                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {formatCategoryLabel(c.name)}
                      </option>
                    ))}
                  </select>
                </div>

                <textarea
                  className="module_textarea_field"
                  placeholder="Descripción corta para la página principal"
                  value={shortDesc}
                  maxLength={SHORT_DESC_LIMIT}
                  onChange={(e) => setShortDesc(e.target.value)}
                  rows={3}
                />
                <div className="module_char_counter">
                  {shortDesc.length}/{SHORT_DESC_LIMIT}
                </div>

                <textarea
                  className="module_textarea_field"
                  placeholder="Descripción larga"
                  value={longDesc}
                  onChange={(e) => setLongDesc(e.target.value)}
                  rows={6}
                />

                <textarea
                  className="module_textarea_field"
                  placeholder="Segundo texto (opcional)"
                  value={secondText}
                  maxLength={SECOND_TEXT_LIMIT}
                  onChange={(e) => setSecondText(e.target.value)}
                  rows={5}
                />
                <div className="module_char_counter">
                  {secondText.length}/{SECOND_TEXT_LIMIT}
                </div>

                <div className="module_file_field">
                  <label
                    htmlFor="create_banner_file"
                    className="module_file_label"
                  >
                    <Image
                      className="module_file_icon"
                      src="/images/adminpage/picture.png"
                      alt="Icon"
                      width={50}
                      height={50}
                    />
                    <div className="module_file_text">
                      <span className="module_file_title">Subir banner</span>
                      <span className="module_file_subtitle">
                        {bannerFile ? bannerFile.name : "PNG, JPG, WEBP"}
                      </span>
                    </div>
                    <span className="module_file_button">Elegir</span>

                    {bannerPreviewUrl && (
                      <div className="module_preview_box">
                        <img
                          src={bannerPreviewUrl}
                          alt="Preview banner"
                          className="module_preview_img"
                        />
                        <button
                          type="button"
                          className="module_delete_btn"
                          onClick={() => {
                            setBannerFile(null);
                            if (createBannerRef.current) {
                              createBannerRef.current.value = "";
                            }
                          }}
                        >
                          Quitar banner
                        </button>
                      </div>
                    )}
                  </label>

                  <input
                    id="create_banner_file"
                    ref={createBannerRef}
                    className="module_create_file"
                    type="file"
                    accept="image/*"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setBannerFile(e.target.files?.[0] ?? null)
                    }
                  />
                </div>

                <div className="module_file_field">
                  <label
                    htmlFor="create_featured_file"
                    className="module_file_label"
                  >
                    <Image
                      className="module_file_icon"
                      src="/images/adminpage/picture.png"
                      alt="Icon"
                      width={50}
                      height={50}
                    />
                    <div className="module_file_text">
                      <span className="module_file_title">
                        Subir imagen destacada
                      </span>
                      <span className="module_file_subtitle">
                        {featuredFile ? featuredFile.name : "Opcional"}
                      </span>
                    </div>
                    <span className="module_file_button">Elegir</span>

                    {featuredPreviewUrl && (
                      <div className="module_preview_box">
                        <img
                          src={featuredPreviewUrl}
                          alt="Preview imagen destacada"
                          className="module_preview_img"
                        />
                        <button
                          type="button"
                          className="module_delete_btn"
                          onClick={() => {
                            setFeaturedFile(null);
                            if (createFeaturedRef.current) {
                              createFeaturedRef.current.value = "";
                            }
                          }}
                        >
                          Quitar imagen destacada
                        </button>
                      </div>
                    )}
                  </label>

                  <input
                    id="create_featured_file"
                    ref={createFeaturedRef}
                    className="module_create_file"
                    type="file"
                    accept="image/*"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFeaturedFile(e.target.files?.[0] ?? null)
                    }
                  />
                </div>

                <div className="module_file_field">
                  <label
                    htmlFor="create_gallery_file"
                    className="module_file_label"
                  >
                    <Image
                      className="module_file_icon"
                      src="/images/adminpage/picture.png"
                      alt="Icon"
                      width={50}
                      height={50}
                    />
                    <div className="module_file_text">
                      <span className="module_file_title">Subir galería</span>
                      <span className="module_file_subtitle">
                        {galleryFiles.length
                          ? `${galleryFiles.length} imagen(es) seleccionada(s)`
                          : `Hasta ${MAX_GALLERY_FILES} imágenes`}
                      </span>
                    </div>
                    <span className="module_file_button">Elegir</span>
                  </label>

                  <input
                    id="create_gallery_file"
                    ref={createGalleryRef}
                    className="module_create_file"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateGalleryWithPreviews(
                        fileListToArray(e.target.files),
                      )
                    }
                  />
                </div>

                {galleryPreviews.length > 0 && (
                  <div className="module_gallery_preview">
                    {galleryPreviews.map((item, i) => (
                      <div
                        key={`${item.file.name}-${i}`}
                        className="module_preview_box"
                      >
                        <img
                          src={item.previewUrl}
                          alt={item.file.name}
                          className="module_preview_img"
                        />
                        <button
                          type="button"
                          className="module_delete_btn"
                          onClick={() => removeNewCreateGalleryAt(i)}
                        >
                          Quitar
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="submit"
                  className="module_create_button"
                  disabled={creating}
                >
                  {creating ? "Guardando…" : "Guardar"}
                </button>
              </form>
            </div>

            {editingModule && (
              <div ref={editBoxRef} className="module_dashboard_actions">
                <h2>Editando: {editingModule.title}</h2>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void saveEdit();
                  }}
                  className="module_dashboard_actions_form"
                >
                  <input
                    className="module_name_field"
                    placeholder="Editar título"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />

                  <div className="module_category_picker">
                    <select
                      className="module_select_field"
                      value={editModuleCategory}
                      onChange={(e) => setEditModuleCategory(e.target.value)}
                      disabled={categoriesLoading}
                    >
                      <option value="" disabled>
                        {categoriesLoading
                          ? "Cargando categorías…"
                          : "Selecciona categoría…"}
                      </option>

                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {formatCategoryLabel(c.name)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <textarea
                    className="module_textarea_field"
                    placeholder="Editar descripción corta"
                    value={editShortDesc}
                    maxLength={SHORT_DESC_LIMIT}
                    onChange={(e) => setEditShortDesc(e.target.value)}
                    rows={3}
                  />
                  <div className="module_char_counter">
                    {editShortDesc.length}/{SHORT_DESC_LIMIT}
                  </div>

                  <textarea
                    className="module_textarea_field"
                    placeholder="Editar descripción larga"
                    value={editLongDesc}
                    onChange={(e) => setEditLongDesc(e.target.value)}
                    rows={6}
                  />

                  <textarea
                    className="module_textarea_field"
                    placeholder="Editar segundo texto"
                    value={editSecondText}
                    maxLength={SECOND_TEXT_LIMIT}
                    onChange={(e) => setEditSecondText(e.target.value)}
                    rows={5}
                  />
                  <div className="module_char_counter">
                    {editSecondText.length}/{SECOND_TEXT_LIMIT}
                  </div>

                  <div className="module_file_field">
                    <label
                      htmlFor="edit_banner_file"
                      className="module_file_label"
                    >
                      <Image
                        className="module_file_icon"
                        src="/images/adminpage/picture.png"
                        alt="Icon"
                        width={50}
                        height={50}
                      />
                      <div className="module_file_text">
                        <span className="module_file_title">
                          Cambiar banner
                        </span>
                        <span className="module_file_subtitle">
                          {editBannerFile
                            ? editBannerFile.name
                            : "Opcional, solo si deseas reemplazarlo"}
                        </span>
                      </div>
                      <span className="module_file_button">Cambiar</span>

                      {editBannerPreviewUrl ? (
                        <div className="module_preview_box">
                          <img
                            src={editBannerPreviewUrl}
                            alt="Preview banner nuevo"
                            className="module_preview_img"
                          />
                        </div>
                      ) : editingModule.banner_image_url ? (
                        <div className="module_preview_box">
                          <img
                            src={editingModule.banner_image_url}
                            alt="Banner actual"
                            className="module_preview_img"
                          />
                        </div>
                      ) : null}
                    </label>

                    <input
                      id="edit_banner_file"
                      ref={editBannerRef}
                      className="module_create_file"
                      type="file"
                      accept="image/*"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEditBannerFile(e.target.files?.[0] ?? null)
                      }
                    />
                  </div>

                  <div className="module_file_field">
                    <label
                      htmlFor="edit_featured_file"
                      className="module_file_label"
                    >
                      <Image
                        className="module_file_icon"
                        src="/images/adminpage/picture.png"
                        alt="Icon"
                        width={50}
                        height={50}
                      />
                      <div className="module_file_text">
                        <span className="module_file_title">
                          Cambiar imagen destacada
                        </span>
                        <span className="module_file_subtitle">
                          {editFeaturedFile
                            ? editFeaturedFile.name
                            : "Opcional"}
                        </span>
                      </div>
                      <span className="module_file_button">Cambiar</span>

                      {editFeaturedPreviewUrl ? (
                        <div className="module_preview_box">
                          <img
                            src={editFeaturedPreviewUrl}
                            alt="Preview imagen destacada nueva"
                            className="module_preview_img"
                          />
                        </div>
                      ) : editingModule.featured_image_url &&
                        !editRemoveFeatured ? (
                        <div className="module_preview_box">
                          <img
                            src={editingModule.featured_image_url}
                            alt="Imagen destacada actual"
                            className="module_preview_img"
                          />
                          <button
                            type="button"
                            className="module_delete_btn"
                            onClick={() => {
                              setEditRemoveFeatured(true);
                              setEditFeaturedFile(null);
                              if (editFeaturedRef.current) {
                                editFeaturedRef.current.value = "";
                              }
                            }}
                          >
                            Quitar imagen destacada
                          </button>
                        </div>
                      ) : null}
                    </label>

                    <input
                      id="edit_featured_file"
                      ref={editFeaturedRef}
                      className="module_create_file"
                      type="file"
                      accept="image/*"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setEditFeaturedFile(e.target.files?.[0] ?? null);
                        if (e.target.files?.[0]) setEditRemoveFeatured(false);
                      }}
                    />
                  </div>

                  {editRemoveFeatured && (
                    <div className="modules_loading_status">
                      La imagen destacada se eliminará al guardar.
                    </div>
                  )}

                  <div className="module_file_field">
                    <label
                      htmlFor="edit_gallery_file"
                      className="module_file_label"
                    >
                      <Image
                        className="module_file_icon"
                        src="/images/adminpage/picture.png"
                        alt="Icon"
                        width={50}
                        height={50}
                      />
                      <div className="module_file_text">
                        <span className="module_file_title">
                          Agregar imágenes a la galería
                        </span>
                        <span className="module_file_subtitle">
                          {editGalleryFiles.length
                            ? `${editGalleryFiles.length} imagen(es) nuevas`
                            : "Puedes agregar más imágenes"}
                        </span>
                      </div>
                      <span className="module_file_button">Agregar</span>
                    </label>

                    <input
                      id="edit_gallery_file"
                      ref={editGalleryRef}
                      className="module_create_file"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEditGalleryWithPreviews(
                          fileListToArray(e.target.files),
                        )
                      }
                    />
                  </div>

                  {editExistingGallery.length > 0 && (
                    <>
                      <h3>Galería actual</h3>
                      <div className="module_gallery_preview">
                        {editExistingGallery.map((url, i) => (
                          <div
                            key={`${url}-${i}`}
                            className="module_preview_box"
                          >
                            <img
                              src={url}
                              alt={`Imagen actual ${i + 1}`}
                              className="module_preview_img"
                            />
                            <button
                              type="button"
                              className="module_delete_btn"
                              onClick={() => removeExistingEditGalleryAt(i)}
                            >
                              Quitar
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {editGalleryPreviews.length > 0 && (
                    <>
                      <h3>Nuevas imágenes</h3>
                      <div className="module_gallery_preview">
                        {editGalleryPreviews.map((item, i) => (
                          <div
                            key={`${item.file.name}-${i}`}
                            className="module_preview_box"
                          >
                            <img
                              src={item.previewUrl}
                              alt={item.file.name}
                              className="module_preview_img"
                            />
                            <button
                              type="button"
                              className="module_delete_btn"
                              onClick={() => removeNewEditGalleryAt(i)}
                            >
                              Quitar
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <div className="module_dashboard_actions_buttons">
                    <button
                      type="submit"
                      className="module_edit_button"
                      disabled={saving}
                    >
                      {saving ? "Guardando…" : "Guardar cambios"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="module_cancel_button"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}
          </section>

          <div className="modules_search">
            <input
              className="modules_search_input"
              placeholder="Buscar módulo (título, categoría, descripción)…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query.trim() && (
              <button
                type="button"
                className="modules_search_clear"
                onClick={() => setQuery("")}
                aria-label="Limpiar búsqueda"
              >
                Limpiar
              </button>
            )}
            <select
              className="modules_select_field"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              style={{ maxWidth: 260 }}
              disabled={categoriesLoading}
            >
              <option value="Todos">Todos</option>

              {categories.map((opt) => (
                <option key={opt.id} value={opt.name}>
                  {formatCategoryLabel(opt.name)}
                </option>
              ))}
            </select>
          </div>

          <section className="modules_list">
            {loading && (
              <div className="modules_loading">Cargando módulos…</div>
            )}

            {!loading && modules.length === 0 && (
              <div className="modules_loading_status">
                No hay módulos registrados
              </div>
            )}

            {!loading && modules.length > 0 && filteredModules.length === 0 && (
              <div className="modules_loading_status">
                No se encontraron módulos para esta categoría
              </div>
            )}

            {filteredModules.map((m) => (
              <div key={m.id} className="modules_boxes">
                <div className="module_box_info">
                  <Image
                    src={m.banner_image_url}
                    className="module_logo"
                    alt={m.title}
                    width={80}
                    height={60}
                    unoptimized
                  />

                  <div className="module_card_text">
                    <div className="module_card_top">
                      <div className="module_card_name">{m.title}</div>
                      <div className="module_card_category">
                        {m.module_category
                          ? formatCategoryLabel(m.module_category)
                          : "N/A"}
                      </div>
                    </div>

                    <div className="module_card_desc">
                      <span className="module_card_short_desc">
                        Descripción corta:{" "}
                      </span>
                      {m.short_desc}
                    </div>

                    <div className="module_card_desc">
                      <span className="module_card_short_desc">Galería: </span>
                      {safeArray(m.gallery_images).length} imagen(es)
                    </div>
                  </div>
                </div>

                <div className="module_box_actions">
                  <button
                    className="module_edit_btn"
                    type="button"
                    onClick={() => {
                      startEdit(m);

                      requestAnimationFrame(() => {
                        const container =
                          document.getElementById("dashboard_scroll");
                        const editBox = editBoxRef.current;

                        if (container && editBox) {
                          const top =
                            editBox.getBoundingClientRect().top -
                            container.getBoundingClientRect().top +
                            container.scrollTop;

                          container.scrollTo({
                            top: top - 150,
                            behavior: "smooth",
                          });
                        }
                      });
                    }}
                  >
                    Editar
                  </button>

                  <button
                    className="module_delete_btn"
                    onClick={() => removeModule(m.id)}
                    type="button"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}

            <div className="module_pageButtons">
              <button
                disabled={loading || page === 0}
                onClick={() => void loadModules(page - 1)}
                type="button"
              >
                ←
              </button>

              <span>Página {page + 1}</span>

              <button
                disabled={loading || isLastPage}
                onClick={() => {
                  if (!isLastPage) void loadModules(page + 1);
                }}
                type="button"
              >
                →
              </button>
            </div>
          </section>
        </div>
      </div>

      {showCategoryManager && (
        <div
          className="module_modal_overlay"
          onClick={() => setShowCategoryManager(false)}
        >
          <div
            className="module_modal_card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="module_modal_header">
              <h2>Administrar Categorías</h2>

              <button
                type="button"
                className="module_modal_close"
                onClick={() => setShowCategoryManager(false)}
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            <CategoryManager
              pageKey={PAGE_KEY}
              push={push}
              remove={(id: string | number) => remove(String(id))}
              className="module_dashboard_actions module_dashboard_actions_modal"
              onChanged={(items) => {
                syncCategoriesState(items);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
