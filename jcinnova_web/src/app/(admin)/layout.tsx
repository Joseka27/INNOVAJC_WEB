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
        <div className="AdminLayout">
          <header>
            <div className="pg_header section-header">
              <div className="pg_header-principal">
                <div className="pg_header-logo-img">
                  <Link href="/">
                    <Image
                      className="imagelogo"
                      src="/images/LogoInnova.png"
                      alt="Logo"
                      width={130}
                      height={50}
                    ></Image>
                  </Link>
                </div>
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
            </div>
          </header>
          {children}
          <p></p>
        </div>
      </body>
    </html>
  );
}
