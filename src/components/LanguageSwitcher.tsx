"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Locale } from "@/dictionaries";

const LABELS: Record<Locale, string> = {
  ko: "한국어",
  en: "English",
};

export function LanguageSwitcher({ lang }: { lang: Locale }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const switchTo = (next: Locale) => {
    setOpen(false);
    if (next === lang) return;
    // Replace /ko or /en prefix in the URL
    const newPath = pathname.replace(/^\/(ko|en)(\b|$)/, `/${next}$2`);
    router.push(newPath);
  };

  return (
    <div className="fixed top-3 right-3 z-50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-charcoal/80 backdrop-blur-sm border border-gold/20 text-gold/70 font-sans text-[11px] tracking-[0.15em] hover:border-gold/40 hover:text-gold transition-colors rounded-none"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span>{LABELS[lang]}</span>
        <span
          className="text-[8px] text-gold/40 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▾
        </span>
      </button>

      {open && (
        <>
          {/* backdrop */}
          <div
            className="fixed inset-0 z-[-1]"
            onClick={() => setOpen(false)}
          />
          <div
            role="listbox"
            className="absolute right-0 top-full mt-1 w-28 bg-charcoal border border-gold/20 py-1 shadow-lg"
          >
            {(["ko", "en"] as Locale[]).map((l) => (
              <button
                key={l}
                role="option"
                aria-selected={l === lang}
                type="button"
                onClick={() => switchTo(l)}
                className={`w-full text-left px-4 py-2.5 font-sans text-[12px] tracking-wide transition-colors ${
                  l === lang
                    ? "text-gold bg-gold/8"
                    : "text-cream/50 hover:text-cream/80 hover:bg-white/4"
                }`}
              >
                {LABELS[l]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
