"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import "../dashboard/dashboard_layout.css";
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

  const isDashboard = pathname?.startsWith("/admin/dashboard");

  // Evita que el dashboard se renderice antes de verificar sesión
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
    } finally {
      clearAll();
      router.replace("/admin");
    }
  }

  //Check de que exista sesion
  useEffect(() => {
    let canceled = false;

    const run = async () => {
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

        if (!canceled) setCheckingSession(false);
      } catch {
        if (!canceled) setCheckingSession(false);
      }
    };

    run();

    return () => {
      canceled = true;
    };
  }, [isDashboard]);

  //Verificar la sesion periodicamente
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
      } catch {}
    };

    tick();
    const id = window.setInterval(tick, 60_000); //manda un ping cada minuto

    return () => {
      stopped = true;
      window.clearInterval(id);
    };
  }, [isDashboard]);

  return (
    <div className="AdminLayout">
      <Toasts items={toasts} onClose={remove} />

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

      {!isDashboard ? (
        <>{children}</>
      ) : checkingSession ? (
        <div className="dashboard_shell">
          <aside className="dashboard_sidebar" aria-hidden="true" />
          <main id="dashboard_scroll" className="dashboard_content" />
        </div>
      ) : (
        <div className="dashboard_shell">
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

          <main id="dashboard_scroll" className="dashboard_content">
            {children}
          </main>
        </div>
      )}
    </div>
  );
}
