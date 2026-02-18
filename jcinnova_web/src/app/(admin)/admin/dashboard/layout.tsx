"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

// CSS del dashboard (sidebar + content)
import "../dashboard/dashboard_layout.css";

// ✅ Toasts (misma implementación que ya usas en admin pages)
import {
  Toasts,
  useToasts,
} from "@/app/(admin)/admin/_admin_components/useToast";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const loggingOutRef = useRef(false);

  const { toasts, push, remove, clearAll } = useToasts();

  // Solo estas rutas muestran sidebar + wrapper dashboard_shell
  const isDashboard = pathname?.startsWith("/admin/dashboard");

  // ✅ Evita que el dashboard se renderice antes de verificar sesión
  const [checkingSession, setCheckingSession] = useState(true);

  async function logout(withToast = false) {
    if (loggingOutRef.current) return;
    loggingOutRef.current = true;

    if (withToast) {
      push({
        type: "error",
        title: "Acceso denegado",
        message: "No se pudo acceder. Inicia sesión nuevamente.",
        durationMs: 2500,
      });
    }

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        cache: "no-store",
      });
    } catch {
      // ignoramos
    } finally {
      clearAll();
      router.replace("/admin");
    }
  }

  // ✅ Check inicial: si NO hay sesión, NO renderiza el dashboard (sin flash)
  useEffect(() => {
    let canceled = false;

    const run = async () => {
      // Si no es dashboard, no bloqueamos
      if (!isDashboard) {
        if (!canceled) setCheckingSession(false);
        return;
      }

      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const raw = await res.text();

        let data: any = null;
        try {
          data = raw ? JSON.parse(raw) : null;
        } catch {
          // respuesta inválida => tratamos como sesión inválida
          if (!canceled) {
            setCheckingSession(true);
            await logout(true);
          }
          return;
        }

        if (!data?.user || data?.error === "SESSION_MAX_EXPIRED") {
          if (!canceled) {
            setCheckingSession(true);
            await logout(true);
          }
          return;
        }

        // OK: ya podemos renderizar dashboard
        if (!canceled) setCheckingSession(false);
      } catch {
        // si falla red, por seguridad no bloqueamos para siempre:
        if (!canceled) setCheckingSession(false);
      }
    };

    run();

    return () => {
      canceled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDashboard]);

  // 🔐 Verificación periódica de sesión (solo en dashboard)
  useEffect(() => {
    if (!isDashboard) return;

    let stopped = false;

    const tick = async () => {
      if (stopped || loggingOutRef.current) return;

      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const raw = await res.text();

        let data: any = null;
        try {
          data = raw ? JSON.parse(raw) : null;
        } catch {
          await logout(true);
          return;
        }

        if (!data?.user || data?.error === "SESSION_MAX_EXPIRED") {
          await logout(true);
        }
      } catch {
        // ignoramos errores de red
      }
    };

    tick();
    const id = window.setInterval(tick, 60_000); // cada 1 minuto

    return () => {
      stopped = true;
      window.clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDashboard]);

  return (
    <div className="AdminLayout">
      {/* ✅ Toasts globales del layout */}
      <Toasts items={toasts} onClose={remove} />

      {/* 🔵 HEADER GLOBAL (NO se mueve con el scroll del dashboard) */}
      <header className="pg_header_shell">
        <div className="pg_header section-header">
          <div className="pg_header-principal">
            <div className="pg_header-logo-img">
              <Link className="pg_header-logo-link" href="/">
                <Image
                  className="pg_header_logo"
                  src="/images/LogoInnova.png"
                  alt="Logo"
                  width={100}
                  height={50}
                  priority
                />
              </Link>
            </div>

            <nav className="pg_header-nav" aria-label="Navegación principal">
              <h1>Soluciones Integrales INNOVA JC</h1>
            </nav>
          </div>
        </div>
      </header>

      {/* Si NO es dashboard (ej: /admin login), renderiza normal */}
      {!isDashboard ? (
        <>{children}</>
      ) : checkingSession ? (
        // ✅ Mientras verifica sesión: NO renderiza children (evita flash)
        <div className="dashboard_shell">
          <aside className="dashboard_sidebar" aria-hidden="true" />
          <main id="dashboard_scroll" className="dashboard_content" />
        </div>
      ) : (
        <div className="dashboard_shell">
          {/* 🔵 SIDEBAR */}
          <aside className="dashboard_sidebar">
            <div>
              <div className="dashboard_sidebar_brand">
                <h2>Admin Panel</h2>

                <button
                  onClick={() => logout(false)}
                  className="dashboard_logout_under"
                  type="button"
                >
                  Cerrar sesión
                </button>
              </div>

              <nav className="dashboard_sidebar_nav">
                <Link
                  href="/admin/dashboard/companies"
                  className="dashboard_nav_item"
                >
                  Empresas
                </Link>

                <Link
                  href="/admin/dashboard/modules"
                  className="dashboard_nav_item"
                >
                  Módulos
                </Link>

                <Link
                  href="/admin/dashboard/downloads"
                  className="dashboard_nav_item"
                >
                  Descargas
                </Link>
              </nav>
            </div>
          </aside>

          {/* ✅ Contenedor con scroll */}
          <main id="dashboard_scroll" className="dashboard_content">
            {children}
          </main>
        </div>
      )}
    </div>
  );
}
