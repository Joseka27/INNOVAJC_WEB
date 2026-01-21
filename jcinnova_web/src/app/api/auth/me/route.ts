import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/serverClient";

/* eeturns the authenticated user and admin status */
export async function GET() {
  const supabase = await createClient();

  /* Try get auth user */
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.json({ user: null, isAdmin: false }, { status: 401 });
  }

  /* Check if user is admin in db */
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userData.user.id)
    .single();

  /* if error happend and system cant confirm that user is an admin */
  if (profileError) {
    return NextResponse.json(
      { user: userData.user, isAdmin: false },
      { status: 200 },
    );
  }

  /* returns if its admin or not */
  return NextResponse.json({
    user: { id: userData.user.id, email: userData.user.email },
    isAdmin: Boolean(profile?.is_admin),
  });
}
