import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/serverClient";
import { cookies } from "next/headers";

const IS_PROD = process.env.NODE_ENV === "production";
const ADMIN_SESSION_LIMIT = 60 * 60 * 1000; // ms (1 minuto para test) -> en prod: 60*60*1000

function noStoreHeaders() {
  return {
    "Cache-Control": "no-store, max-age=0",
    Vary: "Cookie",
  } as const;
}

export async function GET() {
  const supabase = await createClient();
  const cookieStore = await cookies();

  const startRaw = cookieStore.get("admin_session_start")?.value;

  // ✅ Caso 1: NO existe session_start => tratamos como sesión inválida
  // (Esto evita que la sesión "reviva" solo porque Supabase aún tiene sb-*)
  if (!startRaw) {
    const res = NextResponse.json(
      { user: null, isAdmin: false, error: "SESSION_START_MISSING" },
      { status: 200, headers: noStoreHeaders() },
    );

    // limpiar custom
    res.cookies.set("admin_session_start", "", {
      path: "/",
      maxAge: 0,
      sameSite: "lax",
      secure: IS_PROD,
    });
    res.cookies.set("admin_last_seen", "", {
      path: "/",
      maxAge: 0,
      sameSite: "lax",
      secure: IS_PROD,
    });

    // limpiar sb-*
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

  // ✅ Caso 2: Existe session_start => aplicar hard timeout
  const start = Number(startRaw);
  if (Number.isFinite(start) && Date.now() - start > ADMIN_SESSION_LIMIT) {
    const res = NextResponse.json(
      { user: null, isAdmin: false, error: "SESSION_MAX_EXPIRED" },
      { status: 200, headers: noStoreHeaders() },
    );

    // limpiar custom
    res.cookies.set("admin_session_start", "", {
      path: "/",
      maxAge: 0,
      sameSite: "lax",
      secure: IS_PROD,
    });
    res.cookies.set("admin_last_seen", "", {
      path: "/",
      maxAge: 0,
      sameSite: "lax",
      secure: IS_PROD,
    });

    // limpiar sb-*
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

  // ✅ Sesión actual (si pasa hard timeout)
  const { data: userData } = await supabase.auth.getUser();

  // Si Supabase no tiene user, devolvemos null (normal)
  if (!userData.user) {
    return NextResponse.json(
      { user: null, isAdmin: false },
      { status: 200, headers: noStoreHeaders() },
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
    { headers: noStoreHeaders() },
  );
}
