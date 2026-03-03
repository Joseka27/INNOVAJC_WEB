"use client";

import { useEffect } from "react";

export default function AdminBurgerMenu({
  isOpen,
  onToggle,
  onClose,
  controlsId = "admin-sidebar",
}: {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  controlsId?: string;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        className={`admin_burger ${isOpen ? "is-open" : ""}`}
        onClick={onToggle}
        aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={isOpen}
        aria-controls={controlsId}
      >
        <span />
        <span />
        <span />
      </button>

      <button
        type="button"
        className={`dashboard_backdrop ${isOpen ? "is-open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
        tabIndex={-1}
      />
    </>
  );
}
