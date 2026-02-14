import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/serverClient";

const IS_PROD = process.env.NODE_ENV === "production";

export async function POST(req: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const cookieStore = await cookies();
  const res = NextResponse.json(
    { ok: true },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        Vary: "Cookie",
      },
    },
  );

  // borrar admin_last_seen
  res.cookies.set("admin_last_seen", "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax",
    secure: IS_PROD,
  });

  // borrar admin_session_start (hard timeout cookie)
  res.cookies.set("admin_session_start", "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax",
    secure: IS_PROD,
  });

  // borrar todas las sb-* (source: cookies actuales)
  for (const c of cookieStore.getAll()) {
    if (c.name.startsWith("sb-")) {
      res.cookies.set(c.name, "", {
        path: "/",
        maxAge: 0,
        sameSite: "lax",
        secure: IS_PROD,
      });
    }
  }

  return res;
}
