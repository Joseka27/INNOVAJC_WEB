import type { Metadata } from "next";
import "./user_layout.css";

import Link from "next/link";
import Image from "next/image";
import { FaFacebook, FaInstagram, FaTwitter, FaWhatsapp } from "react-icons/fa";
import { Roboto } from "next/font/google";

import HeaderClient from "./burguerMenu";
import FooterSchedule from "./footercalendar";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${roboto.className} antialiased`}>
        <div className="UserLayout">
          <header>
            <HeaderClient />
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
                    optimización de negocios con soluciones de contabilidad
                    electrónica, facturación y control de inventarios.
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
                    <Link href="/contact">Contáctanos</Link>
                  </div>
                </div>

                <div className="pg_footer-information-div">
                  <h4>Redes Sociales</h4>

                  <div className="socialmedia">
                    <a href="https://facebook.com">
                      <FaFacebook />
                    </a>

                    <a href="https://instagram.com">
                      <FaInstagram />
                    </a>

                    <a href="https://twitter.com">
                      <FaTwitter />
                    </a>

                    <a href="https://wa.me/40701423">
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
                    Soluciones Integrales InnovaJC S.A ©
                    {new Date().getFullYear()}
                  </p>
                </div>

                <div className="pg_footer-termslink">
                  <p>Términos</p>
                  <p>Condiciones</p>
                  <p>Políticas</p>
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
