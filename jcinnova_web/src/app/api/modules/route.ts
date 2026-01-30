/* Principal endpoint to create & list modules */
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
      .from("Modules") // ✅ TABLA MODULES
      .select("id,title,module_category,short_desc,long_desc,image_url", {
        count: "exact",
      })
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
      { error: e.message ?? "Error fetching modules" },
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

    /* Insert module */
    const { data, error } = await supabase
      .from("Modules") // ✅ TABLA MODULES
      .insert({
        title: body.title,
        module_category: body.module_category,
        short_desc: body.short_desc,
        long_desc: body.long_desc,
        image_url: body.image_url,
      })
      .select("id,title,module_category,short_desc,long_desc,image_url")
      .single();

    if (error) throw error;

    /* Return new module */
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message ?? "Error creating module" },
      { status: e.status ?? 400 },
    );
  }
}
