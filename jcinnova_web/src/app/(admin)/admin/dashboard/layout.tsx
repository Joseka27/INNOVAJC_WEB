import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/serverClient";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import Link from "next/link";
import "./dashboard_layout.css";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const supabase = await createClient();
    await requireAdmin(supabase);
    return (
      <div className="dashboard_shell">
        <aside className="dashboard_sidebar" aria-label="Admin sidebar">
          <div className="dashboard_sidebar_brand">
            <div className="dashboard_sidebar_title">INNOVA JC</div>
            <div className="dashboard_sidebar_subtitle">Panel admin</div>
          </div>

          <nav className="dashboard_sidebar_nav" aria-label="Navegación">
            <Link
              className="dashboard_sidebar_link"
              href="/admin/dashboard/companies"
            >
              Empresas
            </Link>

            <Link
              className="dashboard_sidebar_link"
              href="/admin/dashboard/services"
            >
              Servicios
            </Link>
          </nav>
        </aside>
        <main className="dashboard_main">{children}</main>
      </div>
    );
  } catch {
    redirect("/admin");
  }
}
