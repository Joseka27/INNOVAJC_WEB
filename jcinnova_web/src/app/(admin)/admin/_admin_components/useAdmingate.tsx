"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function useAdminGate() {
  const router = useRouter();

  const [booting, setBooting] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          method: "GET",
          cache: "no-store",
        });

        const raw = await res.text();
        let data: any = null;
        try {
          data = raw ? JSON.parse(raw) : null;
        } catch {
          data = null;
        }

        //si expiraron las cookies
        if (data?.error === "SESSION_MAX_EXPIRED") {
          await fetch("/api/auth/logout", {
            method: "POST",
            cache: "no-store",
          });
        }

        if (!alive) return;

        if (!data?.user || !data?.isAdmin) {
          setUserEmail(null);
          setIsAdmin(false);
          setBooting(false);
          router.replace("/admin");
          return;
        }

        setUserEmail(data.user.email ?? null);
        setIsAdmin(Boolean(data.isAdmin));
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
