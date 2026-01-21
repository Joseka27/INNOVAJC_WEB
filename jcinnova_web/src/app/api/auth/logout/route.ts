import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/serverClient";

export async function POST() {
  /* Create server client */
  const supabase = await createClient();
  /* Log out, delete cookies, and invalidate session */
  await supabase.auth.signOut();
  /* logout correct */
  return NextResponse.json({ ok: true });
}
