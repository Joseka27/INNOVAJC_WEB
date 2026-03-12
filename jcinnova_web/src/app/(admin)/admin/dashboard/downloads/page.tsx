"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/browserClient";
import "./dashboard_downloads.css";

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
const PAGE_KEY = "downloads";

const DOWNLOADS_BUCKET = "downloads";
const FILES_FOLDER = "AppLink";
const COVERS_FOLDER = "AppImages";

type DownloadRow = {
  id: number;
  title: string | null;
  description: string | null;
  size: string | null;
  version: string | null;
  file_url: string | null;
  type_file: string | null;
  app_image: string | null;
  requirements: string | null;
  created_at?: string | null;
};

function safeFileName(name: string) {
  return name.replace(/[^\w.\-() ]+/g, "_").trim();
}

function formatCategoryLabel(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => {
      if (word === "erp") return "ERP";
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

export default function AdminDownloadsPage() {
  const router = useRouter();
  const supabase = createClient();

  const { toasts, push, remove, clearAll } = useToasts();
  const { booting, userEmail, isAdmin } = useAdminGate();

  useIdleLogout(push, {
    idleMs: 30 * 60 * 1000,
    sessionMaxMs: 60 * 60 * 1000,
  });

  const editBoxRef = useRef<HTMLDivElement | null>(null);

  const [downloads, setDownloads] = useState<DownloadRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  const [page, setPage] = useState(0);
  const [total, setTotal] = useState<number | null>(null);

  const [query, setQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("Todos");

  const [signedUrlByPath, setSignedUrlByPath] = useState<
    Record<string, string>
  >({});

  // CREATE
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [size, setSize] = useState("");
  const [version, setVersion] = useState("");
  const [typeFile, setTypeFile] = useState("");
  const [requirements, setRequirements] = useState("");
  const [creating, setCreating] = useState(false);

  // FILES CREATE
  const [createFile, setCreateFile] = useState<File | null>(null);
  const [createImage, setCreateImage] = useState<File | null>(null);
  const [createImagePreview, setCreateImagePreview] = useState<string | null>(
    null,
  );
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);

  // EDIT
  const [editingId, setEditingId] = useState<number | null>(null);
  const editingDownload = useMemo(
    () => downloads.find((d) => d.id === editingId) ?? null,
    [downloads, editingId],
  );

  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSize, setEditSize] = useState("");
  const [editVersion, setEditVersion] = useState("");
  const [editTypeFile, setEditTypeFile] = useState("");
  const [editRequirements, setEditRequirements] = useState("");
  const [saving, setSaving] = useState(false);

  // FILES EDIT
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editImage, setEditImage] = useState<File | null>(null);

  const maxPage =
    total !== null ? Math.max(0, Math.ceil(total / PAGE_SIZE) - 1) : null;

  const isLastPage =
    maxPage !== null ? page >= maxPage : downloads.length < PAGE_SIZE;

  const filteredDownloads = useMemo(() => {
    const q = query.trim().toLowerCase();

    return downloads.filter((d) => {
      const matchesCategory =
        filterCategory === "Todos" || d.type_file === filterCategory;

      if (!matchesCategory) return false;

      if (!q) return true;

      const hay =
        `${d.title ?? ""} ${d.description ?? ""} ${d.size ?? ""} ${d.version ?? ""} ${d.type_file ?? ""} ${d.requirements ?? ""}`.toLowerCase();

      return hay.includes(q);
    });
  }, [downloads, query, filterCategory]);

  function syncCategoriesState(items: CategoryRow[]) {
    setCategories(items);

    setFilterCategory((prev) => {
      if (prev === "Todos") return prev;
      return items.some((x) => x.name === prev) ? prev : "Todos";
    });

    setTypeFile((prev) =>
      prev && items.some((x) => x.name === prev) ? prev : "",
    );

    setEditTypeFile((prev) =>
      prev && items.some((x) => x.name === prev) ? prev : "",
    );
  }

  async function resetForms() {
    setTitle("");
    setDescription("");
    setSize("");
    setVersion("");
    setTypeFile("");
    setRequirements("");
    setCreateFile(null);
    setCreateImage(null);

    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
    setEditSize("");
    setEditVersion("");
    setEditTypeFile("");
    setEditRequirements("");
    setEditFile(null);
    setEditImage(null);
  }

  useEffect(() => {
    if (!booting && userEmail && isAdmin) {
      void Promise.all([loadCategories(), loadDownloads(0)]);
    }
  }, [booting, userEmail, isAdmin]);

  useEffect(() => {
    if (!createImage) {
      setCreateImagePreview(null);
      return;
    }

    const url = URL.createObjectURL(createImage);
    setCreateImagePreview(url);

    return () => URL.revokeObjectURL(url);
  }, [createImage]);

  useEffect(() => {
    if (!editImage) {
      setEditImagePreview(null);
      return;
    }

    const url = URL.createObjectURL(editImage);
    setEditImagePreview(url);

    return () => URL.revokeObjectURL(url);
  }, [editImage]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", cache: "no-store" });

    clearAll();
    await resetForms();
    setDownloads([]);
    setCategories([]);
    setTotal(null);
    setPage(0);
    setSignedUrlByPath({});

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

  async function loadDownloads(p = page) {
    if (total !== null) {
      const mp = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);
      if (p < 0 || p > mp) return;
    }

    setLoading(true);
    try {
      const offset = p * PAGE_SIZE;

      const res = await fetch(
        `/api/downloads?limit=${PAGE_SIZE}&offset=${offset}`,
        { cache: "no-store" },
      );

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
        throw new Error(data?.error ?? "Error cargando las aplicaciones");
      }

      const items: DownloadRow[] =
        data && Array.isArray(data.items) ? data.items : [];

      setDownloads(items);
      setTotal(typeof data?.count === "number" ? data.count : null);
      setPage(p);

      void prefetchCoverSignedUrls(items);
    } catch (err: any) {
      push({
        type: "error",
        title: "Error",
        message: err?.message ?? "No se pudieron cargar las aplicaciones.",
      });
    }
    setLoading(false);
  }

  async function prefetchCoverSignedUrls(items: DownloadRow[]) {
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

        if (!error && data?.signedUrl) {
          next[path] = data.signedUrl;
        }
      }),
    );

    if (Object.keys(next).length) {
      setSignedUrlByPath((prev) => ({ ...prev, ...next }));
    }
  }

  async function uploadToDownloadsBucket(file: File, folder: string) {
    const clean = safeFileName(file.name);
    const path = `${folder}/${Date.now()}_${clean}`;

    const up = await supabase.storage
      .from(DOWNLOADS_BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "application/octet-stream",
      });

    if (up.error) throw new Error(up.error.message);

    return path;
  }

  async function createDownload(e: React.FormEvent) {
    e.preventDefault();
    if (creating) return;

    const cleanTitle = title.trim();
    const cleanDesc = description.trim();
    const cleanSize = size.trim();
    const cleanVersion = version.trim();
    const cleanType = typeFile;
    const cleanReq = requirements.trim();

    if (cleanTitle.length < 2) {
      push({
        type: "error",
        title: "Dato requerido",
        message: "El título debe tener al menos 2 caracteres.",
      });
      return;
    }
    if (!cleanDesc) {
      push({
        type: "error",
        title: "Dato requerido",
        message: "La descripción es requerida.",
      });
      return;
    }
    if (!cleanSize) {
      push({
        type: "error",
        title: "Dato requerido",
        message: "El tamaño es requerido.",
      });
      return;
    }
    if (!cleanVersion) {
      push({
        type: "error",
        title: "Dato requerido",
        message: "La versión es requerida.",
      });
      return;
    }
    if (!cleanType) {
      push({
        type: "error",
        title: "Dato requerido",
        message: "Selecciona el tipo de archivo.",
      });
      return;
    }
    if (!cleanReq) {
      push({
        type: "error",
        title: "Dato requerido",
        message: "Los requisitos son requeridos.",
      });
      return;
    }
    if (!createImage) {
      push({
        type: "error",
        title: "Dato requerido",
        message: "Debes subir una imagen para el archivo.",
      });
      return;
    }
    if (!createFile) {
      push({
        type: "error",
        title: "Dato requerido",
        message: "Debes subir el archivo de la app.",
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

      const imagePath = await uploadToDownloadsBucket(
        createImage,
        COVERS_FOLDER,
      );
      const filePath = await uploadToDownloadsBucket(createFile, FILES_FOLDER);

      const res = await fetch("/api/downloads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: cleanTitle,
          description: cleanDesc,
          size: cleanSize,
          version: cleanVersion,
          type_file: cleanType,
          requirements: cleanReq,
          app_image: imagePath,
          file_url: filePath,
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        push({
          type: "error",
          title: "No se pudo guardar",
          message: d?.error ?? "Error creando download.",
        });
        setCreating(false);
        return;
      }

      push({
        type: "success",
        title: "Listo",
        message: "Archivo creado correctamente.",
        durationMs: 1800,
      });

      await resetForms();
      await loadDownloads(0);
    } catch (err: any) {
      push({
        type: "error",
        title: "Error",
        message: err?.message ?? "Ocurrió un error inesperado.",
      });
    }
    setCreating(false);
  }

  function startEdit(d: DownloadRow) {
    setEditingId(d.id);

    setEditTitle(d.title ?? "");
    setEditDescription(d.description ?? "");
    setEditSize(d.size ?? "");
    setEditVersion(d.version ?? "");
    setEditTypeFile(d.type_file ?? "");
    setEditRequirements(d.requirements ?? "");

    setEditFile(null);
    setEditImage(null);
  }

  async function saveEdit() {
    if (!editingDownload || saving) return;

    const cleanTitle = editTitle.trim();
    const cleanDesc = editDescription.trim();
    const cleanSize = editSize.trim();
    const cleanVersion = editVersion.trim();
    const cleanType = editTypeFile;
    const cleanReq = editRequirements.trim();

    if (cleanTitle.length < 2) {
      push({
        type: "error",
        title: "Dato requerido",
        message: "El título debe tener al menos 2 caracteres.",
      });
      return;
    }
    if (!cleanDesc) {
      push({
        type: "error",
        title: "Dato requerido",
        message: "La descripción es requerida.",
      });
      return;
    }
    if (!cleanSize) {
      push({
        type: "error",
        title: "Dato requerido",
        message: "El tamaño es requerido.",
      });
      return;
    }
    if (!cleanVersion) {
      push({
        type: "error",
        title: "Dato requerido",
        message: "La versión es requerida.",
      });
      return;
    }
    if (!cleanType) {
      push({
        type: "error",
        title: "Dato requerido",
        message: "Selecciona el sistema",
      });
      return;
    }
    if (!cleanReq) {
      push({
        type: "error",
        title: "Dato requerido",
        message: "Los requisitos son requeridos.",
      });
      return;
    }

    setSaving(true);
    try {
      let nextFilePath: string | null = editingDownload.file_url ?? null;
      let nextImagePath: string | null = editingDownload.app_image ?? null;

      if (editFile) {
        nextFilePath = await uploadToDownloadsBucket(editFile, FILES_FOLDER);
      }

      if (editImage) {
        nextImagePath = await uploadToDownloadsBucket(editImage, COVERS_FOLDER);
      }

      const res = await fetch(`/api/downloads/${editingDownload.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: cleanTitle,
          description: cleanDesc,
          size: cleanSize,
          version: cleanVersion,
          type_file: cleanType,
          requirements: cleanReq,
          file_url: nextFilePath,
          app_image: nextImagePath,
          old_file_url: editingDownload.file_url,
          old_app_image: editingDownload.app_image,
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        push({
          type: "error",
          title: "No se pudo guardar",
          message: d?.error ?? "Error guardando cambios.",
        });
        setSaving(false);
        return;
      }

      push({
        type: "success",
        title: "Actualizado",
        message: "Cambios guardados.",
        durationMs: 1800,
      });

      setEditingId(null);
      await loadDownloads(page);
    } catch (err: any) {
      push({
        type: "error",
        title: "Error",
        message: err?.message ?? "Ocurrió un error inesperado.",
      });
    }
    setSaving(false);
  }

  async function removeDownload(id: number) {
    const download = downloads.find((d) => d.id === id);

    const confirmId = push({
      type: "info",
      title: "Confirmación",
      message: `¿Eliminar el archivo "${download?.title ?? "este archivo"}"? Esta acción no se puede deshacer.`,
      actions: [
        { label: "Cancelar", onClick: () => remove(confirmId) },
        {
          label: "Eliminar",
          onClick: async () => {
            remove(confirmId);
            try {
              const res = await fetch(`/api/downloads/${id}`, {
                method: "DELETE",
              });

              if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                push({
                  type: "error",
                  title: "Error",
                  message: d?.error ?? "No se pudo eliminar.",
                });
                return;
              }

              push({
                type: "success",
                title: "Eliminado",
                message: `Archivo "${download?.title ?? ""}" eliminado.`,
                durationMs: 1800,
              });

              await loadDownloads(page);
            } catch {
              push({
                type: "error",
                title: "Error",
                message: "No se pudo eliminar. Intenta de nuevo.",
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

      <div className="pg_download">
        <div id="dashboard_scroll" className="download_dashboard">
          <div className="download_dashboard_logaccount">
            <div className="download_panelinfo">
              <h1>PANEL ADMINISTRADOR DOWNLOADS</h1>
              <p>Cuenta: {userEmail}</p>
            </div>
          </div>

          <section className="download_config">
            <div className="download_dashboard_actions">
              <h2>Agregar Archivo o Aplicación</h2>

              <form
                onSubmit={createDownload}
                className="download_dashboard_actions_form"
              >
                <input
                  className="download_name_field"
                  placeholder="Título"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />

                <textarea
                  className="download_textarea_field"
                  placeholder="Descripción"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />

                <div className="download_row">
                  <input
                    className="download_name_field"
                    placeholder="Tamaño (ej: 120MB)"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                  />

                  <input
                    className="download_name_field"
                    placeholder="Versión (ej: 1.0.0)"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                  />
                </div>

                <div className="download_category_picker">
                  <button
                    type="button"
                    className="download_category_add_btn"
                    onClick={() => setShowCategoryManager(true)}
                    aria-label="Administrar categorías"
                    title="Administrar categorías"
                  >
                    +
                  </button>

                  <select
                    className="download_select_field"
                    value={typeFile}
                    onChange={(e) => setTypeFile(e.target.value)}
                    disabled={categoriesLoading}
                  >
                    <option value="" disabled>
                      {categoriesLoading
                        ? "Cargando categorías…"
                        : "Selecciona tipo…"}
                    </option>

                    {categories.map((opt) => (
                      <option key={opt.id} value={opt.name}>
                        {formatCategoryLabel(opt.name)}
                      </option>
                    ))}
                  </select>
                </div>

                <textarea
                  className="download_textarea_field"
                  placeholder="Requisitos"
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  rows={4}
                />

                <div className="download_file_field">
                  <label
                    htmlFor="download_create_image"
                    className="download_file_label"
                  >
                    <Image
                      className="download_file_icon"
                      src="/images/adminpage/picture.png"
                      alt="Icon"
                      width={50}
                      height={50}
                    />
                    <div className="download_file_text">
                      <span className="download_file_title">
                        Subir imagen (del archivo)
                      </span>
                      <span className="download_file_subtitle">
                        {createImage ? createImage.name : "PNG, JPG, WEBP"}
                      </span>
                    </div>
                    <span className="download_file_button">Elegir</span>

                    {createImagePreview && (
                      <div className="download_preview_box">
                        <img
                          src={createImagePreview}
                          alt="Preview"
                          className="download_preview_img"
                        />
                      </div>
                    )}
                  </label>

                  <input
                    id="download_create_image"
                    className="download_create_file"
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setCreateImage(e.target.files?.[0] ?? null)
                    }
                  />
                </div>

                <div className="download_file_field">
                  <label
                    htmlFor="download_create_file"
                    className="download_file_label"
                  >
                    <Image
                      className="download_file_icon"
                      src="/images/adminpage/file.png"
                      alt="Icon"
                      width={50}
                      height={50}
                    />
                    <div className="download_file_text">
                      <span className="download_file_title">
                        Subir archivo de la app
                      </span>
                      <span className="download_file_subtitle">
                        {createFile
                          ? createFile.name
                          : "EXE, APK, DMG, AppImage, ZIP…"}
                      </span>
                    </div>
                    <span className="download_file_button">Elegir</span>
                  </label>

                  <input
                    id="download_create_file"
                    className="download_create_file"
                    type="file"
                    onChange={(e) => setCreateFile(e.target.files?.[0] ?? null)}
                  />
                </div>

                <button
                  type="submit"
                  className="download_create_button"
                  disabled={creating}
                >
                  {creating ? "Guardando…" : "Guardar"}
                </button>
              </form>
            </div>

            {editingDownload && (
              <div ref={editBoxRef} className="download_dashboard_actions">
                <h2>Editando: {editingDownload.title}</h2>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void saveEdit();
                  }}
                  className="download_dashboard_actions_form"
                >
                  <input
                    className="download_name_field"
                    placeholder="Editar título"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />

                  <textarea
                    className="download_textarea_field"
                    placeholder="Editar descripción"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={2}
                  />

                  <div className="download_row">
                    <input
                      className="download_name_field"
                      placeholder="Tamaño (ej: 120MB)"
                      value={editSize}
                      onChange={(e) => setEditSize(e.target.value)}
                    />

                    <input
                      className="download_name_field"
                      placeholder="Versión (ej: 1.0.0)"
                      value={editVersion}
                      onChange={(e) => setEditVersion(e.target.value)}
                    />
                  </div>

                  <div className="download_category_picker">
                    <select
                      className="download_select_field"
                      value={editTypeFile}
                      onChange={(e) => setEditTypeFile(e.target.value)}
                      disabled={categoriesLoading}
                    >
                      <option value="" disabled>
                        {categoriesLoading
                          ? "Cargando categorías…"
                          : "Selecciona tipo…"}
                      </option>

                      {categories.map((opt) => (
                        <option key={opt.id} value={opt.name}>
                          {formatCategoryLabel(opt.name)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <textarea
                    className="download_textarea_field"
                    placeholder="Editar requisitos"
                    value={editRequirements}
                    onChange={(e) => setEditRequirements(e.target.value)}
                    rows={4}
                  />

                  <div className="download_file_field">
                    <label
                      htmlFor="download_edit_image"
                      className="download_file_label"
                    >
                      <Image
                        className="download_file_icon"
                        src="/images/adminpage/picture.png"
                        alt="Icon"
                        width={50}
                        height={50}
                      />

                      <div className="download_file_text">
                        <span className="download_file_title">
                          Cambiar imagen
                        </span>
                        <span className="download_file_subtitle">
                          {editImage
                            ? editImage.name
                            : "Opcional (mantener actual)"}
                        </span>
                      </div>
                      <span className="download_file_button">Elegir</span>

                      {editImagePreview ? (
                        <div className="download_preview_box">
                          <img
                            src={editImagePreview}
                            alt="Preview nueva"
                            className="download_preview_img"
                          />
                        </div>
                      ) : editingDownload?.app_image &&
                        signedUrlByPath[editingDownload.app_image] ? (
                        <div className="download_preview_box">
                          <Image
                            src={signedUrlByPath[editingDownload.app_image]}
                            alt="Imagen actual"
                            width={200}
                            height={120}
                            className="download_preview_img"
                            unoptimized
                          />
                        </div>
                      ) : null}
                    </label>

                    <input
                      id="download_edit_image"
                      className="download_create_file"
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setEditImage(e.target.files?.[0] ?? null)
                      }
                    />
                  </div>

                  <div className="download_file_field">
                    <label
                      htmlFor="download_edit_file"
                      className="download_file_label"
                    >
                      <Image
                        className="download_file_icon"
                        src="/images/adminpage/replaceFile.png"
                        alt="Icon"
                        width={50}
                        height={50}
                      />
                      <div className="download_file_text">
                        <span className="download_file_title">
                          Reemplazar archivo
                        </span>
                        <span className="download_file_subtitle">
                          {editFile
                            ? editFile.name
                            : "Opcional (mantener actual)"}
                        </span>
                      </div>
                      <span className="download_file_button">Elegir</span>
                    </label>

                    <input
                      id="download_edit_file"
                      className="download_create_file"
                      type="file"
                      onChange={(e) => setEditFile(e.target.files?.[0] ?? null)}
                    />
                  </div>

                  <div className="download_dashboard_actions_buttons">
                    <button
                      type="submit"
                      className="download_edit_button"
                      disabled={saving}
                    >
                      {saving ? "Guardando…" : "Guardar cambios"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="download_cancel_button"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}
          </section>

          <div className="downloads_search">
            <input
              className="downloads_search_input"
              placeholder="Buscar download (título, tipo, versión, descripción)…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            {query.trim() && (
              <button
                type="button"
                className="downloads_search_clear"
                onClick={() => setQuery("")}
                aria-label="Limpiar búsqueda"
              >
                Limpiar
              </button>
            )}

            <select
              className="downloads_select_field"
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

          <section className="downloads_list">
            {loading && (
              <div className="downloads_loading">Cargando downloads…</div>
            )}

            {!loading && downloads.length === 0 && (
              <div className="downloads_loading_status">
                No hay downloads registrados
              </div>
            )}

            {!loading &&
              downloads.length > 0 &&
              filteredDownloads.length === 0 && (
                <div className="downloads_loading_status">
                  No se encontraron resultados para este tipo de archivo
                </div>
              )}

            {filteredDownloads.map((d) => {
              const coverUrl =
                d.app_image && signedUrlByPath[d.app_image]
                  ? signedUrlByPath[d.app_image]
                  : null;

              return (
                <div key={d.id} className="downloads_boxes">
                  <div className="download_box_info">
                    {coverUrl ? (
                      <Image
                        src={coverUrl}
                        className="download_logo"
                        alt={d.title ?? "Cover"}
                        width={80}
                        height={60}
                        unoptimized
                      />
                    ) : (
                      <div className="download_logo" aria-hidden="true">
                        ⬇️
                      </div>
                    )}

                    <div className="download_card_text">
                      <div className="download_card_top">
                        <div className="download_card_name">{d.title}</div>
                        <div className="download_card_category">
                          {d.type_file
                            ? formatCategoryLabel(d.type_file)
                            : "N/A"}
                        </div>
                      </div>

                      <div className="download_card_desc">
                        <span className="download_card_short_desc">
                          Descripción:{" "}
                        </span>
                        {d.description}
                      </div>

                      <div className="download_card_desc">
                        <span className="download_card_short_desc">
                          Versión:{" "}
                        </span>
                        {d.version ?? "—"}{" "}
                        <span className="download_card_short_desc">
                          • Tamaño:{" "}
                        </span>
                        {d.size ?? "—"}
                      </div>

                      {d.file_url ? (
                        <div className="download_card_desc">
                          <span className="download_card_short_desc">
                            Archivo:{" "}
                          </span>
                          <a
                            href={`/api/downloads/${d.id}/download`}
                            style={{ color: "#2da0ff", fontWeight: 900 }}
                          >
                            Descargar
                          </a>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="download_box_actions">
                    <button
                      className="download_edit_btn"
                      type="button"
                      onClick={() => {
                        startEdit(d);

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
                      className="download_delete_btn"
                      onClick={() => removeDownload(d.id)}
                      type="button"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })}

            <div className="download_pageButtons">
              <button
                disabled={loading || page === 0}
                onClick={() => void loadDownloads(page - 1)}
                type="button"
              >
                ←
              </button>

              <span> Página {page + 1}</span>

              <button
                disabled={loading || isLastPage}
                onClick={() => {
                  if (!isLastPage) void loadDownloads(page + 1);
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
          className="download_modal_overlay"
          onClick={() => setShowCategoryManager(false)}
        >
          <div
            className="download_modal_card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="download_modal_header">
              <h2>Administrar Categorías</h2>

              <button
                type="button"
                className="download_modal_close"
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
              className="download_dashboard_actions download_dashboard_actions_modal"
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
