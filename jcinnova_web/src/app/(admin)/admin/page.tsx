"use client";

import { useState } from "react";

export default function AdminEmpresasPage() {
  const [nombre, setNombre] = useState("");
  const [imagen, setImagen] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const body = {
      nombre,
      imagen_url: imagen,
    };

    const res = await fetch("/api/empresas", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      alert("❌ Error: " + data.error);
      return;
    }

    alert("✔️ Empresa creada");
    setNombre("");
    setImagen("");
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Agregar Empresa</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
        <input
          type="text"
          placeholder="Nombre"
          className="border p-2"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Imagen URL"
          className="border p-2"
          value={imagen}
          onChange={(e) => setImagen(e.target.value)}
          required
        />

        <button type="submit" className="bg-blue-600 text-white p-2 rounded">
          Guardar Empresa
        </button>
      </form>
    </div>
  );
}
