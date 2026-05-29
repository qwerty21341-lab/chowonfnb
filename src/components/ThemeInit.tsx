"use client";
import { useLayoutEffect } from "react";

export function ThemeInit() {
  useLayoutEffect(() => {
    try {
      const t = localStorage.getItem("tduri_theme");
      if (t === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
      } else if (t === "light") {
        document.documentElement.removeAttribute("data-theme");
      }
    } catch {
      // ignore
    }
  }, []);
  return null;
}
