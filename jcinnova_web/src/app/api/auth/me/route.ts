import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/serverClient";
import { cookies } from "next/headers";

const IS_PROD = process.env.NODE_ENV === "production";
const ADMIN_SESSION_LIMIT = 60 * 60 * 1000; // 1hora

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

  //Si no hay sesion que sea invalida la entrada
  if (!startRaw) {
    const res = NextResponse.json(
      { user: null, isAdmin: false, error: "SESSION_START_MISSING" },
      { status: 200, headers: noStoreHeaders() },
    );

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

    // limpiar sb
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

  // Si hay sesion aplicar el tiempo
  const start = Number(startRaw);
  if (Number.isFinite(start) && Date.now() - start > ADMIN_SESSION_LIMIT) {
    const res = NextResponse.json(
      { user: null, isAdmin: false, error: "SESSION_MAX_EXPIRED" },
      { status: 200, headers: noStoreHeaders() },
    );

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

    // limpiar sb
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

  const { data: userData } = await supabase.auth.getUser();

  // Si no hay ususario devuelve null
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
