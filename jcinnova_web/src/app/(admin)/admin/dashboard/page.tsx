"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Company } from "@/models/companiesModel";
import { createClient } from "@/lib/supabase/browserClient";
import { resizeImageToWebp } from "@/lib/images/resizeImage";
import { uploadCompanyImage } from "@/lib/storage/companiesBucket";
import "./admin_dashboard.css";

/* Max page size */
const PAGE_SIZE = 15;

export default function AdminDashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const createFileRef = useRef<HTMLInputElement | null>(null);
  const editFileRef = useRef<HTMLInputElement | null>(null);

  /* ---------------- AUTH ---------------- */
  const [booting, setBooting] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  /* ---------------- DATA ---------------- */
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState<number | null>(null);

  /* ---------------- CREATE ---------------- */
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);

  /* ---------------- EDIT ---------------- */
  const [editingId, setEditingId] = useState<number | null>(null);
  const editingCompany = useMemo(
    () => companies.find((c) => c.id === editingId) ?? null,
    [companies, editingId],
  );
  const [editName, setEditName] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);

  /* Reset all forms after use them */
  async function resetForms() {
    /* create form */
    setName("");
    setFile(null);
    if (createFileRef.current) createFileRef.current.value = "";

    /* edit form */
    setEditingId(null);
    setEditName("");
    setEditFile(null);
    if (editFileRef.current) editFileRef.current.value = "";
  }

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

    const email = data.user.email ?? null;
    const admin = Boolean(data.isAdmin);

    setUserEmail(email);
    setIsAdmin(admin);

    return { ok: true, isAdmin: admin, email };
  }
  const IDLE_MS = 15 * 60 * 1000; // 15 minuto
  const timerRef = useRef<number | null>(null);
  async function forceLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/admin");
    }
  }

  function resetTimer() {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      forceLogout();
    }, IDLE_MS);
  }

  useEffect(() => {
    resetTimer();

    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
    ];
    const onActivity = () => resetTimer();

    events.forEach((e) =>
      window.addEventListener(e, onActivity, { passive: true }),
    );

    // si cambia de pestaña, también podés forzar logout al volver
    const onVisibility = () => {
      if (!document.hidden) resetTimer();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      events.forEach((e) => window.removeEventListener(e, onActivity));
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
  useEffect(() => {
    (async () => {
      const me = await getMe();
      setBooting(false);

      if (!me.ok || !me.isAdmin) {
        router.replace("/admin");
        return;
      }

      await loadCompanies(0);
    })();
  }, [router]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });

    // limpiar estado sensible y UI
    await resetForms();
    setCompanies([]);
    setTotal(null);
    setPage(0);

    setUserEmail(null);
    setIsAdmin(false);

    router.replace("/admin");
  }

  async function loadCompanies(p = page) {
    setLoading(true);
    try {
      const offset = p * PAGE_SIZE;
      const res = await fetch(
        `/api/companies?limit=${PAGE_SIZE}&offset=${offset}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setEditingId(null);
      setEditFile(null);
      if (editFileRef.current) editFileRef.current.value = "";
      setCompanies(data.items);
      setTotal(data.count);
      setPage(p);
    } finally {
      setLoading(false);
    }
  }

  async function createCompany(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return alert("Selecciona una imagen");

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const resized = await resizeImageToWebp(file);
    const { publicUrl } = await uploadCompanyImage(
      supabase,
      resized,
      userData.user.id,
    );

    const res = await fetch("/api/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, image_url: publicUrl }),
    });

    if (!res.ok) {
      const d = await res.json();
      alert(d.error);
      return;
    }

    setName("");
    setFile(null);
    if (createFileRef.current) createFileRef.current.value = "";
    await loadCompanies(0);
  }

  function startEdit(c: Company) {
    setEditingId(c.id);
    setEditName(c.name);
    setEditFile(null);
  }

  async function saveEdit() {
    if (!editingCompany) return;

    let newUrl: string | undefined;

    if (editFile) {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const resized = await resizeImageToWebp(editFile);
      const uploaded = await uploadCompanyImage(
        supabase,
        resized,
        userData.user.id,
      );
      newUrl = uploaded.publicUrl;
    }

    const res = await fetch(`/api/companies/${editingCompany.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName,
        image_url: newUrl,
        old_image_url: editingCompany.image_url,
      }),
    });

    if (!res.ok) {
      const d = await res.json();
      alert(d.error);
      return;
    }

    setEditingId(null);
    setEditFile(null);
    if (editFileRef.current) editFileRef.current.value = "";
    await loadCompanies(page);
  }

  async function removeCompany(id: number) {
    if (!confirm("¿Eliminar esta empresa?")) return;

    const res = await fetch(`/api/companies/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json();
      alert(d.error);
      return;
    }

    await loadCompanies(page);
  }

  /* ---------------- UI ---------------- */
  if (booting) return <div className="p-6">Cargando…</div>;

  // Extra seguridad visual (aunque ya redirigimos arriba):
  if (!userEmail || !isAdmin) return <div className="p-6">Redirigiendo…</div>;

  return (
    <div id="dashboard" className="admin_dashboard">
      <div className="admin_dashboard_logaccount">
        <div className="admin_panelinfo">
          <h1>PANEL ADMINISTRADOR</h1>
          <p>Cuenta: {userEmail}</p>
        </div>
        <button onClick={logout} className="logout_button">
          Cerrar Sesión
        </button>
      </div>

      <section className="admin_dashboard_create">
        <h2>Agregar Empresa</h2>
        <form onSubmit={createCompany} className="admin_dashboard_create_form">
          <input
            className="create_name"
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value ?? null)}
          />
          <input
            className="create_file"
            ref={createFileRef}
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <button className="create_button">Guardar</button>
        </form>
      </section>

      {editingCompany && (
        <section className="border rounded-xl p-4">
          <h3 className="font-bold mb-3">Editando: {editingCompany.name}</h3>
          <div className="grid gap-3 max-w-xl">
            <input
              className="border p-2 rounded"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <input
              ref={editFileRef}
              type="file"
              accept="image/*"
              onChange={(e) => setEditFile(e.target.files?.[0] ?? null)}
            />
            <div className="flex gap-2">
              <button
                onClick={saveEdit}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Guardar cambios
              </button>
              <button
                onClick={() => setEditingId(null)}
                className="border px-4 py-2 rounded"
              >
                Cancelar
              </button>
            </div>
          </div>
        </section>
      )}

      {/* LIST */}
      <section className="border rounded-xl p-4 space-y-4">
        {loading && <div className="text-sm">Cargando empresas…</div>}

        {companies.map((c) => (
          <div key={c.id} className="border rounded p-3 flex justify-between">
            <div>
              <div className="font-semibold">{c.name}</div>
              <img src={c.image_url} className="h-16 mt-1" />
            </div>
            <div className="flex gap-2">
              <button
                className="border px-3 py-1 rounded"
                onClick={() => startEdit(c)}
              >
                Editar
              </button>
              <button
                className="border px-3 py-1 rounded"
                onClick={() => removeCompany(c.id)}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}

        <div className="flex gap-2">
          <button
            disabled={page === 0}
            onClick={() => loadCompanies(page - 1)}
            className="border px-3 py-1 rounded"
          >
            ←
          </button>
          <button
            disabled={total !== null && (page + 1) * PAGE_SIZE >= total}
            onClick={() => loadCompanies(page + 1)}
            className="border px-3 py-1 rounded"
          >
            →
          </button>
        </div>
      </section>

      {/* EDIT */}
    </div>
  );
}
