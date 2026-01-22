import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/serverClient";

/* returns the authenticated user and admin status */
export async function GET() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json(
      { user: null, isAdmin: false },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
          Vary: "Cookie",
        },
      },
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userData.user.id)
    .single();

  return NextResponse.json(
    {
      user: {
        id: userData.user.id,
        email: userData.user.email,
      },
      isAdmin: Boolean(profile?.is_admin),
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        Vary: "Cookie",
      },
    },
  );
}
