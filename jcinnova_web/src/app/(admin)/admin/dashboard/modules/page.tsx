"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Module } from "@/models/modulesModel";
import { createClient } from "@/lib/supabase/browserClient";
import { resizeImageToWebp } from "@/lib/images/resizeImage";
import { uploadModuleImage } from "@/lib/storage/modulesBucket";
import "./dashboard_modules.css";
import Image from "next/image";

import {
  Toasts,
  useToasts,
} from "@/app/(admin)/admin/_admin_components/useToast";
import { useAdminGate } from "@/app/(admin)/admin/_admin_components/useAdmingate";
import { useIdleLogout } from "@/app/(admin)/admin/_admin_components/useIdlelogout";

/* Max page size */
const PAGE_SIZE = 10;
const SHORT_DESC_LIMIT = 150;

const CATEGORY_OPTIONS = [
  "Finanzas",
  "Operación",
  "Comercial",
  "RRHH",
  "Control",
] as const;

type Category = (typeof CATEGORY_OPTIONS)[number];

export default function AdminModulesPage() {
  const router = useRouter();
  const supabase = createClient();

  const { toasts, push, remove, clearAll } = useToasts();
  const { booting, userEmail, isAdmin } = useAdminGate();

  useIdleLogout(push, {
    idleMs: 30 * 60 * 1000,
    sessionMaxMs: 60 * 60 * 1000,
  });

  const createFileRef = useRef<HTMLInputElement | null>(null);
  const editFileRef = useRef<HTMLInputElement | null>(null);
  const editBoxRef = useRef<HTMLDivElement | null>(null);

  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(0);
  const [total, setTotal] = useState<number | null>(null);

  const [query, setQuery] = useState("");

  // CREATE
  const [title, setTitle] = useState("");
  const [moduleCategory, setModuleCategory] = useState<Category | "">("");
  const [shortDesc, setShortDesc] = useState("");
  const [longDesc, setLongDesc] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);

  // EDIT
  const [editingId, setEditingId] = useState<number | null>(null);
  const editingModule = useMemo(
    () => modules.find((m) => m.id === editingId) ?? null,
    [modules, editingId],
  );

  const [editTitle, setEditTitle] = useState("");
  const [editModuleCategory, setEditModuleCategory] = useState<Category | "">(
    "",
  );
  const [editShortDesc, setEditShortDesc] = useState("");
  const [editLongDesc, setEditLongDesc] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const maxPage =
    total !== null ? Math.max(0, Math.ceil(total / PAGE_SIZE) - 1) : null;

  const isLastPage =
    maxPage !== null ? page >= maxPage : modules.length < PAGE_SIZE;

  const filteredModules = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return modules;

    return modules.filter((m) => {
      const hay =
        `${m.title ?? ""} ${m.module_category ?? ""} ${m.short_desc ?? ""} ${m.long_desc ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [modules, query]);

  async function resetForms() {
    setTitle("");
    setModuleCategory("");
    setShortDesc("");
    setLongDesc("");
    setFile(null);
    if (createFileRef.current) createFileRef.current.value = "";

    setEditingId(null);
    setEditTitle("");
    setEditModuleCategory("");
    setEditShortDesc("");
    setEditLongDesc("");
    setEditFile(null);
    if (editFileRef.current) editFileRef.current.value = "";
  }

  useEffect(() => {
    if (!booting && userEmail && isAdmin) {
      loadModules(0);
    }
  }, [booting, userEmail, isAdmin]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", cache: "no-store" });

    clearAll();
    await resetForms();
    setModules([]);
    setTotal(null);
    setPage(0);

    router.replace("/admin");
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
        {
          cache: "no-store",
        },
      );

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

      setModules(data.items ?? []);
      setTotal(typeof data.count === "number" ? data.count : null);
      setPage(p);
    } catch (err: any) {
      push({
        type: "error",
        title: "Error",
        message: err?.message ?? "No se pudieron cargar los módulos.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function createModule(e: React.FormEvent) {
    e.preventDefault();
    if (creating) return;

    const cleanTitle = title.trim();
    const cleanShort = shortDesc.trim();
    const cleanLong = longDesc.trim();

    if (cleanTitle.length < 2) {
      push({
        type: "error",
        title: "Dato requerido",
        message: "El título debe tener al menos 2 caracteres.",
      });
      return;
    }
    if (!moduleCategory) {
      push({
        type: "error",
        title: "Dato requerido",
        message: "Selecciona una categoría.",
      });
      return;
    }
    if (!cleanShort) {
      push({
        type: "error",
        title: "Dato requerido",
        message: "La descripción corta es requerida.",
      });
      return;
    }
    if (cleanShort.length > SHORT_DESC_LIMIT) {
      push({
        type: "error",
        title: "Límite",
        message: `La descripción corta no puede pasar de ${SHORT_DESC_LIMIT} caracteres.`,
      });
      return;
    }
    if (!cleanLong) {
      push({
        type: "error",
        title: "Dato requerido",
        message: "La descripción larga es requerida.",
      });
      return;
    }
    if (!file) {
      push({
        type: "error",
        title: "Dato requerido",
        message: "Selecciona una imagen.",
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
        return;
      }

      const resized = await resizeImageToWebp(file);
      const { publicUrl } = await uploadModuleImage(
        supabase,
        resized,
        userData.user.id,
      );

      const res = await fetch("/api/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: cleanTitle,
          module_category: moduleCategory,
          short_desc: cleanShort,
          long_desc: cleanLong,
          image_url: publicUrl,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        push({
          type: "error",
          title: "No se pudo guardar",
          message: d.error ?? "Error creando módulo.",
        });
        return;
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
    } finally {
      setCreating(false);
    }
  }

  function startEdit(m: Module) {
    setEditingId(m.id);
    setEditTitle(m.title ?? "");
    setEditModuleCategory((m.module_category as Category) ?? "");
    setEditShortDesc(m.short_desc ?? "");
    setEditLongDesc(m.long_desc ?? "");
    setEditFile(null);
    if (editFileRef.current) editFileRef.current.value = "";
  }

  async function saveEdit() {
    if (!editingModule || saving) return;

    const cleanTitle = editTitle.trim();
    const cleanShort = editShortDesc.trim();
    const cleanLong = editLongDesc.trim();

    if (cleanTitle.length < 2) {
      push({
        type: "error",
        title: "Dato requerido",
        message: "El título debe tener al menos 2 caracteres.",
      });
      return;
    }
    if (!editModuleCategory) {
      push({
        type: "error",
        title: "Dato requerido",
        message: "Selecciona una categoría.",
      });
      return;
    }
    if (!cleanShort) {
      push({
        type: "error",
        title: "Dato requerido",
        message: "La descripción corta es requerida.",
      });
      return;
    }
    if (cleanShort.length > SHORT_DESC_LIMIT) {
      push({
        type: "error",
        title: "Límite",
        message: `La descripción corta no puede pasar de ${SHORT_DESC_LIMIT} caracteres.`,
      });
      return;
    }
    if (!cleanLong) {
      push({
        type: "error",
        title: "Dato requerido",
        message: "La descripción larga es requerida.",
      });
      return;
    }

    setSaving(true);
    try {
      let newUrl: string | undefined;

      if (editFile) {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          push({
            type: "error",
            title: "Sesión inválida",
            message: "Vuelve a iniciar sesión.",
          });
          return;
        }

        const resized = await resizeImageToWebp(editFile);
        const uploaded = await uploadModuleImage(
          supabase,
          resized,
          userData.user.id,
        );
        newUrl = uploaded.publicUrl;
      }

      const res = await fetch(`/api/modules/${editingModule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: cleanTitle,
          module_category: editModuleCategory,
          short_desc: cleanShort,
          long_desc: cleanLong,
          image_url: newUrl,
          old_image_url: editingModule.image_url,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        push({
          type: "error",
          title: "No se pudo guardar",
          message: d.error ?? "Error guardando cambios.",
        });
        return;
      }

      push({
        type: "success",
        title: "Actualizado",
        message: "Cambios guardados.",
        durationMs: 1800,
      });

      setEditingId(null);
      setEditFile(null);
      if (editFileRef.current) editFileRef.current.value = "";
      await loadModules(page);
    } catch (err: any) {
      push({
        type: "error",
        title: "Error",
        message: err?.message ?? "Ocurrió un error inesperado.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function removeModule(id: number) {
    const confirmId = push({
      type: "info",
      title: "Confirmación",
      message: "¿Eliminar este módulo? Esta acción no se puede deshacer.",
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
                const d = await res.json();
                push({
                  type: "error",
                  title: "Error",
                  message: d.error ?? "No se pudo eliminar.",
                });
                return;
              }

              push({
                type: "success",
                title: "Eliminado",
                message: "Módulo eliminado.",
                durationMs: 1800,
              });

              await loadModules(page);
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

      <div className="pg_module">
        <div id="dashboard" className="module_dashboard">
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

                <select
                  className="module_select_field"
                  value={moduleCategory}
                  onChange={(e) =>
                    setModuleCategory(e.target.value as Category)
                  }
                >
                  <option value="" disabled>
                    Selecciona categoría…
                  </option>
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <textarea
                  className="module_textarea_field"
                  placeholder="Descripción pagina principal"
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

                <div className="module_file_field">
                  <label htmlFor="create_file" className="module_file_label">
                    <Image
                      className="module_file_icon"
                      src="/images/adminpage/picture.png"
                      alt="Icon"
                      width={50}
                      height={50}
                    />

                    <div className="module_file_text">
                      <span className="module_file_title">Subir imagen</span>
                      <span className="module_file_subtitle">
                        {file ? file.name : "PNG, JPG, WEBP"}
                      </span>
                    </div>

                    <span className="module_file_button">Elegir</span>
                  </label>

                  <input
                    id="create_file"
                    ref={createFileRef}
                    className="module_create_file"
                    type="file"
                    accept="image/*"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFile(e.target.files?.[0] ?? null)
                    }
                  />
                </div>

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
                    saveEdit();
                  }}
                  className="module_dashboard_actions_form"
                >
                  <input
                    className="module_name_field"
                    placeholder="Editar título"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />

                  <select
                    className="module_select_field"
                    value={editModuleCategory}
                    onChange={(e) =>
                      setEditModuleCategory(e.target.value as Category)
                    }
                  >
                    <option value="" disabled>
                      Selecciona categoría…
                    </option>
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>

                  <textarea
                    className="module_textarea_field"
                    placeholder="Editar descripción pagina principal"
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

                  <div className="module_file_field">
                    <label htmlFor="edit_file" className="module_file_label">
                      <Image
                        className="module_file_icon"
                        src="/images/adminpage/picture.png"
                        alt="Icon"
                        width={50}
                        height={50}
                      />

                      <div className="module_file_text">
                        <span className="module_file_title">
                          Cambiar imagen
                        </span>
                        <span className="module_file_subtitle">
                          {editFile ? editFile.name : "PNG, JPG, WEBP"}
                        </span>
                      </div>

                      <span className="module_file_button">Cambiar</span>
                    </label>

                    <input
                      id="edit_file"
                      ref={editFileRef}
                      className="module_create_file"
                      type="file"
                      accept="image/*"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEditFile(e.target.files?.[0] ?? null)
                      }
                    />
                  </div>

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
                No se encontraron módulos para “{query.trim()}”.
              </div>
            )}

            {filteredModules.map((m) => (
              <div key={m.id} className="modules_boxes">
                <div className="module_box_info">
                  <img
                    src={m.image_url}
                    className="module_logo"
                    alt={m.title}
                  />

                  <div className="module_card_text">
                    <div className="module_card_top">
                      <div className="module_card_name">{m.title}</div>
                      <div className="module_card_category">
                        {m.module_category}
                      </div>
                    </div>
                    <div className="module_card_desc">
                      <span className="module_card_short_desc">
                        Descripcion corta:{" "}
                      </span>
                      {m.short_desc}
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
                onClick={() => loadModules(page - 1)}
                type="button"
              >
                ←
              </button>

              <span> Página {page + 1}</span>

              <button
                disabled={loading || isLastPage}
                onClick={() => {
                  if (!isLastPage) loadModules(page + 1);
                }}
                type="button"
              >
                →
              </button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
