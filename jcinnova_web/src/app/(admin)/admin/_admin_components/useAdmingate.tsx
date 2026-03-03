"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

async function fetchMeData(): Promise<any> {
  const res = await fetch("/api/auth/me", { method: "GET", cache: "no-store" });
  const raw = await res.text();
  let data: any = null;
  try {
    if (raw) data = JSON.parse(raw);
  } catch {
    data = null;
  }
  return data;
}

export function useAdminGate() {
  const router = useRouter();

  const [booting, setBooting] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      try {
        const data = await fetchMeData();

        if (data && data.error === "SESSION_MAX_EXPIRED") {
          await fetch("/api/auth/logout", {
            method: "POST",
            cache: "no-store",
          });
        }

        if (!alive) return;

        if (!data || !data.user || !data.isAdmin) {
          setUserEmail(null);
          setIsAdmin(false);
          setBooting(false);
          router.replace("/admin");
          return;
        }

        let email: string | null = null;
        if (data.user.email !== null && data.user.email !== undefined) {
          email = data.user.email;
        }
        setUserEmail(email);
        setIsAdmin(data.isAdmin === true);
        setBooting(false);
      } catch {
        if (!alive) return;
        setUserEmail(null);
        setIsAdmin(false);
        setBooting(false);
        router.replace("/admin");
      }
    };

    run();

    return () => {
      alive = false;
    };
  }, []);

  return { booting, userEmail, isAdmin };
}
