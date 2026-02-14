"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

// CSS del dashboard (sidebar + content)
import "../dashboard/dashboard_layout.css";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const loggingOutRef = useRef(false);

  // Solo estas rutas muestran sidebar + wrapper dashboard_shell
  const isDashboard = pathname?.startsWith("/admin/dashboard");

  async function logout() {
    if (loggingOutRef.current) return;
    loggingOutRef.current = true;

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        cache: "no-store",
      });
    } finally {
      router.replace("/admin");
    }
  }

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
          await logout();
          return;
        }

        if (!data?.user || data?.error === "SESSION_MAX_EXPIRED") {
          await logout();
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
  }, [isDashboard]);

  return (
    <div className="AdminLayout">
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
      ) : (
        <div className="dashboard_shell">
          {/* 🔵 SIDEBAR */}
          <aside className="dashboard_sidebar">
            <div>
              <div className="dashboard_sidebar_brand">
                <h2>Admin Panel</h2>

                <button
                  onClick={logout}
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
              </nav>
            </div>
          </aside>

          {/* 🔥 IMPORTANTE:
             Este es el contenedor que tiene el scroll.
             NO el window.
          */}
          <main id="dashboard_scroll" className="dashboard_content">
            {children}
          </main>
        </div>
      )}
    </div>
  );
}
