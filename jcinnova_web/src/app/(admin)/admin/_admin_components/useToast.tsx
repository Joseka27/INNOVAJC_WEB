"use client";
import "./useToast.css";

import React, { useState } from "react";

export type ToastType = "success" | "error" | "info";
export type ToastAction = { label: string; onClick: () => void };

export type ToastItem = {
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

export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  function push(t: Omit<ToastItem, "id">) {
    const id = uid();
    const toast: ToastItem = { id, durationMs: 3500, ...t };

    setToasts((prev) => [toast, ...prev].slice(0, 4));

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

export function Toasts({
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
