import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/serverClient";
import { requireAdmin } from "@/lib/auth/requireAdmin";

const BUCKET = "downloads";

const TABLE_NAME = "Downloads";

function sanitizeFilename(name: string) {
  return name
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
    .replace(/\s+/g, " ")
    .slice(0, 120);
}

function extFromPath(path: string | null) {
  if (!path) return "";
  const last = path.split("/").pop() || "";
  const dot = last.lastIndexOf(".");
  if (dot === -1) return "";
  return last.slice(dot);
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const downloadId = Number(id);
    if (!Number.isFinite(downloadId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const supabase = await createClient();
    await requireAdmin(supabase);

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select("id,title,file_url")
      .eq("id", downloadId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "No se pudo leer el download (DB).", detail: error.message },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Download no encontrado" },
        { status: 404 },
      );
    }

    if (!data.file_url) {
      return NextResponse.json(
        { error: "Este download no tiene archivo asignado" },
        { status: 400 },
      );
    }

    const filePath = String(data.file_url).trim();

    const { data: signed, error: signErr } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(filePath, 60 * 10);

    if (signErr || !signed?.signedUrl) {
      return NextResponse.json(
        {
          error: "No se pudo firmar el archivo.",
          detail: signErr?.message ?? "",
        },
        { status: 500 },
      );
    }

    const upstream = await fetch(signed.signedUrl);
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        {
          error: "Archivo no encontrado en Storage.",
          detail: `Status: ${upstream.status}`,
          path: filePath,
        },
        { status: 404 },
      );
    }

    const title = sanitizeFilename(data.title ?? "download");
    const ext = extFromPath(filePath);
    const filename = `${title}${ext}`;

    const contentType =
      upstream.headers.get("content-type") ?? "application/octet-stream";

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Error inesperado" },
      { status: 500 },
    );
  }
}
