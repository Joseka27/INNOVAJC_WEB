"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Company } from "@/models/companiesModel";
import { createClient } from "@/lib/supabase/browserClient";
import { resizeImageToWebp } from "@/lib/images/resizeImage";
import { uploadCompanyImage } from "@/lib/storage/companiesBucket";
import "./admin_dashboard.css";

/* Max page size */
const PAGE_SIZE = 10;

/* ========= Toast system (same style as login) ========= */
type ToastType = "success" | "error" | "info";
type ToastAction = { label: string; onClick: () => void };

type ToastItem = {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  durationMs?: number;
  actions?: ToastAction[];
};

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  function push(t: Omit<ToastItem, "id">) {
    const id = uid();
    const toast: ToastItem = { id, durationMs: 3500, ...t };

    setToasts((prev) => [toast, ...prev].slice(0, 4));

    // si tiene acciones, no autocerrar (confirmación)
    if (toast.actions?.length) return id;

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, toast.durationMs);

    return id;
  }

  function remove(id: string) {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }

  function clearAll() {
    setToasts([]);
  }

  return { toasts, push, remove, clearAll };
}

function Toasts({
  items,
  onClose,
}: {
  items: ToastItem[];
  onClose: (id: string) => void;
}) {
  if (!items.length) return null;

  return (
    <div
      className="pg_toast_container"
      aria-live="polite"
      aria-relevant="additions"
    >
      {items.map((t) => (
        <div key={t.id} className={`pg_toast pg_toast--${t.type}`}>
          <button
            type="button"
            className="pg_toast_close"
            onClick={() => onClose(t.id)}
            aria-label="Cerrar notificación"
          >
            ×
          </button>

          <div className="pg_toast_body">
            {t.title ? <div className="pg_toast_title">{t.title}</div> : null}
            <div className="pg_toast_msg">{t.message}</div>

            {t.actions?.length ? (
              <div className="pg_toast_actions">
                {t.actions.map((a) => (
                  <button
                    key={a.label}
                    type="button"
                    className="pg_toast_actionbtn"
                    onClick={a.onClick}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {!t.actions?.length ? (
            <div
              className="pg_toast_bar"
              style={{ animationDuration: `${t.durationMs ?? 3500}ms` }}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const { toasts, push, remove } = useToasts();

  const createFileRef = useRef<HTMLInputElement | null>(null);
  const editFileRef = useRef<HTMLInputElement | null>(null);

  /* ---------------- AUTH ---------------- */
  const [booting, setBooting] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  /* ---------------- DATA ---------------- */
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState<number | null>(null);
  const [query, setQuery] = useState("");

  /* ---------------- CREATE ---------------- */
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);

  /* ---------------- EDIT ---------------- */
  const [editingId, setEditingId] = useState<number | null>(null);
  const editingCompany = useMemo(
    () => companies.find((c) => c.id === editingId) ?? null,
    [companies, editingId],
  );
  const filteredCompanies = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return companies;

    return companies.filter((c) => (c.name ?? "").toLowerCase().includes(q));
  }, [companies, query]);

  const [editName, setEditName] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  /* Reset all forms after use them */
  async function resetForms() {
    setName("");
    setFile(null);
    if (createFileRef.current) createFileRef.current.value = "";

    setEditingId(null);
    setEditName("");
    setEditFile(null);
    if (editFileRef.current) editFileRef.current.value = "";
  }

  async function getMe(): Promise<{
    ok: boolean;
    isAdmin: boolean;
    email: string | null;
  }> {
    const res = await fetch("/api/auth/me", {
      method: "GET",
      cache: "no-store",
    });
    const data = await res.json();

    if (!res.ok || !data.user) {
      setUserEmail(null);
      setIsAdmin(false);
      return { ok: false, isAdmin: false, email: null };
    }

    const email = data.user.email ?? null;
    const admin = Boolean(data.isAdmin);

    setUserEmail(email);
    setIsAdmin(admin);

    return { ok: true, isAdmin: admin, email };
  }

  /* ---- idle logout (lo dejé igual, pero con UX mejor) ---- */
  const IDLE_MS = 15 * 60 * 1000; // 15 min
  const timerRef = useRef<number | null>(null);

  async function forceLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/admin");
    }
  }

  function resetTimer() {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      push({
        type: "info",
        title: "Sesión expirada",
        message: "Se cerró tu sesión por inactividad.",
      });
      forceLogout();
    }, IDLE_MS);
  }

  useEffect(() => {
    resetTimer();

    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
    ];
    const onActivity = () => resetTimer();

    events.forEach((e) =>
      window.addEventListener(e, onActivity, { passive: true }),
    );

    const onVisibility = () => {
      if (!document.hidden) resetTimer();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      events.forEach((e) => window.removeEventListener(e, onActivity));
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      const me = await getMe();
      setBooting(false);

      if (!me.ok || !me.isAdmin) {
        router.replace("/admin");
        return;
      }

      await loadCompanies(0);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });

    await resetForms();
    setCompanies([]);
    setTotal(null);
    setPage(0);

    setUserEmail(null);
    setIsAdmin(false);

    router.replace("/admin");
  }

  async function loadCompanies(p = page) {
    setLoading(true);
    try {
      const offset = p * PAGE_SIZE;
      const res = await fetch(
        `/api/companies?limit=${PAGE_SIZE}&offset=${offset}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error cargando empresas");

      setEditingId(null);
      setEditFile(null);
      if (editFileRef.current) editFileRef.current.value = "";

      setCompanies(data.items);
      setTotal(data.count);
      setPage(p);
    } catch (err: any) {
      push({
        type: "error",
        title: "Error",
        message: err?.message ?? "No se pudieron cargar las empresas.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function createCompany(e: React.FormEvent) {
    e.preventDefault();
    if (creating) return;

    const cleanName = name.trim();
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
        body: JSON.stringify({ name: cleanName, image_url: publicUrl }),
      });

      if (!res.ok) {
        const d = await res.json();
        push({
          type: "error",
          title: "No se pudo guardar",
          message: d.error ?? "Error creando empresa.",
        });
        return;
      }

      push({
        type: "success",
        title: "Listo",
        message: "Empresa creada correctamente.",
        durationMs: 1800,
      });
      setName("");
      setFile(null);
      if (createFileRef.current) createFileRef.current.value = "";
      await loadCompanies(0);
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

  function startEdit(c: Company) {
    setEditingId(c.id);
    setEditName(c.name);
    setEditFile(null);
    if (editFileRef.current) editFileRef.current.value = "";
  }

  async function saveEdit() {
    if (!editingCompany || saving) return;

    const cleanName = (editName ?? "").trim();
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
    } finally {
      setSaving(false);
    }
  }

  async function removeCompany(id: number) {
    const confirmId = push({
      type: "info",
      title: "Confirmación",
      message: "¿Eliminar esta empresa? Esta acción no se puede deshacer.",
      actions: [
        {
          label: "Cancelar",
          onClick: () => {
            remove(confirmId); // ✅ ahora sí se cierra
          },
        },
        {
          label: "Eliminar",
          onClick: async () => {
            remove(confirmId); // ✅ cerramos el toast antes de ejecutar
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
                message: "Empresa eliminada.",
                durationMs: 1800,
              });

              await loadCompanies(page);
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

    // Nota: confirmId siempre existe porque push() devuelve id.
  }

  /* ---------------- UI ---------------- */
  if (booting) return <div className="p-6">Cargando…</div>;
  if (!userEmail || !isAdmin) return <div className="p-6">Redirigiendo…</div>;

  return (
    <>
      <Toasts items={toasts} onClose={remove} />

      <div className="pg_admin">
        <div id="dashboard" className="admin_dashboard">
          <div className="admin_dashboard_logaccount">
            <div className="admin_panelinfo">
              <h1>PANEL ADMINISTRADOR</h1>
              <p>Cuenta: {userEmail}</p>
            </div>

            <button onClick={logout} className="logout_button" type="button">
              Cerrar Sesión
            </button>
          </div>

          <section className="admin_config">
            {/* ===== CREAR ===== */}
            <div className="admin_dashboard_actions">
              <h2>Agregar Empresa</h2>

              <form
                onSubmit={createCompany}
                className="admin_dashboard_actions_form"
              >
                <input
                  className="name_field"
                  placeholder="Nombre de la empresa"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <div className="file_field">
                  <label htmlFor="create_file" className="file_label">
                    <span className="file_icon">🖼️</span>

                    <div className="file_text">
                      <span className="file_title">Subir imagen</span>
                      <span className="file_subtitle">
                        {file ? file.name : "PNG, JPG, WEBP"}
                      </span>
                    </div>

                    <span className="file_button">Elegir</span>
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

            {/* ===== EDITAR ===== */}
            {editingCompany && (
              <div className="admin_dashboard_actions">
                <h2>Editando: {editingCompany.name}</h2>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveEdit();
                  }}
                  className="admin_dashboard_actions_form"
                >
                  <input
                    className="name_field"
                    placeholder="Editar Nombre"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />

                  <div className="file_field">
                    <label htmlFor="edit_file" className="file_label">
                      <span className="file_icon">🖼️</span>

                      <div className="file_text">
                        <span className="file_title">Cambiar imagen</span>
                        <span className="file_subtitle">
                          {editFile ? editFile.name : "PNG, JPG, WEBP"}
                        </span>
                      </div>

                      <span className="file_button">Cambiar</span>
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

                  <div className="admin_dashboard_actions_buttons">
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
              placeholder="Buscar empresa por nombre…"
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

          {/* LIST */}
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
                  <img
                    src={c.image_url}
                    className="company_logo"
                    alt={c.name}
                  />
                  <div>{c.name}</div>
                </div>

                <div className="company_box_actions">
                  <button
                    className="edit_btn"
                    onClick={() => startEdit(c)}
                    type="button"
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
