"use client";

import React, { useEffect, useState } from "react";
import "./categoryManage.css";

export type CategoryRow = {
  id: number;
  page: string;
  name: string;
  created_at?: string | null;
};

type ToastAction = {
  label: string;
  onClick: () => void | Promise<void>;
};

type PushToastInput = {
  type: "success" | "error" | "info";
  title: string;
  message: string;
  durationMs?: number;
  actions?: ToastAction[];
};

type CategoryManagerProps = {
  pageKey: string;
  title?: string;
  push: (input: PushToastInput) => string | number;
  remove: (id: string | number) => void;
  onChanged?: (categories: CategoryRow[]) => void | Promise<void>;
  className?: string;
};

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

export default function CategoryManager({
  pageKey,
  title = `Agregar:`,
  push,
  remove,
  onChanged,
  className = "category_dashboard_actions",
}: CategoryManagerProps) {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [newCategoryName, setNewCategoryName] = useState("");
  const [creating, setCreating] = useState(false);

  const [renamingCategoryId, setRenamingCategoryId] = useState<number | null>(
    null,
  );
  const [renameCategoryName, setRenameCategoryName] = useState("");
  const [savingRename, setSavingRename] = useState(false);

  async function notifyChanged(nextCategories: CategoryRow[]) {
    if (!onChanged) return;
    await onChanged(nextCategories);
  }

  async function loadCategories() {
    setLoading(true);

    try {
      const res = await fetch(
        `/api/categories?page=${encodeURIComponent(pageKey)}`,
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
          `La API no devolvió JSON válido en /api/categories (status ${res.status}).`,
        );
      }

      if (!res.ok) {
        throw new Error(data?.error ?? "No se pudieron cargar las categorías.");
      }

      const items: CategoryRow[] = Array.isArray(data) ? data : [];
      setCategories(items);
      await notifyChanged(items);
    } catch (err: any) {
      push({
        type: "error",
        title: "Error",
        message: err?.message ?? "No se pudieron cargar las categorías.",
      });
    }

    setLoading(false);
  }

  useEffect(() => {
    void loadCategories();
  }, [pageKey]);

  async function createCategory(e: React.FormEvent) {
    e.preventDefault();
    if (creating) return;

    const cleanName = newCategoryName.trim();

    if (cleanName.length < 2) {
      push({
        type: "error",
        title: "Dato requerido",
        message: "El nombre de la categoría debe tener al menos 2 caracteres.",
      });
      return;
    }

    setCreating(true);

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          page: pageKey,
          name: cleanName,
        }),
      });

      const d = await res.json().catch(() => ({}));

      if (!res.ok) {
        push({
          type: "error",
          title: "No se pudo crear",
          message: d?.error ?? "Error creando categoría.",
        });
        setCreating(false);
        return;
      }

      push({
        type: "success",
        title: "Listo",
        message: "Categoría creada correctamente.",
        durationMs: 1800,
      });

      setNewCategoryName("");
      await loadCategories();
    } catch (err: any) {
      push({
        type: "error",
        title: "Error",
        message: err?.message ?? "Ocurrió un error inesperado.",
      });
    }

    setCreating(false);
  }

  function startRenameCategory(cat: CategoryRow) {
    setRenamingCategoryId(cat.id);
    setRenameCategoryName(cat.name);
  }

  function cancelRename() {
    setRenamingCategoryId(null);
    setRenameCategoryName("");
  }

  async function saveRenameCategory() {
    if (!renamingCategoryId || savingRename) return;

    const cleanName = renameCategoryName.trim();

    if (cleanName.length < 2) {
      push({
        type: "error",
        title: "Dato requerido",
        message: "El nombre de la categoría debe tener al menos 2 caracteres.",
      });
      return;
    }

    setSavingRename(true);

    try {
      const res = await fetch(`/api/categories/${renamingCategoryId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: cleanName,
        }),
      });

      const d = await res.json().catch(() => ({}));

      if (!res.ok) {
        push({
          type: "error",
          title: "No se pudo renombrar",
          message: d?.error ?? "Error renombrando categoría.",
        });
        setSavingRename(false);
        return;
      }

      push({
        type: "success",
        title: "Actualizado",
        message: "Categoría renombrada correctamente.",
        durationMs: 1800,
      });

      cancelRename();
      await loadCategories();
    } catch (err: any) {
      push({
        type: "error",
        title: "Error",
        message: err?.message ?? "Ocurrió un error inesperado.",
      });
    }

    setSavingRename(false);
  }

  async function removeCategory(cat: CategoryRow) {
    const confirmId = push({
      type: "info",
      title: "Confirmación",
      message: `¿Eliminar la categoría "${formatCategoryLabel(cat.name)}"? Esta acción no se puede deshacer.`,
      actions: [
        {
          label: "Cancelar",
          onClick: () => remove(confirmId),
        },
        {
          label: "Eliminar",
          onClick: async () => {
            remove(confirmId);

            try {
              const res = await fetch(`/api/categories/${cat.id}`, {
                method: "DELETE",
              });

              const d = await res.json().catch(() => ({}));

              if (!res.ok) {
                push({
                  type: "error",
                  title: "Error",
                  message: d?.error ?? "No se pudo eliminar la categoría.",
                });
                return;
              }

              push({
                type: "success",
                title: "Eliminada",
                message: "Categoría eliminada.",
                durationMs: 1800,
              });

              if (renamingCategoryId === cat.id) {
                cancelRename();
              }

              await loadCategories();
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

  return (
    <div className={className}>
      <h2>{title}</h2>

      <form
        onSubmit={createCategory}
        className="category_dashboard_actions_form"
      >
        <input
          className="category_name_field"
          placeholder="Nueva categoría"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
        />

        <button
          type="submit"
          className="category_create_button"
          disabled={creating}
        >
          {creating ? "Guardando…" : "Agregar categoría"}
        </button>
      </form>

      {loading && (
        <div className="category_loading_status">Cargando categorías…</div>
      )}

      {!loading && categories.length === 0 && (
        <div className="category_loading_status">
          No hay categorías registradas
        </div>
      )}

      {!loading && categories.length > 0 && (
        <div className="category_categories_list">
          {categories.map((cat) => {
            const isRenaming = renamingCategoryId === cat.id;

            return (
              <div key={cat.id} className="category_category_item">
                {!isRenaming ? (
                  <>
                    <div className="category_category_name">
                      {formatCategoryLabel(cat.name)}
                    </div>

                    <div className="category_dashboard_actions_buttons">
                      <button
                        type="button"
                        className="category_edit_button"
                        onClick={() => startRenameCategory(cat)}
                      >
                        Renombrar
                      </button>

                      <button
                        type="button"
                        className="category_cancel_button"
                        onClick={() => removeCategory(cat)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <input
                      className="category_name_field"
                      placeholder="Nuevo nombre"
                      value={renameCategoryName}
                      onChange={(e) => setRenameCategoryName(e.target.value)}
                    />

                    <div className="category_dashboard_actions_buttons">
                      <button
                        type="button"
                        className="category_edit_button"
                        onClick={saveRenameCategory}
                        disabled={savingRename}
                      >
                        {savingRename ? "Guardando…" : "Guardar nombre"}
                      </button>

                      <button
                        type="button"
                        className="category_cancel_button"
                        onClick={cancelRename}
                      >
                        Cancelar
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
