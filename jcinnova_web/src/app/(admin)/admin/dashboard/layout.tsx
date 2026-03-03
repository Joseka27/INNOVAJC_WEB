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

import AdminBurgerMenu from "./AdminBurguer";

async function fetchSessionData(): Promise<any> {
  const res = await fetch("/api/auth/me", { cache: "no-store" });
  const raw = await res.text();
  let data: any = null;
  try {
    if (raw) data = JSON.parse(raw);
  } catch {
    data = null;
  }
  return data;
}

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

  // ✅ Burger state (solo afecta móvil; desktop ignora)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleSidebar = () => setIsSidebarOpen((v) => !v);

  // Cierra el sidebar si cambias de ruta
  useEffect(() => {
    closeSidebar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

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
    } catch {}
    clearAll();
    router.replace("/admin");
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
        const data = await fetchSessionData();

        if (!data || !data.user || data.error === "SESSION_MAX_EXPIRED") {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDashboard]);

  //Verificar la sesion periodicamente
  useEffect(() => {
    if (!isDashboard) return;

    let stopped = false;

    const tick = async () => {
      if (stopped || loggingOutRef.current) return;

      try {
        const data = await fetchSessionData();

        if (!data || !data.user || data.error === "SESSION_MAX_EXPIRED") {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDashboard]);

  return (
    <div className="AdminLayout">
      <Toasts items={toasts} onClose={remove} />

      <header className="pg_header_shell">
        <div className="pg_header section-header">
          {/* ✅ Burger visible solo en móvil (CSS) y solo si es dashboard */}
          {isDashboard && !checkingSession ? (
            <div className="admin_burgerSlot">
              <AdminBurgerMenu
                isOpen={isSidebarOpen}
                onToggle={toggleSidebar}
                onClose={closeSidebar}
                controlsId="admin-sidebar"
              />
            </div>
          ) : null}

          <div className="pg_header-principal">
            <nav className="pg_header-nav" aria-label="Navegación principal">
              <h1>Panel Administrador</h1>
            </nav>
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
          <aside
            id="admin-sidebar"
            className={`dashboard_sidebar ${isSidebarOpen ? "is-open" : ""}`}
          >
            <div className="dashboard_sidebar_for_burguer">
              <div className="dashboard_sidebar_brand">
                <h2>Admin Panel</h2>

                <button
                  onClick={() => {
                    closeSidebar();
                    logout(false);
                  }}
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
                  onClick={closeSidebar}
                >
                  Empresas
                </Link>

                <Link
                  href="/admin/dashboard/modules"
                  className="dashboard_nav_item"
                  onClick={closeSidebar}
                >
                  Módulos
                </Link>

                <Link
                  href="/admin/dashboard/downloads"
                  className="dashboard_nav_item"
                  onClick={closeSidebar}
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
