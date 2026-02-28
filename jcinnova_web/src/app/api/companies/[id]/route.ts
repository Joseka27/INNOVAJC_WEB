/* get specific company information by id */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/serverClient";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { extractCompanyStoragePath } from "@/lib/storage/companiesBucket";

//Parametros dinamicos
type Ctx = { params: Promise<{ id: string }> };

//Confirma los parametros
function parseId(idParam: string) {
  const n = Number(idParam);

  //valida id
  if (!Number.isInteger(n) || n <= 0) {
    const err = new Error(`Invalid id: "${idParam}"`);
    (err as any).status = 400;
    throw err;
  }
  return n;
}

export async function PUT(req: Request, ctx: Ctx) {
  try {
    //Crea el cliente
    const supabase = await createClient();

    //Valida Admin
    await requireAdmin(supabase);

    const { id } = await ctx.params;
    const rowId = parseId(id);

    const patch = await req.json();
    //Borra la URL
    const oldUrl: string | undefined = patch.old_image_url;

    //Actualiza la informacion
    const { data, error } = await supabase
      .from("CompaniesWorkWith")
      .update({
        name: patch.name,
        description: patch.description,
        image_url: patch.image_url,
      })
      .eq("id", rowId)
      .select("id,name,description,image_url")
      .single();

    if (error) throw error;

    //Borra la informacion antigua del bucket
    if (oldUrl && patch.image_url && oldUrl !== patch.image_url) {
      const oldPath = extractCompanyStoragePath(oldUrl);

      if (oldPath) {
        await supabase.storage.from("companies").remove([oldPath]);
      }
    }

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 400 });
  }
}

export async function DELETE(_: Request, ctx: Ctx) {
  try {
    const supabase = await createClient();
    //Valida Admin
    await requireAdmin(supabase);

    const { id } = await ctx.params;
    const rowId = parseId(id);

    //Lee la URL actual
    const { data: current, error: readErr } = await supabase
      .from("CompaniesWorkWith")
      .select("image_url")
      .eq("id", rowId)
      .single();

    if (readErr) throw readErr;

    //borra archivo del bucket
    const path = extractCompanyStoragePath(current.image_url);
    if (path) await supabase.storage.from("companies").remove([path]);

    //borra de la DB
    const { error: delErr } = await supabase
      .from("CompaniesWorkWith")
      .delete()
      .eq("id", rowId);

    if (delErr) throw delErr;

    return NextResponse.json({ id: rowId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 400 });
  }
}
