import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/serverClient";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { categoriesService } from "@/services/categoriesService";

export async function GET(req: Request) {
  try {
    const supabase = await createClient();

    const url = new URL(req.url);
    const page = url.searchParams.get("page") ?? "";

    const result = await categoriesService.listByPage(supabase, page);

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message ?? "Error fetching categories" },
      { status: e.status ?? 400 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    await requireAdmin(supabase);

    const body = await req.json();
    const created = await categoriesService.create(supabase, body);

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message ?? "Error creating category" },
      { status: e.status ?? 400 },
    );
  }
}
