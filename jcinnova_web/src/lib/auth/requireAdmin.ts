// Middleware autenticacion
import type { SupabaseClient } from "@supabase/supabase-js";

// Verifica que usuario es un admin */
export async function requireAdmin(supabase: SupabaseClient) {
  //toma el usuario verificado actual
  const { data: userData, error: userError } = await supabase.auth.getUser();
  //valida si existe
  if (userError || !userData.user) {
    const err = new Error("Unauthorized");
    (err as any).status = 401;
    throw err;
  }

  //reviasa la db
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userData.user.id)
    .single();

  //si falla la request
  if (profileError) {
    const err = new Error("Forbidden");
    (err as any).status = 403;
    throw err;
  }

  //si no es usuario saca
  if (!profile?.is_admin) {
    const err = new Error("Forbidden");
    (err as any).status = 403;
    throw err;
  }

  //devuelve usuario validado
  return { user: userData.user };
}
