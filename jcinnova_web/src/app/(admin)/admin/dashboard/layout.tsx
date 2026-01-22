import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/serverClient";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const supabase = await createClient();
    await requireAdmin(supabase);
    return <>{children}</>;
  } catch {
    redirect("/admin");
  }
}
