import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./admin_globals.css";

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
      <body className={`${roboto.className} antialiased`}>{children}</body>
    </html>
  );
}
