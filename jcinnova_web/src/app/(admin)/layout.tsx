import type { Metadata } from "next";
import "./admin_globals.css";

export const metadata: Metadata = {
  title: "INNOVA JC | Admin",
  description: "INNOVA JC | Admin",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased`}>
        <p>USER NAVBAR</p>
        {children}
        <p>Footer</p>
      </body>
    </html>
  );
}
