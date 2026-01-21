/* middleware connection to read and update cookies*/
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  /* Function middleware calls */
  let response = NextResponse.next({ request });

  const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const PUBLISH_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

  const supabase = createServerClient(URL, PUBLISH_KEY, {
    /* Create server client with proxy */
    cookies: {
      /* get cookies */
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        /* Set request for the server new token */
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({
          request,
        });
        /* Set response for the server save new token */
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  await supabase.auth.getClaims();

  return response;
}
