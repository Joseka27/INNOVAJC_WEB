import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/serverClient";

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

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const downloadId = Number(id);

  if (!Number.isFinite(downloadId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const supabase = await createClient();

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

  if (!data?.file_url) {
    return NextResponse.json(
      { error: "Este download no tiene archivo asignado" },
      { status: 404 },
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

  const title = sanitizeFilename(data.title ?? "download");
  const ext = extFromPath(filePath);
  const filename = `${title}${ext}`;

  const url = new URL(signed.signedUrl);
  url.searchParams.set("download", filename);

  const res = NextResponse.redirect(url.toString(), 302);
  res.headers.set("Cache-Control", "no-store");
  return res;
}
