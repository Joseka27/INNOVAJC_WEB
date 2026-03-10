import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/serverClient";
import { requireAdmin } from "@/lib/auth/requireAdmin";

function mapDbError(e: any) {
  const message = String(e?.message ?? "").toLowerCase();
  const details = String(e?.details ?? "").toLowerCase();
  const code = String(e?.code ?? "");

  // PostgreSQL unique violation
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

export async function GET(req: Request) {
  try {
    const supabase = await createClient();

    const url = new URL(req.url);

    const limit = Math.min(Number(url.searchParams.get("limit") ?? 10), 50);
    const cursor = url.searchParams.get("cursor");
    const offset = url.searchParams.get("offset");

    let q = supabase
      .from("PagesModules")
      .select(
        "id,title,module_category,short_desc,long_desc,second_text,banner_image_url,featured_image_url,gallery_images",
        { count: "exact" },
      )
      .order("id", { ascending: true });

    if (cursor) {
      const c = Number(cursor);
      if (Number.isFinite(c) && c > 0) q = q.gt("id", c);
    } else if (offset) {
      const o = Number(offset);
      if (Number.isFinite(o) && o >= 0) q = q.range(o, o + limit - 1);
    } else {
      q = q.range(0, limit - 1);
    }

    const { data, error, count } = await q.limit(limit);
    if (error) throw error;

    const items = (data ?? []).map((item: any) => ({
      ...item,
      gallery_images: Array.isArray(item.gallery_images)
        ? item.gallery_images
        : [],
    }));

    const nextCursor = items.length ? items[items.length - 1].id : null;

    return NextResponse.json({
      items,
      count: count ?? null,
      nextCursor,
    });
  } catch (e: any) {
    const mapped = mapDbError(e);

    return NextResponse.json(
      { error: mapped.message },
      { status: mapped.status },
    );
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    await requireAdmin(supabase);

    const body = await req.json();

    const { data, error } = await supabase
      .from("PagesModules")
      .insert({
        title: body.title,
        module_category: body.module_category,
        short_desc: body.short_desc,
        long_desc: body.long_desc,
        second_text: body.second_text ?? null,
        banner_image_url: body.banner_image_url,
        featured_image_url: body.featured_image_url ?? null,
        gallery_images: body.gallery_images ?? [],
      })
      .select(
        "id,title,module_category,short_desc,long_desc,second_text,banner_image_url,featured_image_url,gallery_images",
      )
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (e: any) {
    const mapped = mapDbError(e);

    return NextResponse.json(
      { error: mapped.message },
      { status: mapped.status },
    );
  }
}
