import type { Metadata } from "next";
import "./user_layout.css";

import Link from "next/link";
import Image from "next/image";
import { FaFacebook, FaInstagram, FaTwitter, FaWhatsapp } from "react-icons/fa";
import { Roboto } from "next/font/google";

export const metadata: Metadata = {
  title: {
    default: "Innova JC",
    template: "Innova JC | %s",
  },
  description: "Software de Gestión Contable y Administrativa",
};

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const FooterSchedule = () => {
  const schedule = [
    { day: "Domingo", hours: "Cerrado" },
    { day: "Lunes", hours: "6:00 AM - 1:00 PM" },
    { day: "Martes", hours: "6:00 AM - 1:00 PM" },
    { day: "Miércoles", hours: "6:00 AM - 1:00 PM" },
    { day: "Jueves", hours: "6:00 AM - 1:00 PM" },
    { day: "Viernes", hours: "6:00 AM - 1:00 PM" },
    { day: "Sábado", hours: "6:00 AM - 1:00 PM" },
  ];

  const todayIndex = new Date().getDay();

  return (
    <div className="schedule">
      <h4 className="text-center">Horario de Atención</h4>
      {schedule.map((s, index) => (
        <div
          key={index}
          className={`schedule-row ${index === todayIndex ? "today" : ""}`}
        >
          <span>{s.day}</span>
          <span>{s.hours}</span>
        </div>
      ))}
    </div>
  );
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${roboto.className} antialiased`}>
        <div className="UserLayout">
          <header>
            <div className="pg_header section-header">
              <div className="pg_header-principal">
                <div className="pg_header-logo-img">
                  <Link href="/" aria-label="Ir al inicio">
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

                {/* Mobile menu (CSS-only). NO renombra clases existentes. */}
                <input
                  id="nav-toggle"
                  className="pg_header-navToggle"
                  type="checkbox"
                />

                <label
                  className="pg_header-burger"
                  htmlFor="nav-toggle"
                  aria-label="Abrir menú"
                >
                  <span />
                  <span />
                  <span />
                </label>

                <div className="pg_header-mobilePanel" aria-label="Menú móvil">
                  <nav className="pg_header-mobileNav">
                    <Link className="pg_header-mobileLink" href="/about">
                      Sobre Nosotros
                    </Link>
                    <Link className="pg_header-mobileLink" href="/customers">
                      Clientes
                    </Link>
                    <Link className="pg_header-mobileLink" href="/downloads">
                      Descargar
                    </Link>

                    <div className="pg_header-mobileDivider" />

                    <Link className="pg_header-mobileCta" href="/contact">
                      Contactanos
                    </Link>
                  </nav>
                </div>

                <label
                  htmlFor="nav-toggle"
                  className="pg_header-backdrop"
                  aria-hidden="true"
                />
              </div>
            </div>
          </header>

          {children}

          <footer className="footer">
            <div className="pg_footer section-footer">
              <div className="pg_footer-information">
                <div className="pg_footer-information-div">
                  <div className="pg_footer-logotext">
                    <Image
                      className="pg_footer-logo"
                      src="/images/LogoInnova.png"
                      alt="Logo"
                      width={130}
                      height={100}
                    />
                    <h3>Soluciones Integrales InnovaJC</h3>
                  </div>
                  <p>
                    Software de Gestión Contable y Administrativa para
                    optimizacion de negocios con soluciones de contabilidad
                    electrónica, facturación y control de inventarios.
                    Automatiza tus procesos financieros con nuestro sistema
                    administrativo integral y escalable.
                  </p>
                </div>

                <div className="pg_footer-information-div">
                  <h4>Enlaces Directos</h4>
                  <div className="pg_footer-linkrouter">
                    <Link href="/about">Sobre Nosotros</Link>
                  </div>
                  <div className="pg_footer-linkrouter">
                    <Link href="/customers">Clientes</Link>
                  </div>
                  <div className="pg_footer-linkrouter">
                    <Link href="/downloads">Descargar</Link>
                  </div>
                  <div className="pg_footer-linkrouter">
                    <Link href="/contact">Contactanos</Link>
                  </div>
                </div>

                <div className="pg_footer-information-div">
                  <h4>Redes Sociales</h4>
                  <div className="socialmedia flex gap-4 text-[#616161] text-4xl">
                    <a aria-label="Facebook" href="https://facebook.com">
                      <FaFacebook />
                    </a>
                    <a aria-label="Instagram" href="https://instagram.com">
                      <FaInstagram />
                    </a>
                    <a aria-label="Twitter/X" href="https://twitter.com">
                      <FaTwitter />
                    </a>
                    <a aria-label="WhatsApp" href="https://wa.me/40701423">
                      <FaWhatsapp />
                    </a>
                  </div>
                </div>

                <div className="pg_footer-information-div">
                  <FooterSchedule />
                </div>
              </div>

              <hr />

              <div className="pg_footer-terms">
                <div className="pg_footer-copyright">
                  <p>
                    Soluciones Integrales InnovaJC S.A Derechos Reservados
                    &copy;{new Date().getFullYear()}
                  </p>
                </div>
                <div className="pg_footer-termslink">
                  <p>Terminos</p>
                  <p>Condiciones</p>
                  <p>Politicas</p>
                  <p>Privacidad</p>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
