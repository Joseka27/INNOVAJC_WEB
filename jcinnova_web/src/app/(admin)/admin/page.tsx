"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import "./adminlogin.css";
import Image from "next/image";

type ToastType = "success" | "error" | "info";

type ToastItem = {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  durationMs?: number;
};

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/** Hook ultra liviano para toasts */
function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  function push(t: Omit<ToastItem, "id">) {
    const id = uid();
    const toast: ToastItem = { id, durationMs: 3500, ...t };
    setToasts((prev) => [toast, ...prev].slice(0, 4)); // max 4 visibles

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, toast.durationMs);
  }

  function remove(id: string) {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }

  return { toasts, push, remove };
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
          </div>

          {/* Barra de progreso */}
          <div
            className="pg_toast_bar"
            style={{ animationDuration: `${t.durationMs ?? 3500}ms` }}
          />
        </div>
      ))}
    </div>
  );
}

export default function AdminLoginPage() {
  const router = useRouter();
  const { toasts, push, remove } = useToasts();

  const [booting, setBooting] = useState(true);
  const [checking, setChecking] = useState(false);

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const iconSize = useMemo(() => ({ width: 18, height: 18 }), []);

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

    const em = data.user.email ?? null;
    const admin = Boolean(data.isAdmin);

    setUserEmail(em);
    setIsAdmin(admin);

    return { ok: true, isAdmin: admin, email: em };
  }

  useEffect(() => {
    (async () => {
      const me = await getMe();
      setBooting(false);
      if (me.ok && me.isAdmin) router.replace("/admin/dashboard");
    })();
  }, [router]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    if (checking) return;

    setChecking(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        push({
          type: "error",
          title: "No se pudo iniciar sesión",
          message: data.error ?? "Login error",
        });
        return;
      }

      const me = await getMe();
      setPassword("");

      if (!me.ok) {
        push({
          type: "error",
          title: "Sesión inválida",
          message: "No se pudo validar la sesión.",
        });
        return;
      }

      if (!me.isAdmin) {
        await fetch("/api/auth/logout", { method: "POST" });
        await getMe();

        push({
          type: "error",
          title: "Acceso denegado",
          message: "Tu usuario no tiene permisos de admin.",
        });
        return;
      }

      push({
        type: "success",
        title: "Bienvenido",
        message: "Acceso concedido. Redirigiendo…",
        durationMs: 1800,
      });

      router.replace("/admin/dashboard");
    } catch {
      push({
        type: "error",
        title: "Error de red",
        message: "Revisa tu conexión e inténtalo de nuevo.",
      });
    } finally {
      setChecking(false);
    }
  }

  /* ========= UI ========= */
  if (booting) return <div className="p-6">Cargando…</div>;

  return (
    <>
      <Toasts items={toasts} onClose={remove} />

      <div className="pg_admin">
        <form onSubmit={login} className="pg_admin_login">
          <h1>INNOVA JC PANEL</h1>

          <div className="pg_admin_box">
            <input
              className="pg_admin_input"
              placeholder="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Image
              className="pg_admin_inputicon"
              src="/images/adminpage/emailicon.png"
              alt=""
              {...iconSize}
              aria-hidden
            />
          </div>

          <div className="pg_admin_box">
            <input
              className="pg_admin_input"
              placeholder="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Image
              className="pg_admin_inputicon"
              src="/images/adminpage/lockicon.png"
              alt=""
              {...iconSize}
              aria-hidden
            />
          </div>

          <button className="pg_admin_button" type="submit" disabled={checking}>
            {checking ? "Validando…" : "Iniciar Sesión"}
          </button>
        </form>
      </div>
    </>
  );
}
