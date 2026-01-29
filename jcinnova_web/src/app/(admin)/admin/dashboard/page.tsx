"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboardPage() {
  const router = useRouter();

  const [booting, setBooting] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

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

  const IDLE_MS = 15 * 60 * 1000; // 15 min
  const timerRef = useRef<number | null>(null);

  async function forceLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/admin");
    }
  }

  const { push } = useToasts();

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
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });

    setUserEmail(null);
    setIsAdmin(false);

    router.replace("/admin");
  }

  /* ---------------- UI ---------------- */
  if (booting) return <div className="p-6">Cargando…</div>;
  if (!userEmail || !isAdmin) return <div className="p-6">Redirigiendo…</div>;

  return (
    <>
      <div className="pg_dashboard">
        <div className="pg_dashboard_principal">
          <div className="dashboard_panelinfo">
            <h1>BIENVENIDO AL PANEL ADMINISTRADOR</h1>
            <p>Cuenta: {userEmail}</p>
          </div>

          <button
            onClick={logout}
            className="logout_button_dashboard"
            type="button"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </>
  );
}
