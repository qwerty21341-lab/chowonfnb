"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteNav() {
  const pathname = usePathname();
  const base = "/danso";

  const links = [
    { href: `${base}/menu`,  label: "메뉴" },
    { href: `${base}/blog`,  label: "블로그" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-charcoal/90 backdrop-blur-sm border-b border-gold/10">
      <nav className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link
          href={base}
          className="font-serif text-base font-bold text-gold tracking-[0.2em] hover:text-gold/80 transition-colors"
        >
          단소상회
        </Link>

        <div className="flex items-center gap-6">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`font-sans text-[11px] tracking-[0.3em] transition-colors ${
                pathname.startsWith(href)
                  ? "text-gold"
                  : "text-cream/45 hover:text-cream/80"
              }`}
            >
              {label}
            </Link>
          ))}
          <Link
            href={`${base}/reservation`}
            className="font-sans text-[11px] tracking-[0.25em] font-bold text-charcoal bg-gold px-3 py-1.5 hover:bg-gold/85 transition-colors"
          >
            예약
          </Link>
        </div>
      </nav>
    </header>
  );
}
