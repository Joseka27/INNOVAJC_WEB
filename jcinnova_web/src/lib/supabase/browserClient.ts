import { createBrowserClient } from "@supabase/ssr";

//crea el lado del cliente de supabase
export function createClient() {
  const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const PUBLISH_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

  //verifica las variables
  if (!URL || !PUBLISH_KEY) {
    throw new Error(
      "Missing Supabase environment variables: SUPABASE_URL or PUBLISHABLE_KEY",
    );
  }

  return createBrowserClient(URL, PUBLISH_KEY);
}
