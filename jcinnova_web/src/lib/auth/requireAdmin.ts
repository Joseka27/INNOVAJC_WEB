/* Middleware auth */
import type { SupabaseClient } from "@supabase/supabase-js";

/* Verify if the user is an admin */
export async function requireAdmin(supabase: SupabaseClient) {
  /* got verify user from the actual sesion */
  const { data: userData, error: userError } = await supabase.auth.getUser();
  /* Validate if user exist or there is an error  */
  if (userError || !userData.user) {
    const err = new Error("Unauthorized");
    (err as any).status = 401;
    throw err;
  }

  /* check db if user is admin */
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userData.user.id)
    .single();

  /* if request fail */
  if (profileError) {
    const err = new Error("Forbidden");
    (err as any).status = 403;
    throw err;
  }

  /* if user isnt admin */
  if (!profile?.is_admin) {
    const err = new Error("Forbidden");
    (err as any).status = 403;
    throw err;
  }

  /* return validated user */
  return { user: userData.user };
}
