//conexion con middleware y actualiza cookies
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  //llama middleware
  let response = NextResponse.next({ request });

  const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const PUBLISH_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

  const supabase = createServerClient(URL, PUBLISH_KEY, {
    //crea el server proxy
    cookies: {
      //conseguir la cookies
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        //solicitar nuevo token
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({
          request,
        });
        //responde al nuevo token
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  await supabase.auth.getClaims();

  return response;
}
