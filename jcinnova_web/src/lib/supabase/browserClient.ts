/* Conection with SupaBase Browser Client*/
import { createBrowserClient } from "@supabase/ssr";

/* Create supabase client for the frontend components ("use client")*/
export function createClient() {
  const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const PUBLISH_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

  /* Verify that are no missing env variables */
  if (!URL || !PUBLISH_KEY) {
    throw new Error(
      "Missing Supabase environment variables: SUPABASE_URL or PUBLISHABLE_KEY",
    );
  }

  return createBrowserClient(URL, PUBLISH_KEY);
}

/* This is used to obtain authenticated users and upload items to the Supabase repository */
