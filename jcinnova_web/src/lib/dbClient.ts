import { createClient } from "@supabase/supabase-js"; /* The way to initialize Proyect connection with SupaBase */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/* Verify that are no missing env variables */
if (!URL || !ANON_KEY) {
  throw new Error(
    "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

export const supabase = createClient(URL, ANON_KEY);
