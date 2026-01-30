"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import "./dashboard_layout.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/admin");
    }
  }

  return (
    <div className="dashboard_shell">
      {/* ===== SIDEBAR ===== */}
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

      {/* ===== CONTENT ===== */}
      <main className="dashboard_content">{children}</main>
    </div>
  );
}
