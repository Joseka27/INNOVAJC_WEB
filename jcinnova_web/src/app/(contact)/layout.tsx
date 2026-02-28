import type { Metadata } from "next";
import "./contact_globals.css";
import "./contact_header.css";
import "./contact_footer_whats.css";
import Link from "next/link";
import Image from "next/image";
import { FaWhatsapp } from "react-icons/fa";
import { Roboto } from "next/font/google";
import BackButton from "./BackButton";

export const metadata: Metadata = {
  title: "INNOVA JC | Contacto",
  description: "INNOVA JC | Contacto",
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
            <div className="pg_header section-header">
              <div className="pg_header-principal">
                <div className="pg_header-logo-img">
                  <Link href="/">
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

                <div className="pg_header-text-title">
                  <div className="pg_header-title">
                    <h1>INNOVA JC CENTRO DE CONTACTO</h1>
                  </div>
                </div>
              </div>

              <div className="pg_header-contactbutton">
                <BackButton />
              </div>
            </div>
          </header>

          {children}

          <a
            href="https://wa.me/40701423"
            className="whatsapp-button text-4xl"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaWhatsapp />
          </a>
        </div>
      </body>
    </html>
  );
}
