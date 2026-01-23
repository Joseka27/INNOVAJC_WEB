/* Runs before Next to synchronize the session and cookies before requests */
import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

const ADMIN_IDLE_LIMIT = 15 * 60 * 1000; // 15min hora
const IS_PROD = process.env.NODE_ENV === "production";

const ADMIN_LOGIN_PATH = "/admin";
const ADMIN_DASHBOARD_PREFIX = "/admin/dashboard";

function clearSupabaseCookies(req: NextRequest, res: NextResponse) {
  // Importante: borrar basado en cookies del REQUEST (source of truth)
  for (const c of req.cookies.getAll()) {
    if (c.name.startsWith("sb-")) {
      res.cookies.set(c.name, "", {
        path: "/",
        maxAge: 0,
        sameSite: "lax",
        secure: IS_PROD,
      });
    }
  }
}

export async function middleware(request: NextRequest) {
  // 1) Primero: sincroniza sesión Supabase (refresh cookies si hace falta)
  // updateSession normalmente devuelve un NextResponse
  const response = await updateSession(request);

  const { pathname } = request.nextUrl;

  // 2) Solo lógica extra para rutas /admin/*
  if (!pathname.startsWith("/admin")) {
    return response;
  }

  const now = Date.now();

  // 3) Idle timeout
  const lastSeenRaw = request.cookies.get("admin_last_seen")?.value;
  if (lastSeenRaw) {
    const lastSeen = Number(lastSeenRaw);

    if (Number.isFinite(lastSeen) && now - lastSeen > ADMIN_IDLE_LIMIT) {
      const url = request.nextUrl.clone();
      url.pathname = ADMIN_LOGIN_PATH;

      const redirectRes = NextResponse.redirect(url);

      // limpiar cookies Supabase en el redirect response (no en response.next())
      clearSupabaseCookies(request, redirectRes);

      redirectRes.cookies.set("admin_last_seen", "", {
        path: "/",
        maxAge: 0,
        sameSite: "lax",
        secure: IS_PROD,
      });

      return redirectRes;
    }
  }

  // 4) Renovar last_seen mientras navega en /admin
  response.cookies.set("admin_last_seen", String(now), {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: IS_PROD,
    maxAge: ADMIN_IDLE_LIMIT / 1000,
  });

  // 5) Hard gate extra: si va a /admin/dashboard sin cookies sb-*, redirige
  // (defensa extra al layout server-side)
  if (pathname.startsWith(ADMIN_DASHBOARD_PREFIX)) {
    const hasSessionCookie = request.cookies
      .getAll()
      .some((c) => c.name.startsWith("sb-"));
    const lastSeenRaw2 = request.cookies.get("admin_last_seen")?.value;
    const lastSeen2 = lastSeenRaw2 ? Number(lastSeenRaw2) : NaN;

    // Si no hay sesión, o no hay last_seen, o está inválido → OUT
    if (!hasSessionCookie || !Number.isFinite(lastSeen2)) {
      const url = request.nextUrl.clone();
      url.pathname = ADMIN_LOGIN_PATH;

      const redirectRes = NextResponse.redirect(url);
      clearSupabaseCookies(request, redirectRes);

      redirectRes.cookies.set("admin_last_seen", "", {
        path: "/",
        maxAge: 0,
        sameSite: "lax",
        secure: IS_PROD,
      });

      return redirectRes;
    }
  }

  return response;
}

/* define which URLs pass through the middleware and matcher exceptions */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
