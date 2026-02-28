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

  // borrar la ultima accion de admin
  res.cookies.set("admin_last_seen", "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax",
    secure: IS_PROD,
  });

  // borrar ultimo inicio de sesion
  res.cookies.set("admin_session_start", "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax",
    secure: IS_PROD,
  });

  // borrar todas las cookies
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
