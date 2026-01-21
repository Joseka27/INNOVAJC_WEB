/* get specific company information by id */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/serverClient";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { extractCompanyStoragePath } from "@/lib/storage/companiesBucket";

/* Dynamic params (id)*/
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

    const patch = await req.json(); /* { name?, image_url?, old_image_url? } */
    /* Delete ol image url*/
    const oldUrl: string | undefined = patch.old_image_url;

    /* update row information in db */
    const { data, error } = await supabase
      .from("CompaniesWorkWith")
      .update({ name: patch.name, image_url: patch.image_url })
      .eq("id", rowId)
      .select("id,name,image_url")
      .single();

    if (error) throw error;

    /* delete the old file from the bucket */
    if (oldUrl && patch.image_url && oldUrl !== patch.image_url) {
      const oldPath = extractCompanyStoragePath(oldUrl);
      /* if the path could be extracted, it is deleted. */
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
    /* Validate that it is admin*/
    await requireAdmin(supabase);

    const { id } = await ctx.params;
    const rowId = parseId(id);

    /* Read current URL */
    const { data: current, error: readErr } = await supabase
      .from("CompaniesWorkWith")
      .select("image_url")
      .eq("id", rowId)
      .single();

    if (readErr) throw readErr;

    /* file deleted from the bucket */
    const path = extractCompanyStoragePath(current.image_url);
    if (path) await supabase.storage.from("companies").remove([path]);

    /* row deleted from the database */
    const { error: delErr } = await supabase
      .from("CompaniesWorkWith")
      .delete()
      .eq("id", rowId);

    if (delErr) throw delErr;

    /* The deleted ID is returned */
    return NextResponse.json({ id: rowId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 400 });
  }
}
