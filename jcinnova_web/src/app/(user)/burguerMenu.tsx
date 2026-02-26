"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function HeaderClient() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);
  const toggleMenu = () => setIsMenuOpen((v) => !v);

  // Cierra con ESC
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeMenu();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Bloquea scroll del body cuando el menú está abierto (evita “scroll raro”)
  useEffect(() => {
    if (!isMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMenuOpen]);

  return (
    <div className="pg_header section-header">
      <div className="pg_header-principal">
        <div className="pg_header-logo-img">
          <Link href="/" aria-label="Ir al inicio" onClick={closeMenu}>
            <Image
              className="pg_header_logo"
              src="/images/LogoInnova.png"
              alt="Logo"
              width={80}
              height={80}
              priority
            />
          </Link>
        </div>

        {/* Desktop links (se ocultan en móvil via CSS) */}
        <div className="pg_header-linkrouters-links">
          <div className="pg_header-linkrouter">
            <Link href="/about">Sobre Nosotros</Link>
          </div>
          <div className="pg_header-linkrouter">
            <Link href="/customers">Clientes</Link>
          </div>
          <div className="pg_header-linkrouter">
            <Link href="/downloads">Descargar</Link>
          </div>
        </div>
      </div>

      <div className="pg_header-right">
        <div className="pg_header-contactbutton">
          <Link href="/contact">Contactanos</Link>
        </div>

        {/* Burger */}
        <button
          type="button"
          className={`pg_header-burger ${isMenuOpen ? "is-open" : ""}`}
          onClick={toggleMenu}
          aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
        >
          <span />
          <span />
          <span />
        </button>

        {/* Panel */}
        <div
          id="mobile-menu"
          className={`pg_header-mobilePanel ${isMenuOpen ? "is-open" : ""}`}
          aria-label="Menú móvil"
        >
          <nav className="pg_header-mobileNav">
            <Link
              className="pg_header-mobileLink"
              href="/about"
              onClick={closeMenu}
            >
              Sobre Nosotros
            </Link>
            <Link
              className="pg_header-mobileLink"
              href="/customers"
              onClick={closeMenu}
            >
              Clientes
            </Link>
            <Link
              className="pg_header-mobileLink"
              href="/downloads"
              onClick={closeMenu}
            >
              Descargar
            </Link>

            <div className="pg_header-mobileDivider" />

            <Link
              className="pg_header-mobileCta"
              href="/contact"
              onClick={closeMenu}
            >
              Contactanos
            </Link>
          </nav>
        </div>

        {/* Backdrop */}
        <button
          type="button"
          className={`pg_header-backdrop ${isMenuOpen ? "is-open" : ""}`}
          onClick={closeMenu}
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>
    </div>
  );
}
