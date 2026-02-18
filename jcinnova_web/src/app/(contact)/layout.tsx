import type { Metadata } from "next";
import "./contact_globals.css";
import "./contact_header.css";
import "./contact_footer_whats.css";
import Link from "next/link";
import Image from "next/image";
import { FaFacebook, FaInstagram, FaTwitter, FaWhatsapp } from "react-icons/fa";
import { Roboto } from "next/font/google";

export const metadata: Metadata = {
  title: "INNOVA JC | Contacto",
  description: "INNOVA JC | Contacto",
};
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"], // Puedes elegir los pesos que necesites
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${roboto.className} antialiased`}>
        <div className="UserLayout">
          {/*Cabezera de la pagina, barra de navegacion */}
          <header>
            <div className="pg_header section-header">
              <div className="pg_header-principal">
                <div className="pg_header-logo-img">
                  <Link href="/">
                    <Image
                      className="pg_header_logo"
                      src="/images/LogoInnova.png"
                      alt="Logo"
                      width={130}
                      height={50}
                    ></Image>
                  </Link>
                </div>
                <div className="pg_header-text-title">
                  <div className="pg_header-title">
                    <h1>INNOVA JC CENTRO DE CONTACTO</h1>
                  </div>
                </div>
              </div>
              <div className="pg_header-contactbutton">
                <Link href="/">Volver a Inicio</Link>
              </div>
            </div>
          </header>
          {/*Cuerpo de la pagina */}
          {children}
          <a href="https://wa.me/40701423" className="whatsapp-button text-4xl">
            <FaWhatsapp />
          </a>
        </div>
      </body>
    </html>
  );
}
