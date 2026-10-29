"use client";

import { useEffect } from "react";

import { useAppStore } from "@/stores/appStore";

export function Toast() {
  const message = useAppStore((s) => s.toastMessage);
  const clearToast = useAppStore((s) => s.clearToast);

  useEffect(() => {
    if (!message) return;
    const id = window.setTimeout(() => clearToast(), 2200);
    return () => window.clearTimeout(id);
  }, [message, clearToast]);

  if (!message) return null;
  return <div className="toast">{message}</div>;
}
