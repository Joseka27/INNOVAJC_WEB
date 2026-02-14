/* Runs before Next to synchronize the session and cookies before requests */
import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// ✅ TEST
const ADMIN_IDLE_LIMIT = 30 * 60 * 1000; // 1 min
const ADMIN_SESSION_LIMIT = 60 * 60 * 1000; // 3 min

const IS_PROD = process.env.NODE_ENV === "production";

const ADMIN_LOGIN_PATH = "/admin";
const ADMIN_DASHBOARD_PREFIX = "/admin/dashboard";

function clearSupabaseCookies(req: NextRequest, res: NextResponse) {
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
  const response = await updateSession(request);

  const { pathname } = request.nextUrl;

  const isAdminArea =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/companies") ||
    pathname.startsWith("/api/modules") ||
    pathname.startsWith("/api/auth/me");

  if (!isAdminArea) return response;

  const now = Date.now();

  // 1) Idle timeout (server-side) — solo se valida cuando llega un request
  const lastSeenRaw = request.cookies.get("admin_last_seen")?.value;
  if (lastSeenRaw) {
    const lastSeen = Number(lastSeenRaw);

    if (Number.isFinite(lastSeen) && now - lastSeen > ADMIN_IDLE_LIMIT) {
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
      redirectRes.cookies.set("admin_session_start", "", {
        path: "/",
        maxAge: 0,
        sameSite: "lax",
        secure: IS_PROD,
      });

      return redirectRes;
    }
  }

  // 2) Hard timeout (3 min desde login)
  const sessionStartRaw = request.cookies.get("admin_session_start")?.value;
  if (sessionStartRaw) {
    const sessionStart = Number(sessionStartRaw);

    if (
      Number.isFinite(sessionStart) &&
      now - sessionStart > ADMIN_SESSION_LIMIT
    ) {
      const url = request.nextUrl.clone();
      url.pathname = ADMIN_LOGIN_PATH;
      url.searchParams.set("reason", "session_expired");

      const redirectRes = NextResponse.redirect(url);
      clearSupabaseCookies(request, redirectRes);

      redirectRes.cookies.set("admin_last_seen", "", {
        path: "/",
        maxAge: 0,
        sameSite: "lax",
        secure: IS_PROD,
      });
      redirectRes.cookies.set("admin_session_start", "", {
        path: "/",
        maxAge: 0,
        sameSite: "lax",
        secure: IS_PROD,
      });

      return redirectRes;
    }
  } else {
    // Si estás en /admin/dashboard y no existe session_start => OUT
    if (pathname.startsWith(ADMIN_DASHBOARD_PREFIX)) {
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
      redirectRes.cookies.set("admin_session_start", "", {
        path: "/",
        maxAge: 0,
        sameSite: "lax",
        secure: IS_PROD,
      });

      return redirectRes;
    }
  }

  // ✅ IMPORTANTE:
  // NO renovamos last_seen en /api/auth/me, porque el Layout hace polling y eso "fingiría actividad".
  const shouldTouchLastSeen =
    pathname.startsWith("/admin") && pathname !== "/api/auth/me";

  if (shouldTouchLastSeen) {
    response.cookies.set("admin_last_seen", String(now), {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: IS_PROD,
      maxAge: ADMIN_IDLE_LIMIT / 1000,
    });
  }

  // Gate extra para /admin/dashboard: requiere cookies sb-* + last_seen válido
  if (pathname.startsWith(ADMIN_DASHBOARD_PREFIX)) {
    const hasSessionCookie = request.cookies
      .getAll()
      .some((c) => c.name.startsWith("sb-"));
    const lastSeenRaw2 = request.cookies.get("admin_last_seen")?.value;
    const lastSeen2 = lastSeenRaw2 ? Number(lastSeenRaw2) : NaN;

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

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
