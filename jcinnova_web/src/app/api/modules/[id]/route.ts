import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/serverClient";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { extractModuleStoragePath } from "@/lib/storage/modulesBucket";

type Ctx = { params: Promise<{ id: string }> };

function parseId(idParam: string) {
  const n = Number(idParam);

  if (!Number.isInteger(n) || n <= 0) {
    const err = new Error(`Invalid id: "${idParam}"`);
    (err as any).status = 400;
    throw err;
  }

  return n;
}

function mapDbError(e: any) {
  const message = String(e?.message ?? "").toLowerCase();
  const details = String(e?.details ?? "").toLowerCase();
  const code = String(e?.code ?? "");

  if (
    code === "23505" &&
    (message.includes("title") ||
      details.includes("title") ||
      message.includes("modules_title_unique") ||
      details.includes("modules_title_unique") ||
      message.includes("modules_title_unique_idx") ||
      details.includes("modules_title_unique_idx"))
  ) {
    return {
      status: 409,
      message: "Ya existe un módulo con ese título.",
    };
  }

  return {
    status: e?.status ?? 400,
    message: e?.message ?? "Error en la base de datos.",
  };
}

export async function PUT(req: Request, ctx: Ctx) {
  try {
    const supabase = await createClient();

    await requireAdmin(supabase);

    const { id } = await ctx.params;
    const rowId = parseId(id);

    const patch = await req.json();

    const oldBanner = patch.old_banner_image_url;
    const oldFeatured = patch.old_featured_image_url;

    const { data, error } = await supabase
      .from("PagesModules")
      .update({
        title: patch.title,
        module_category: patch.module_category,
        short_desc: patch.short_desc,
        long_desc: patch.long_desc,
        second_text: patch.second_text ?? null,
        ...(patch.banner_image_url
          ? { banner_image_url: patch.banner_image_url }
          : {}),
        ...(patch.featured_image_url !== undefined
          ? { featured_image_url: patch.featured_image_url }
          : {}),
        ...(patch.gallery_images
          ? { gallery_images: patch.gallery_images }
          : {}),
      })
      .eq("id", rowId)
      .select(
        "id,title,module_category,short_desc,long_desc,second_text,banner_image_url,featured_image_url,gallery_images",
      )
      .single();

    if (error) throw error;

    if (
      oldBanner &&
      patch.banner_image_url &&
      oldBanner !== patch.banner_image_url
    ) {
      const path = extractModuleStoragePath(oldBanner);

      if (path) {
        await supabase.storage.from("modules").remove([path]);
      }
    }

    if (
      oldFeatured &&
      patch.featured_image_url &&
      oldFeatured !== patch.featured_image_url
    ) {
      const path = extractModuleStoragePath(oldFeatured);

      if (path) {
        await supabase.storage.from("modules").remove([path]);
      }
    }

    return NextResponse.json(data);
  } catch (e: any) {
    const mapped = mapDbError(e);

    return NextResponse.json(
      { error: mapped.message },
      { status: mapped.status },
    );
  }
}

export async function DELETE(_: Request, ctx: Ctx) {
  try {
    const supabase = await createClient();

    await requireAdmin(supabase);

    const { id } = await ctx.params;
    const rowId = parseId(id);

    const { data: current, error: readErr } = await supabase
      .from("PagesModules")
      .select("banner_image_url,featured_image_url,gallery_images")
      .eq("id", rowId)
      .single();

    if (readErr) throw readErr;

    if (current.banner_image_url) {
      const path = extractModuleStoragePath(current.banner_image_url);

      if (path) {
        await supabase.storage.from("modules").remove([path]);
      }
    }

    if (current.featured_image_url) {
      const path = extractModuleStoragePath(current.featured_image_url);

      if (path) {
        await supabase.storage.from("modules").remove([path]);
      }
    }

    if (Array.isArray(current.gallery_images)) {
      const paths = current.gallery_images
        .map((url: string) => extractModuleStoragePath(url))
        .filter((p): p is string => typeof p === "string");

      if (paths.length) {
        await supabase.storage.from("modules").remove(paths);
      }
    }

    const { error: delErr } = await supabase
      .from("PagesModules")
      .delete()
      .eq("id", rowId);

    if (delErr) throw delErr;

    return NextResponse.json({ id: rowId });
  } catch (e: any) {
    const mapped = mapDbError(e);

    return NextResponse.json(
      { error: mapped.message },
      { status: mapped.status },
    );
  }
}
