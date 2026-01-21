import type { Metadata } from "next";
import "./contact_globals.css";
import "./contact_header.css";
import "./contact_footer.css";
import Link from "next/link";
import Image from "next/image";
import { FaFacebook, FaInstagram, FaTwitter, FaWhatsapp } from "react-icons/fa";

export const metadata: Metadata = {
  title: "INNOVA JC",
  description: "INNOVA JC | %s",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased`}>
        <p>Contact NAVBAR</p>
        {children}
        <p>Footer</p>

        <a
          href="https://wa.me/50684753334"
          className="whatsapp-button text-4xl"
        >
          <FaWhatsapp />
        </a>
      </body>
    </html>
  );
}
