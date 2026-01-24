import type { Metadata } from "next";
import "./admin_globals.css";
import "./admin_header.css";
import { Roboto } from "next/font/google";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "INNOVA JC | Admin",
  description: "INNOVA JC | Admin",
};

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${roboto.className} antialiased`}>
        <div className="AdminLayout">
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

                {/* Desktop nav */}
                <nav
                  className="pg_header-nav"
                  aria-label="Navegación principal"
                >
                  <Link className="pg_header-link" href="/about">
                    Sobre Nosotros
                  </Link>
                  <Link className="pg_header-link" href="/customers">
                    Clientes
                  </Link>
                  <Link className="pg_header-link" href="/downloads">
                    Descargar
                  </Link>
                </nav>

                {/* Mobile menu (no JS needed) */}
                <details className="pg_header-menu">
                  <summary
                    className="pg_header-menu_btn"
                    aria-label="Abrir menú"
                  >
                    <span className="pg_header-burger" aria-hidden="true" />
                  </summary>

                  <nav className="pg_header-menu_panel" aria-label="Menú móvil">
                    <Link className="pg_header-link" href="/about">
                      Sobre Nosotros
                    </Link>
                    <Link className="pg_header-link" href="/customers">
                      Clientes
                    </Link>
                    <Link className="pg_header-link" href="/downloads">
                      Descargar
                    </Link>
                  </nav>
                </details>
              </div>
            </div>
          </header>

          {children}
        </div>
      </body>
    </html>
  );
}
