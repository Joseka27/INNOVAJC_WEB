"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browserClient";
import "./dashboard_prices.css";

import {
  Toasts,
  useToasts,
} from "@/app/(admin)/admin/_admin_components/useToast";
import { useAdminGate } from "@/app/(admin)/admin/_admin_components/useAdmingate";
import { useIdleLogout } from "@/app/(admin)/admin/_admin_components/useIdlelogout";

const PAGE_SIZE = 10;

const CATEGORY_OPTIONS = [
  "Facturacion Servicios",
  "Puntos de Venta",
  "Despachos Contables",
  "Plantillas",
  "ERP",
] as const;

type PriceCategory = (typeof CATEGORY_OPTIONS)[number];

type PriceRow = {
  id: number;
  title: string | null;
  description: string | null;
  category: string | null;
  characteristics: string | null;
  created_at?: string | null;
};

export default function AdminPricesPage() {
  const router = useRouter();
  const supabase = createClient();

  const { toasts, push, remove, clearAll } = useToasts();
  const { booting, userEmail, isAdmin } = useAdminGate();

  useIdleLogout(push, {
    idleMs: 30 * 60 * 1000,
    sessionMaxMs: 60 * 60 * 1000,
  });

  const editBoxRef = useRef<HTMLDivElement | null>(null);

  const [prices, setPrices] = useState<PriceRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(0);
  const [total, setTotal] = useState<number | null>(null);

  const [query, setQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("Todos");

  // CREATE
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<PriceCategory | "">("");
  const [characteristics, setCharacteristics] = useState("");
  const [creating, setCreating] = useState(false);

  // EDIT
  const [editingId, setEditingId] = useState<number | null>(null);
  const editingPrice = useMemo(
    () => prices.find((p) => p.id === editingId) ?? null,
    [prices, editingId],
  );

  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState<PriceCategory | "">("");
  const [editCharacteristics, setEditCharacteristics] = useState("");
  const [saving, setSaving] = useState(false);

  const maxPage =
    total !== null ? Math.max(0, Math.ceil(total / PAGE_SIZE) - 1) : null;

  const isLastPage =
    maxPage !== null ? page >= maxPage : prices.length < PAGE_SIZE;

  const filteredPrices = useMemo(() => {
    const q = query.trim().toLowerCase();

    return prices.filter((p) => {
      const matchesCategory =
        filterCategory === "Todos" || p.category === filterCategory;

      if (!matchesCategory) return false;

      if (!q) return true;

      const hay =
        `${p.title ?? ""} ${p.description ?? ""} ${p.category ?? ""} ${p.characteristics ?? ""}`.toLowerCase();

      return hay.includes(q);
    });
  }, [prices, query, filterCategory]);

  function resetForms() {
    setTitle("");
    setDescription("");
    setCategory("");
    setCharacteristics("");

    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
    setEditCategory("");
    setEditCharacteristics("");
  }

  useEffect(() => {
    if (!booting && userEmail && isAdmin) {
      loadPrices(0);
    }
  }, [booting, userEmail, isAdmin]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", cache: "no-store" });

    clearAll();
    resetForms();
    setPrices([]);
    setTotal(null);
    setPage(0);

    router.replace("/admin");
  }

  async function loadPrices(p = page) {
    if (total !== null) {
      const mp = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);
      if (p < 0 || p > mp) return;
    }

    setLoading(true);

    try {
      const offset = p * PAGE_SIZE;

      const res = await fetch(
        `/api/prices?limit=${PAGE_SIZE}&offset=${offset}`,
        {
          cache: "no-store",
        },
      );

      const raw = await res.text();
      let data: any = null;

      try {
        if (raw) data = JSON.parse(raw);
      } catch {
        throw new Error(
          `La API no devolvió JSON. Revisa /api/prices (status ${res.status}).`,
        );
      }

      if (!res.ok) {
        throw new Error(data?.error ?? "Error cargando los precios");
      }

      const items: PriceRow[] = Array.isArray(data?.items) ? data.items : [];
      const pricesTotal: number | null =
        typeof data?.count === "number" ? data.count : null;

      setPrices(items);
      setTotal(pricesTotal);
      setPage(p);
    } catch (err: any) {
      push({
        type: "error",
        title: "Error",
        message: err?.message ?? "No se pudieron cargar los precios.",
      });
    }

    setLoading(false);
  }

  async function createPrice(e: React.FormEvent) {
    e.preventDefault();
    if (creating) return;

    const cleanTitle = title.trim();
    const cleanDescription = description;
    const cleanCategory = category;
    const cleanCharacteristics = characteristics;

    if (cleanTitle.length < 2) {
      push({
        type: "error",
        title: "Dato requerido",
        message: "El título debe tener al menos 2 caracteres.",
      });
      return;
    }

    if (!cleanDescription.trim()) {
      push({
        type: "error",
        title: "Dato requerido",
        message: "La descripción es requerida.",
      });
      return;
    }

    if (!cleanCategory) {
      push({
        type: "error",
        title: "Dato requerido",
        message: "Selecciona una categoría.",
      });
      return;
    }

    if (!cleanCharacteristics.trim()) {
      push({
        type: "error",
        title: "Dato requerido",
        message: "Las características son requeridas.",
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

      const res = await fetch("/api/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: cleanTitle,
          description: cleanDescription,
          category: cleanCategory,
          characteristics: cleanCharacteristics,
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        push({
          type: "error",
          title: "No se pudo guardar",
          message: (d as any)?.error ?? "Error creando precio.",
        });
        setCreating(false);
        return;
      }

      push({
        type: "success",
        title: "Listo",
        message: "Precio creado correctamente.",
        durationMs: 1800,
      });

      resetForms();
      await loadPrices(0);
    } catch (err: any) {
      push({
        type: "error",
        title: "Error",
        message: err?.message ?? "Ocurrió un error inesperado.",
      });
    }

    setCreating(false);
  }

  function startEdit(price: PriceRow) {
    setEditingId(price.id);

    setEditTitle(price.title ?? "");
    setEditDescription(price.description ?? "");
    setEditCategory((price.category as PriceCategory) ?? "");
    setEditCharacteristics(price.characteristics ?? "");
  }

  async function saveEdit() {
    if (!editingPrice || saving) return;

    const cleanTitle = editTitle.trim();
    const cleanDescription = editDescription;
    const cleanCategory = editCategory;
    const cleanCharacteristics = editCharacteristics;

    if (cleanTitle.length < 2) {
      push({
        type: "error",
        title: "Dato requerido",
        message: "El título debe tener al menos 2 caracteres.",
      });
      return;
    }

    if (!cleanDescription.trim()) {
      push({
        type: "error",
        title: "Dato requerido",
        message: "La descripción es requerida.",
      });
      return;
    }

    if (!cleanCategory) {
      push({
        type: "error",
        title: "Dato requerido",
        message: "Selecciona una categoría.",
      });
      return;
    }

    if (!cleanCharacteristics.trim()) {
      push({
        type: "error",
        title: "Dato requerido",
        message: "Las características son requeridas.",
      });
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`/api/prices/${editingPrice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: cleanTitle,
          description: cleanDescription,
          category: cleanCategory,
          characteristics: cleanCharacteristics,
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        push({
          type: "error",
          title: "No se pudo guardar",
          message: (d as any)?.error ?? "Error guardando cambios.",
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
      await loadPrices(page);
    } catch (err: any) {
      push({
        type: "error",
        title: "Error",
        message: err?.message ?? "Ocurrió un error inesperado.",
      });
    }

    setSaving(false);
  }

  async function removePrice(id: number) {
    const price = prices.find((p) => p.id === id);

    const confirmId = push({
      type: "info",
      title: "Confirmación",
      message: `¿Eliminar el precio "${price?.title ?? "este precio"}"? Esta acción no se puede deshacer.`,
      actions: [
        { label: "Cancelar", onClick: () => remove(confirmId) },
        {
          label: "Eliminar",
          onClick: async () => {
            remove(confirmId);

            try {
              const res = await fetch(`/api/prices/${id}`, {
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
                message: `Precio "${price?.title ?? ""}" eliminado.`,
                durationMs: 1800,
              });

              await loadPrices(page);
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

      <div className="pg_prices">
        <div id="dashboard_scroll" className="prices_dashboard">
          <div className="prices_dashboard_logaccount">
            <div className="prices_panelinfo">
              <h1>PANEL ADMINISTRADOR PRECIOS</h1>
              <p>Cuenta: {userEmail}</p>
            </div>
          </div>

          <section className="prices_config">
            <div className="prices_dashboard_actions">
              <h2>Agregar Precio</h2>

              <form
                onSubmit={createPrice}
                className="prices_dashboard_actions_form"
              >
                <input
                  className="prices_name_field"
                  placeholder="Título"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />

                <textarea
                  className="prices_textarea_field"
                  placeholder="Descripción"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />

                <select
                  className="prices_select_field"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as PriceCategory)}
                >
                  <option value="" disabled>
                    Selecciona categoría…
                  </option>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>

                <textarea
                  className="prices_textarea_field"
                  placeholder="Características"
                  value={characteristics}
                  onChange={(e) => setCharacteristics(e.target.value)}
                  rows={3}
                />

                <button
                  type="submit"
                  className="prices_create_button"
                  disabled={creating}
                >
                  {creating ? "Guardando…" : "Guardar"}
                </button>
              </form>
            </div>

            {editingPrice && (
              <div ref={editBoxRef} className="prices_dashboard_actions">
                <h2>Editando: {editingPrice.title}</h2>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveEdit();
                  }}
                  className="prices_dashboard_actions_form"
                >
                  <input
                    className="prices_name_field"
                    placeholder="Editar título"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />

                  <textarea
                    className="prices_textarea_field"
                    placeholder="Editar descripción"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={2}
                  />

                  <select
                    className="prices_select_field"
                    value={editCategory}
                    onChange={(e) =>
                      setEditCategory(e.target.value as PriceCategory)
                    }
                  >
                    <option value="" disabled>
                      Selecciona categoría…
                    </option>
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>

                  <textarea
                    className="prices_textarea_field"
                    placeholder="Editar características"
                    value={editCharacteristics}
                    onChange={(e) => setEditCharacteristics(e.target.value)}
                    rows={3}
                  />

                  <div className="prices_dashboard_actions_buttons">
                    <button
                      type="submit"
                      className="prices_edit_button"
                      disabled={saving}
                    >
                      {saving ? "Guardando…" : "Guardar cambios"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="prices_cancel_button"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}
          </section>

          <div className="prices_search">
            <input
              className="prices_search_input"
              placeholder="Buscar carta de precio"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            {query.trim() && (
              <button
                type="button"
                className="prices_search_clear"
                onClick={() => setQuery("")}
                aria-label="Limpiar búsqueda"
              >
                Limpiar
              </button>
            )}

            <select
              className="prices_select_field"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              style={{ maxWidth: 260 }}
            >
              <option value="Todos">Todos</option>
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <section className="prices_list">
            {loading && <div className="prices_loading">Cargando precios…</div>}

            {!loading && prices.length === 0 && (
              <div className="prices_loading_status">
                No hay precios registrados
              </div>
            )}

            {!loading && prices.length > 0 && filteredPrices.length === 0 && (
              <div className="prices_loading_status">
                No se encontraron precios para esta categoria
              </div>
            )}

            {filteredPrices.map((p) => {
              return (
                <div key={p.id} className="prices_boxes">
                  <div className="prices_box_info">
                    <div className="prices_card_text">
                      <div className="prices_card_top">
                        <div className="prices_card_name">{p.title}</div>
                        <div className="prices_card_category">
                          {p.category ?? "N/A"}
                        </div>
                      </div>

                      <div className="prices_card_desc">
                        <span className="prices_card_short_desc">
                          Descripción:
                        </span>
                        {"\n"}
                        {p.description ?? "—"}
                      </div>
                    </div>
                  </div>

                  <div className="prices_box_actions">
                    <button
                      className="prices_edit_btn"
                      type="button"
                      onClick={() => {
                        startEdit(p);

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
                      className="prices_delete_btn"
                      onClick={() => removePrice(p.id)}
                      type="button"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })}

            <div className="prices_pageButtons">
              <button
                disabled={loading || page === 0}
                onClick={() => loadPrices(page - 1)}
                type="button"
              >
                ←
              </button>

              <span>Página {page + 1}</span>

              <button
                disabled={loading || isLastPage}
                onClick={() => {
                  if (!isLastPage) loadPrices(page + 1);
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
