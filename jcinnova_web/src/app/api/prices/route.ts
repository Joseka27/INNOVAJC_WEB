import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/serverClient";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { pricesService } from "@/services/pricesService";

export async function GET(req: Request) {
  try {
    const supabase = await createClient();

    const url = new URL(req.url);
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 10), 50);
    const offset = Number(url.searchParams.get("offset") ?? 0);

    const result = await pricesService.list(supabase, { limit, offset });

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message ?? "Error fetching prices" },
      { status: e.status ?? 400 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    await requireAdmin(supabase);

    const body = await req.json();
    const created = await pricesService.create(supabase, body);

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message ?? "Error creating price" },
      { status: e.status ?? 400 },
    );
  }
}
