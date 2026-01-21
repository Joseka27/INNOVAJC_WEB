/* Principal endpoint to create companies */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/serverClient";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export async function GET(req: Request) {
  try {
    /* Crete client */
    const supabase = await createClient();
    /* Get URL from request to read query params */
    const url = new URL(req.url);

    /* Results are displayed in groups of 15, max 50 */
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 15), 50);

    const cursor = url.searchParams.get("cursor");
    const offset = url.searchParams.get("offset");

    /* Query that calls in groups */
    let q = supabase
      .from("CompaniesWorkWith")
      .select("id,name,image_url", { count: "exact" })
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

    const items = data ?? [];
    const nextCursor = items.length ? items[items.length - 1].id : null;

    return NextResponse.json({ items, count: count ?? null, nextCursor });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    /* verify if user is admin */
    await requireAdmin(supabase);

    const body = await req.json();
    /* body: { name, image_url } insert information*/
    const { data, error } = await supabase
      .from("CompaniesWorkWith")
      .insert({ name: body.name, image_url: body.image_url })
      .select("id,name,image_url")
      .single();

    if (error) throw error;

    /* return new company */
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 400 });
  }
}
