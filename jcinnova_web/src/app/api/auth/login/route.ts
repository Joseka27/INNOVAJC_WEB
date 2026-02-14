import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/serverClient";

const IS_PROD = process.env.NODE_ENV === "production";

// ✅ TEST
const ADMIN_IDLE_LIMIT = 30 * 60; // seconds (1 min)
const ADMIN_SESSION_MAX = 60 * 60; // seconds (3 min)

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    // ✅ login OK: setea inicio de sesión (hard timeout)
    const res = NextResponse.json(
      { user: data.user },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
          Vary: "Cookie",
        },
      },
    );

    const now = Date.now();

    // 1) Inicio de sesión (3 min)
    res.cookies.set("admin_session_start", String(now), {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: IS_PROD,
      maxAge: ADMIN_SESSION_MAX,
    });

    // 2) last_seen inicial (1 min)
    res.cookies.set("admin_last_seen", String(now), {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: IS_PROD,
      maxAge: ADMIN_IDLE_LIMIT,
    });

    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
