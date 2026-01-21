"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Company } from "@/models/companiesModel";
import { createClient } from "@/lib/supabase/browserClient";
import { resizeImageToWebp } from "@/lib/images/resizeImage";
import { uploadCompanyImage } from "@/lib/storage/companiesBucket";
import { useRef } from "react";

/* Max page size */
const PAGE_SIZE = 15;

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();

  const createFileRef = useRef<HTMLInputElement | null>(null);
  const editFileRef = useRef<HTMLInputElement | null>(null);
  /* ---------------- AUTH ---------------- */
  const [booting, setBooting] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function resetForms() {
    // login form
    setEmail("");
    setPassword("");

    // create form
    setName("");
    setFile(null);
    if (createFileRef.current) createFileRef.current.value = "";

    // edit form
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
    const res = await fetch("/api/auth/me", { method: "GET" });
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

  useEffect(() => {
    (async () => {
      await getMe();
      setBooting(false);
    })();
  }, []);

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

    const me = await getMe(); // ✅ usar retorno, no state
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

    router.replace("/admin#dashboard");
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });

    // limpiar estado sensible y UI
    resetForms();
    setCompanies([]);
    setTotal(null);
    setPage(0);

    setUserEmail(null);
    setIsAdmin(false);

    router.replace("/admin");
  }

  /* ---------------- DATA ---------------- */
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState<number | null>(null);

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

  useEffect(() => {
    if (!booting && isAdmin) loadCompanies(0);
  }, [booting, isAdmin]);

  /* ---------------- CREATE ---------------- */
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);

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

  /* ---------------- EDIT ---------------- */
  const [editingId, setEditingId] = useState<number | null>(null);
  const editingCompany = useMemo(
    () => companies.find((c) => c.id === editingId) ?? null,
    [companies, editingId],
  );

  const [editName, setEditName] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);

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

  /* ---------------- DELETE ---------------- */
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

  if (!userEmail || !isAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <form
          onSubmit={login}
          className="w-full max-w-md border rounded-xl p-6 space-y-4"
        >
          <h1 className="text-2xl font-bold">Admin Login</h1>
          <input
            className="border p-2 rounded w-full"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="border p-2 rounded w-full"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="bg-black text-white p-2 rounded w-full">
            Entrar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div id="dashboard" className="p-6 space-y-8">
      <header className="flex justify-between">
        <div>
          <h1 className="text-2xl font-bold">Panel Admin</h1>
          <p className="text-sm text-gray-600">{userEmail}</p>
        </div>
        <button onClick={logout} className="border px-4 py-2 rounded">
          Logout
        </button>
      </header>

      {/* CREATE */}
      <section className="border rounded-xl p-4">
        <h2 className="font-bold mb-3">Agregar Empresa</h2>
        <form onSubmit={createCompany} className="grid gap-3 max-w-xl">
          <input
            className="border p-2 rounded"
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <button className="bg-blue-600 text-white px-4 py-2 rounded">
            Guardar
          </button>
        </form>
      </section>

      {/* LIST */}
      <section className="border rounded-xl p-4 space-y-4">
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
    </div>
  );
}
