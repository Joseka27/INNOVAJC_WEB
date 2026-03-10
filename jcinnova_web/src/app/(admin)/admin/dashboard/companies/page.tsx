"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Company } from "@/models/companiesModel";
import { createClient } from "@/lib/supabase/browserClient";
import { resizeImageToWebp } from "@/lib/images/resizeImage";
import { uploadCompanyImage } from "@/lib/storage/companiesBucket";
import "./dashboard_company.css";
import Image from "next/image";

import {
  Toasts,
  useToasts,
} from "@/app/(admin)/admin/_admin_components/useToast";
import { useAdminGate } from "@/app/(admin)/admin/_admin_components/useAdmingate";
import { useIdleLogout } from "@/app/(admin)/admin/_admin_components/useIdlelogout";

//Maximo tamaño de pagina
const PAGE_SIZE = 10;

async function fetchCompanyPage(
  page: number,
  pageSize: number,
): Promise<{ items: any[]; count: number | null }> {
  const offset = page * pageSize;
  const res = await fetch(`/api/companies?limit=${pageSize}&offset=${offset}`, {
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) {
    let errMsg = "Error cargando empresas";
    if (data.error) {
      errMsg = data.error;
    }
    throw new Error(errMsg);
  }
  let count: number | null = null;
  if (typeof data.count === "number") {
    count = data.count;
  }
  return { items: data.items, count };
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const { toasts, push, remove, clearAll } = useToasts();
  const { booting, userEmail, isAdmin } = useAdminGate();

  //30 minutos y saca
  useIdleLogout(push, {
    idleMs: 30 * 60 * 1000,
    sessionMaxMs: 60 * 60 * 1000,
  });

  const createFileRef = useRef<HTMLInputElement | null>(null);
  const editFileRef = useRef<HTMLInputElement | null>(null);
  const editBoxRef = useRef<HTMLDivElement | null>(null);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState<number | null>(null);
  const [query, setQuery] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editPreviewUrl, setEditPreviewUrl] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const editingCompany = useMemo(
    () => companies.find((c) => c.id === editingId) ?? null,
    [companies, editingId],
  );

  const filteredCompanies = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return companies;

    return companies.filter((c) => {
      const n = (c.name ?? "").toLowerCase();
      const d = ((c as any).description ?? "").toLowerCase();
      return n.includes(q) || d.includes(q);
    });
  }, [companies, query]);

  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  async function resetForms() {
    setName("");
    setDescription("");
    setFile(null);
    if (createFileRef.current) createFileRef.current.value = "";

    setEditingId(null);
    setEditName("");
    setEditDescription("");
    setEditFile(null);
    if (editFileRef.current) editFileRef.current.value = "";
  }

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!editFile) {
      setEditPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(editFile);
    setEditPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [editFile]);

  useEffect(() => {
    if (!booting && userEmail && isAdmin) {
      loadCompanies(0);
    }
  }, [booting, userEmail, isAdmin]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", cache: "no-store" });

    clearAll();
    await resetForms();
    setCompanies([]);
    setTotal(null);
    setPage(0);

    router.replace("/admin");
  }

  async function loadCompanies(p = page) {
    setLoading(true);
    try {
      const { items, count } = await fetchCompanyPage(p, PAGE_SIZE);

      setEditingId(null);
      setEditFile(null);
      if (editFileRef.current) editFileRef.current.value = "";

      setCompanies(items);
      setTotal(count);
      setPage(p);
    } catch (err: any) {
      push({
        type: "error",
        title: "Error",
        message: err?.message ?? "No se pudieron cargar las empresas.",
      });
    }
    setLoading(false);
  }

  async function createCompany(e: React.FormEvent) {
    e.preventDefault();
    if (creating) return;

    const cleanName = name.trim();
    const cleanDesc = description.trim();

    if (!cleanName) {
      push({
        type: "error",
        title: "Dato requerido",
        message: "El nombre es requerido.",
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
        setCreating(false);
        return;
      }

      const resized = await resizeImageToWebp(file);
      const { publicUrl } = await uploadCompanyImage(
        supabase,
        resized,
        userData.user.id,
      );

      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          description: cleanDesc, // ✅ NUEVO
          image_url: publicUrl,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        push({
          type: "error",
          title: "No se pudo guardar",
          message: d.error ?? "Error creando empresa.",
        });
        setCreating(false);
        return;
      }

      push({
        type: "success",
        title: "Listo",
        message: "Empresa creada correctamente.",
        durationMs: 1800,
      });

      setName("");
      setDescription("");
      setFile(null);
      if (createFileRef.current) createFileRef.current.value = "";
      await loadCompanies(0);
    } catch (err: any) {
      push({
        type: "error",
        title: "Error",
        message: err?.message ?? "Ocurrió un error inesperado.",
      });
    }
    setCreating(false);
  }

  function startEdit(c: Company) {
    setEditingId(c.id);
    setEditName(c.name);
    setEditDescription(((c as any).description ?? "") as string); // ✅ NUEVO
    setEditFile(null);
    if (editFileRef.current) editFileRef.current.value = "";
  }

  async function saveEdit() {
    if (!editingCompany || saving) return;

    const cleanName = (editName ?? "").trim();
    const cleanDesc = (editDescription ?? "").trim();

    if (!cleanName) {
      push({
        type: "error",
        title: "Dato requerido",
        message: "El nombre es requerido.",
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
          setSaving(false);
          return;
        }

        const resized = await resizeImageToWebp(editFile);
        const uploaded = await uploadCompanyImage(
          supabase,
          resized,
          userData.user.id,
        );
        newUrl = uploaded.publicUrl;
      }

      const res = await fetch(`/api/companies/${editingCompany.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          description: cleanDesc,
          image_url: newUrl,
          old_image_url: editingCompany.image_url,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        push({
          type: "error",
          title: "No se pudo guardar",
          message: d.error ?? "Error guardando cambios.",
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
      setEditFile(null);
      if (editFileRef.current) editFileRef.current.value = "";
      await loadCompanies(page);
    } catch (err: any) {
      push({
        type: "error",
        title: "Error",
        message: err?.message ?? "Ocurrió un error inesperado.",
      });
    }
    setSaving(false);
  }

  async function removeCompany(id: number) {
    const company = companies.find((c) => c.id === id);

    const confirmId = push({
      type: "info",
      title: "Confirmación",
      message: `¿Eliminar la empresa "${company?.name ?? "esta empresa"}"? Esta acción no se puede deshacer.`,
      actions: [
        { label: "Cancelar", onClick: () => remove(confirmId) },
        {
          label: "Eliminar",
          onClick: async () => {
            remove(confirmId);
            try {
              const res = await fetch(`/api/companies/${id}`, {
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
                message: `Empresa "${company?.name ?? ""}" eliminada.`,
                durationMs: 1800,
              });

              const nextPage =
                companies.length === 1 && page > 0 ? page - 1 : page;

              await loadCompanies(nextPage);
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

      <div className="pg_company">
        <div id="dashboard" className="company_dashboard">
          <div className="company_dashboard_logaccount">
            <div className="company_panelinfo" id="companies_header">
              <h1>PANEL ADMINISTRADOR EMPRESAS</h1>
              <p>Cuenta: {userEmail}</p>
            </div>
          </div>

          <section className="company_config">
            <div className="company_dashboard_actions">
              <h2>Agregar Empresa</h2>

              <form
                onSubmit={createCompany}
                className="company_dashboard_actions_form"
              >
                <input
                  className="name_field"
                  placeholder="Nombre de la empresa"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <textarea
                  className="name_field"
                  placeholder="Descripción"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />

                <div className="file_field">
                  <label htmlFor="create_file" className="file_label">
                    <Image
                      className="file_icon"
                      src="/images/adminpage/picture.png"
                      alt="Icon"
                      width={50}
                      height={50}
                    />

                    <div className="file_text">
                      <span className="file_title">Subir imagen</span>
                      <span className="file_subtitle">
                        {file ? file.name : "PNG, JPG, WEBP"}
                      </span>
                    </div>

                    <span className="file_button">Elegir</span>

                    {previewUrl && (
                      <div className="company_preview_box">
                        <img
                          src={previewUrl}
                          alt="Preview empresa"
                          className="company_preview_img"
                        />
                      </div>
                    )}
                  </label>

                  <input
                    id="create_file"
                    ref={createFileRef}
                    className="create_file"
                    type="file"
                    accept="image/*"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFile(e.target.files?.[0] ?? null)
                    }
                  />
                </div>

                <button
                  type="submit"
                  className="create_button"
                  disabled={creating}
                >
                  {creating ? "Guardando…" : "Guardar"}
                </button>
              </form>
            </div>

            {editingCompany && (
              <div ref={editBoxRef} className="company_dashboard_actions">
                <h2>Editando: {editingCompany.name}</h2>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveEdit();
                  }}
                  className="company_dashboard_actions_form"
                >
                  <input
                    className="name_field"
                    placeholder="Editar Nombre"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />

                  <textarea
                    className="name_field"
                    placeholder="Editar Descripción"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                  />

                  <div className="file_field">
                    <label htmlFor="edit_file" className="file_label">
                      <Image
                        className="file_icon"
                        src="/images/adminpage/picture.png"
                        alt="Icon"
                        width={50}
                        height={50}
                      />

                      <div className="file_text">
                        <span className="file_title">Cambiar imagen</span>
                        <span className="file_subtitle">
                          {editFile ? editFile.name : "PNG, JPG, WEBP"}
                        </span>
                      </div>

                      <span className="file_button">Cambiar</span>

                      {editPreviewUrl ? (
                        <div className="company_preview_box">
                          <img
                            src={editPreviewUrl}
                            alt="Preview nueva imagen"
                            className="company_preview_img"
                          />
                        </div>
                      ) : editingCompany?.image_url ? (
                        <div className="company_preview_box">
                          <Image
                            src={editingCompany.image_url}
                            alt="Imagen actual"
                            width={200}
                            height={120}
                            className="company_preview_img"
                            unoptimized
                          />
                        </div>
                      ) : null}
                    </label>

                    <input
                      id="edit_file"
                      ref={editFileRef}
                      className="create_file"
                      type="file"
                      accept="image/*"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEditFile(e.target.files?.[0] ?? null)
                      }
                    />
                  </div>

                  <div className="company_dashboard_actions_buttons">
                    <button
                      type="submit"
                      className="edit_button"
                      disabled={saving}
                    >
                      {saving ? "Guardando…" : "Guardar cambios"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="cancel_button"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}
          </section>

          <div className="companies_search">
            <input
              className="companies_search_input"
              placeholder="Buscar empresa por nombre o descripción…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query.trim() && (
              <button
                type="button"
                className="companies_search_clear"
                onClick={() => setQuery("")}
                aria-label="Limpiar búsqueda"
              >
                Limpiar
              </button>
            )}
          </div>

          <section className="companies_list">
            {loading && (
              <div className="companies_loading">Cargando empresas…</div>
            )}

            {!loading && companies.length === 0 && (
              <div className="companies_loading_status">
                No hay empresas registradas
              </div>
            )}

            {!loading &&
              companies.length > 0 &&
              filteredCompanies.length === 0 && (
                <div className="companies_loading_status">
                  No se encontraron empresas para “{query.trim()}”.
                </div>
              )}

            {filteredCompanies.map((c) => (
              <div key={c.id} className="companies_boxes">
                <div className="company_box_info">
                  <Image
                    src={c.image_url}
                    className="company_logo"
                    alt={c.name}
                    width={80}
                    height={60}
                    unoptimized
                  />
                  <div className="company_box_text">
                    <div>{c.name}</div>

                    {!!(c as any).description && (
                      <div className="company_box_desc">
                        {(c as any).description}
                      </div>
                    )}
                  </div>
                </div>

                <div className="company_box_actions">
                  <button
                    className="edit_btn"
                    type="button"
                    onClick={() => {
                      startEdit(c);

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
                    className="delete_btn"
                    onClick={() => removeCompany(c.id)}
                    type="button"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}

            <div className="pageButtons">
              <button
                disabled={page === 0}
                onClick={() => loadCompanies(page - 1)}
                type="button"
              >
                ←
              </button>
              <span> Página {page + 1}</span>
              <button
                disabled={total !== null && (page + 1) * PAGE_SIZE >= total}
                onClick={() => loadCompanies(page + 1)}
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
