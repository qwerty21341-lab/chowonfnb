import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";

export const metadata: Metadata = {
  title: "단소상회 메뉴 — 포항 한우 메뉴 · 1++(9) 특상한우",
  description:
    "포항 이동 한우 전문점 단소상회 메뉴. 1++(9) 특상한우 전 부위. 한우포갈비, 안창살, 새우등심, 꽃갈비살 등 포항 소고기 메뉴 안내.",
  alternates: {
    canonical: "https://chowonfnb.com/danso/menu",
  },
  openGraph: {
    title: "단소상회 메뉴 — 포항 한우 메뉴 · 1++(9) 특상한우",
    description:
      "포항 이동 한우 전문점 단소상회 메뉴. 1++(9) 특상한우 전 부위.",
    url: "https://chowonfnb.com/danso/menu",
    siteName: "단소상회",
    locale: "ko_KR",
    type: "website",
    images: [{ url: "https://chowonfnb.com/og/danso-ssam.jpg", width: 1200, height: 630 }],
  },
};

const BEEF_GRID = [
  { name: "한우안창살",       recommended: false },
  { name: "한우치마살",       recommended: false },
  { name: "한우새우등심",     recommended: false },
  { name: "한우등심",         recommended: false },
  { name: "한우꽃갈비살",     recommended: false },
  { name: "한우살치살",       recommended: false },
  { name: "한우치맛살",       recommended: false },
  { name: "한우부채살",       recommended: false },
  { name: "한우업진살",       recommended: false },
  { name: "한우제비추리",     recommended: false },
  { name: "한우갈비살",       recommended: false },
  { name: "한우마늘양념구이", recommended: true  },
];

const SIDE_ITEMS = [
  "물밀면",
  "비빔밀면",
  "한우된장찌개",
  "유기농계란찜",
  "친환경공기밥",
];

export default function MenuPage() {
  return (
    <main className="min-h-dvh bg-charcoal pb-24">
      <SiteNav />

      <div className="pt-14 max-w-lg mx-auto px-6">
        {/* Header */}
        <div className="py-10 border-b border-gold/10">
          <p className="font-sans text-[10px] tracking-[0.45em] text-gold/45 mb-3">MENU</p>
          <h1 className="font-serif text-3xl font-bold text-cream mb-1">단소상회 한우</h1>
          <p className="font-sans text-xs text-gold/55 tracking-wide">전 부위 1++(9) 특상한우</p>
        </div>

        {/* SIGNATURE */}
        <div className="py-10 border-b border-gold/10 text-center">
          <p className="font-sans text-[10px] tracking-[0.5em] text-gold/40 mb-5">SIGNATURE</p>
          <p className="font-serif text-2xl font-bold text-gold tracking-wide">
            한우포갈비(안동식)
          </p>
        </div>

        {/* Beef grid */}
        <div className="py-10 border-b border-gold/10">
          <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            {BEEF_GRID.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <p className="font-sans text-sm text-cream/80">{item.name}</p>
                {item.recommended && (
                  <span className="font-sans text-[9px] text-gold/60 border border-gold/30 px-1 py-0.5 leading-none">
                    추천
                  </span>
                )}
              </div>
            ))}
          </div>
          <p className="font-sans text-[10px] text-cream/25 mt-8 leading-5">
            매장 상황에 따라 제공 부위가 변동될 수 있습니다.
          </p>
        </div>

        {/* Side dishes */}
        <div className="py-10 border-b border-gold/10">
          <p className="font-sans text-[10px] tracking-[0.45em] text-gold/45 mb-6">SIDE</p>
          <div className="space-y-4">
            {SIDE_ITEMS.map((name) => (
              <p key={name} className="font-sans text-sm text-cream/70">{name}</p>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="py-8">
          <p className="font-sans text-[11px] text-cream/25 leading-6">
            콜키지 프리 운영 · 단체룸 6~30인 · 주차 150대
          </p>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 flex border-t border-gold/20 bg-charcoal/95 backdrop-blur-sm">
        <Link
          href="/danso"
          className="flex-1 py-4 font-sans text-sm font-bold tracking-[0.3em] text-charcoal bg-gold text-center hover:bg-gold/90 transition-colors"
        >
          예약하기
        </Link>
        <a
          href="tel:0507-1443-2080"
          className="flex-1 py-4 font-sans text-sm font-bold tracking-[0.3em] text-gold text-center border-l border-gold/20 hover:bg-gold/5 transition-colors"
        >
          전화하기
        </a>
      </div>
    </main>
  );
}
