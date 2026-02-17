/* update / delete download by id */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/serverClient";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { fileURLToPath } from "node:url";

/* Dynamic params (id) */
type Ctx = { params: Promise<{ id: string }> };

/* confirms the received parameter */
function parseId(idParam: string) {
  const n = Number(idParam);

  /* validate id */
  if (!Number.isInteger(n) || n <= 0) {
    const err = new Error(`Invalid id: "${idParam}"`);
    (err as any).status = 400;
    throw err;
  }
  return n;
}

export async function PUT(req: Request, ctx: Ctx) {
  try {
    /* create supabase client */
    const supabase = await createClient();

    /* validate admin */
    await requireAdmin(supabase);

    const { id } = await ctx.params;
    const rowId = parseId(id);

    const patch = await req.json();

    // Si estás guardando el PATH del archivo en TypeFile:
    const oldPath: string | undefined = patch.old_file_url;

    const nextAppImage =
      patch.app_image !== undefined
        ? String(patch.app_image).trim()
        : undefined;
    const nextTitle =
      patch.title !== undefined ? String(patch.title).trim() : undefined;
    const nextDesc =
      patch.description !== undefined
        ? String(patch.description).trim()
        : undefined;
    const nextSize =
      patch.size !== undefined ? String(patch.size).trim() : undefined;
    const nextVersion =
      patch.version !== undefined ? String(patch.version).trim() : undefined;
    const nextReq =
      patch.requirements !== undefined
        ? String(patch.requirements).trim()
        : undefined;
    const nextFileUrl =
      patch.file_url !== undefined ? String(patch.file_url).trim() : undefined;
    const nextTypeFile =
      patch.type_file !== undefined
        ? String(patch.type_file).trim()
        : undefined;

    if (nextAppImage !== undefined && !nextAppImage)
      throw new Error("Imagen requerida");
    if (nextTitle !== undefined && nextTitle.length < 2)
      throw new Error("Título inválido");
    if (nextDesc !== undefined && !nextDesc)
      throw new Error("Descripción requerida");
    if (nextSize !== undefined && !nextSize)
      throw new Error("Tamaño requerido");
    if (nextVersion !== undefined && !nextVersion)
      throw new Error("Versión requerida");
    if (nextReq !== undefined && !nextReq)
      throw new Error("Requirements requerido");
    if (nextFileUrl !== undefined && !nextFileUrl)
      throw new Error("Archivo requerido");
    if (nextTypeFile !== undefined && !nextTypeFile)
      throw new Error("Tipo de archivo requerido");

    /* update row information in db */
    const { data, error } = await supabase
      .from("Downloads")
      .update({
        ...(nextAppImage !== undefined ? { app_image: nextAppImage } : {}),
        ...(nextTitle !== undefined ? { title: nextTitle } : {}),
        ...(nextDesc !== undefined ? { description: nextDesc } : {}),
        ...(nextSize !== undefined ? { size: nextSize } : {}),
        ...(nextVersion !== undefined ? { version: nextVersion } : {}),
        ...(nextReq !== undefined ? { requirements: nextReq } : {}),
        ...(nextFileUrl ? { file_url: nextFileUrl } : {}),
        ...(nextTypeFile ? { type_file: nextTypeFile } : {}),
      })
      .eq("id", rowId)
      .select(
        "id,app_image,title,description,size,version,type_file,requirements,file_url,created_at",
      )
      .single();

    if (error) throw error;

    /* delete the old file from the bucket (only if file changed) */
    if (oldPath && nextFileUrl && oldPath !== nextFileUrl) {
      // OJO: esto borra del bucket aunque sea público (igual se puede borrar server-side)
      await supabase.storage.from("downloads").remove([oldPath]);
    }

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 400 });
  }
}

export async function DELETE(_: Request, ctx: Ctx) {
  try {
    const supabase = await createClient();

    /* Validate that it is admin */
    await requireAdmin(supabase);

    const { id } = await ctx.params;
    const rowId = parseId(id);

    const { data: current, error: readErr } = await supabase
      .from("Downloads")
      .select("file_url")
      .eq("id", rowId)
      .single();

    if (readErr) throw readErr;

    /* file deleted from the bucket */
    const path = current?.file_url ? String(current.file_url) : "";
    if (path) await supabase.storage.from("downloads").remove([path]);

    /* row deleted from the database */
    const { error: delErr } = await supabase
      .from("Downloads")
      .delete()
      .eq("id", rowId);

    if (delErr) throw delErr;

    /* The deleted ID is returned */
    return NextResponse.json({ id: rowId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 400 });
  }
}
