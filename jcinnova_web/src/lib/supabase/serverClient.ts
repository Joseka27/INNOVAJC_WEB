/* Conection with SupaBase Server Client */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/* Supabase Cliente for server actions (Route Handlers[APIrest Post,Get,Put,Delete], Server Actions, Server Components)*/
export async function createClient() {
  const cookieStore = await cookies(); /* cookies */

  const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const PUBLISH_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

  if (!URL || !PUBLISH_KEY) {
    throw new Error(
      "Missing Supabase environment variables: SUPABASE_URL or PUBLISHABLE_KEY",
    );
  }

  return createServerClient(URL, PUBLISH_KEY, {
    cookies: {
      /* cookies validation*/
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options);
        }
      },
    },
  });
}

/* This is used to authenticate login and logout and to validate permissions */
