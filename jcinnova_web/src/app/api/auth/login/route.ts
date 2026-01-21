import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/serverClient"; /* Create server client */

export async function POST(req: Request) {
  try {
    /* validate emial and password boxes (not null)*/
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 },
      );
    }

    /* Create server client */
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    /* if user is unauthorized */
    if (error)
      return NextResponse.json({ error: error.message }, { status: 401 });

    /* return access */
    return NextResponse.json({ user: data.user });
  } catch (e: any) {
    /* any error */
    return NextResponse.json(
      { error: e.message },
      { status: 500 },
    ); /* server error */
  }
}
