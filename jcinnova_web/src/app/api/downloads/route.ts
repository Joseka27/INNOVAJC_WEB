/* Principal endpoint to create & list downloads */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/serverClient";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export async function GET(req: Request) {
  try {
    /* Create server client */
    const supabase = await createClient();

    /* Read query params */
    const url = new URL(req.url);

    /* Results in groups, max 50 */
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 10), 50);
    const cursor = url.searchParams.get("cursor");
    const offset = url.searchParams.get("offset");

    /* Base query */
    let q = supabase
      .from("Downloads") // ✅ TABLA DOWNLOADS
      .select(
        "id,app_image,title,description,size,version,type_file,requirements,file_url,created_at",
        { count: "exact" },
      )
      .order("id", { ascending: true });

    /* Cursor pagination */
    if (cursor) {
      const c = Number(cursor);
      if (Number.isFinite(c) && c > 0) q = q.gt("id", c);
    } else if (offset) {
      /* Offset pagination */
      const o = Number(offset);
      if (Number.isFinite(o) && o >= 0) q = q.range(o, o + limit - 1);
    } else {
      /* Default */
      q = q.range(0, limit - 1);
    }

    const { data, error, count } = await q.limit(limit);
    if (error) throw error;

    const items = data ?? [];
    const nextCursor = items.length ? items[items.length - 1].id : null;

    return NextResponse.json({
      items,
      count: count ?? null,
      nextCursor,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message ?? "Error fetching downloads" },
      { status: 400 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    /* Verify admin */
    await requireAdmin(supabase);

    const body = await req.json();

    /* Basic validation */
    const app_image = String(body.app_image ?? "").trim();
    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim();
    const size = String(body.size ?? "").trim();
    const version = String(body.version ?? "").trim();
    const file_url = String(body.file_url ?? "").trim();
    const type_file = String(body.type_file ?? "").trim();
    const requirements = String(body.requirements ?? "").trim();

    if (!app_image) throw new Error("Descripción requerida");
    if (title.length < 2) throw new Error("Título inválido");
    if (!description) throw new Error("Descripción requerida");
    if (!size) throw new Error("Size requerido");
    if (!version) throw new Error("Versión requerida");
    if (!file_url) throw new Error("Archivo requerido");
    if (!type_file) throw new Error("Tipo de archivo requerido");
    if (!requirements) throw new Error("Requirements requerido");

    /* Insert download */
    const { data, error } = await supabase
      .from("Downloads") // ✅ TABLA DOWNLOADS
      .insert({
        app_image,
        title,
        description,
        size,
        version,
        file_url,
        type_file,
        requirements,
      })
      .select(
        "id,app_image,title,description,size,version,type_file,requirements,file_url,created_at",
      )
      .single();

    if (error) throw error;

    /* Return new row */
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message ?? "Error creating download" },
      { status: e.status ?? 400 },
    );
  }
}
