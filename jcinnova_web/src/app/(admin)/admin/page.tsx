"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "./adminlogin.css";
import Image from "next/image";

export default function AdminLoginPage() {
  const router = useRouter();

  const [booting, setBooting] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function getMe(): Promise<{
    ok: boolean;
    isAdmin: boolean;
    email: string | null;
  }> {
    const res = await fetch("/api/auth/me", {
      method: "GET",
      cache: "no-store",
    });
    const data = await res.json();

    if (!res.ok || !data.user) {
      setUserEmail(null);
      setIsAdmin(false);
      return { ok: false, isAdmin: false, email: null };
    }

    const em = data.user.email ?? null;
    const admin = Boolean(data.isAdmin);

    setUserEmail(em);
    setIsAdmin(admin);

    return { ok: true, isAdmin: admin, email: em };
  }

  useEffect(() => {
    (async () => {
      const me = await getMe();
      setBooting(false);
      if (me.ok && me.isAdmin) router.replace("/admin/dashboard");
    })();
  }, [router]);

  async function login(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "Login error");
      return;
    }

    const me = await getMe();
    setPassword("");

    if (!me.ok) {
      alert("❌ No se pudo validar la sesión.");
      setPassword("");
      return;
    }

    if (!me.isAdmin) {
      await fetch("/api/auth/logout", { method: "POST" });
      await getMe();
      alert("⛔ Tu usuario no tiene permisos de admin.");
      setPassword("");
      return;
    }

    router.replace("/admin/dashboard");
  }

  /* ========= UI ========= */
  if (booting) return <div className="p-6">Cargando…</div>;

  if (!userEmail || !isAdmin) {
    return (
      <div className="pg_admin">
        <form onSubmit={login} className="pg_admin_login">
          <h1>INNOVA JC PANEL</h1>

          <div className="pg_admin_box">
            <input
              className="pg_admin_input"
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Image
              className="inputimage"
              src="/images/adminpage/emailicon.png"
              alt="Logo"
              width={100}
              height={1}
            ></Image>
          </div>

          <div className="pg_admin_box">
            <input
              className="pg_admin_input"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Image
              className="inputimage"
              src="/images/adminpage/lockicon.png"
              alt="Logo"
              width={100}
              height={10}
            ></Image>
          </div>

          <button className="pg_admin_button">Iniciar Sesion</button>
        </form>
      </div>
    );
  }

  return <div>Redirigiendo…</div>;
}
