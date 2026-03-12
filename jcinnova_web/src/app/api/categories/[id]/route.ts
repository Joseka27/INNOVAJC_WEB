import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/serverClient";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { categoriesService } from "@/services/categoriesService";

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

export async function PUT(req: Request, ctx: Ctx) {
  try {
    const supabase = await createClient();
    await requireAdmin(supabase);

    const { id } = await ctx.params;
    const rowId = parseId(id);

    const patch = await req.json();
    const updated = await categoriesService.rename(supabase, rowId, patch);

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message ?? "Error updating category" },
      { status: e.status ?? 400 },
    );
  }
}

export async function DELETE(_: Request, ctx: Ctx) {
  try {
    const supabase = await createClient();
    await requireAdmin(supabase);

    const { id } = await ctx.params;
    const rowId = parseId(id);

    const removed = await categoriesService.remove(supabase, rowId);

    return NextResponse.json(removed);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message ?? "Error deleting category" },
      { status: e.status ?? 400 },
    );
  }
}
