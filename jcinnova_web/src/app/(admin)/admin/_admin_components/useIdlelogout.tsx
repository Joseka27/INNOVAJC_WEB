"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type PushFn = (t: {
  type: "success" | "error" | "info";
  title?: string;
  message: string;
  durationMs?: number;
  actions?: { label: string; onClick: () => void }[];
}) => string;

export function useIdleLogout(
  push: PushFn,
  {
    idleMs = 30 * 60 * 1000, // 30 min
    sessionMaxMs = 60 * 60 * 1000, // 1 hora
  }: { idleMs?: number; sessionMaxMs?: number } = {},
) {
  const router = useRouter();

  const idleTimerRef = useRef<number | null>(null);
  const hardTimerRef = useRef<number | null>(null);

  async function forceLogout(reason?: "idle" | "max") {
    try {
      if (reason === "idle") {
        push({
          type: "info",
          title: "Sesión expirada",
          message: "Se cerró tu sesión por inactividad.",
        });
      } else if (reason === "max") {
        push({
          type: "info",
          title: "Sesión expirada",
          message: "Tu sesión alcanzó el tiempo máximo (1 hora).",
        });
      }

      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/admin");
    }
  }

  function resetIdleTimer() {
    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);

    idleTimerRef.current = window.setTimeout(() => {
      forceLogout("idle");
    }, idleMs);
  }

  function startHardTimer() {
    // empieza una sola vez, al montar el hook (inicio de página)
    if (hardTimerRef.current) return;

    hardTimerRef.current = window.setTimeout(() => {
      forceLogout("max");
    }, sessionMaxMs);
  }

  useEffect(() => {
    // ✅ iniciar ambos
    resetIdleTimer();
    startHardTimer();

    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
    ] as const;
    const onActivity = () => resetIdleTimer();

    events.forEach((e) =>
      window.addEventListener(e, onActivity, { passive: true }),
    );

    const onVisibility = () => {
      if (!document.hidden) resetIdleTimer();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
      if (hardTimerRef.current) window.clearTimeout(hardTimerRef.current);

      events.forEach((e) => window.removeEventListener(e, onActivity));
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { resetIdleTimer, forceLogout };
}
