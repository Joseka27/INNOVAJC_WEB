import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/serverClient";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { pricesService } from "@/services/pricesService";

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

    const updated = await pricesService.update(supabase, rowId, patch);

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message ?? "Error updating price" },
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

    await pricesService.remove(supabase, rowId);

    return NextResponse.json({ id: rowId });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message ?? "Error deleting price" },
      { status: e.status ?? 400 },
    );
  }
}
