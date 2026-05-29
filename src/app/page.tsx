"use client";

import Link from "next/link";

const BRANDS = [
  {
    href: "/danso",
    external: false,
    emoji: "🍖",
    name: "단소상회",
    sub: "포항 참숯 한우 전문점",
    desc: "메뉴 · 예약 · 블로그",
    color: "#d4a843",
    bg: "rgba(212,168,67,0.07)",
    border: "rgba(212,168,67,0.25)",
  },
  {
    href: "/todolist",
    external: false,
    emoji: "📋",
    name: "투두리",
    sub: "자영업자 To do list",
    desc: "마케팅 관리 툴",
    color: "#c9a84c",
    bg: "rgba(201,168,76,0.07)",
    border: "rgba(201,168,76,0.2)",
  },
];

export default function HubPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: "#0d0d0d" }}
    >
      {/* 헤더 */}
      <div className="text-center mb-12">
        <p className="text-xs tracking-[0.3em] mb-3" style={{ color: "rgba(212,168,67,0.5)" }}>
          CHOWONFNB
        </p>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#f5f0e8" }}>
          초원에프앤비
        </h1>
        <p className="text-sm mt-2" style={{ color: "rgba(245,240,232,0.35)" }}>
          운영 브랜드 및 서비스를 선택하세요
        </p>
      </div>

      {/* 브랜드 카드 */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xl">
        {BRANDS.map((brand) =>
          brand.external ? (
            <a
              key={brand.name}
              href={brand.href}
              className="flex-1 group rounded-2xl p-6 flex flex-col gap-3 transition-all duration-200 cursor-pointer"
              style={{
                background: brand.bg,
                border: `1px solid ${brand.border}`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  brand.bg.replace("0.07", "0.13");
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = brand.bg;
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}
            >
              <CardContent brand={brand} />
            </a>
          ) : (
            <Link
              key={brand.name}
              href={brand.href}
              className="flex-1 group rounded-2xl p-6 flex flex-col gap-3 transition-all duration-200 cursor-pointer"
              style={{
                background: brand.bg,
                border: `1px solid ${brand.border}`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  brand.bg.replace("0.07", "0.13");
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = brand.bg;
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}
            >
              <CardContent brand={brand} />
            </Link>
          )
        )}
      </div>

      {/* 푸터 */}
      <p className="mt-12 text-xs" style={{ color: "rgba(245,240,232,0.15)" }}>
        © 2025 초원에프앤비
      </p>
    </div>
  );
}

function CardContent({ brand }: { brand: (typeof BRANDS)[number] }) {
  return (
    <>
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
        style={{ background: brand.bg, border: `1px solid ${brand.border}` }}
      >
        {brand.emoji}
      </div>
      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold" style={{ color: brand.color }}>
            {brand.name}
          </span>
          <span className="text-xs" style={{ color: "rgba(245,240,232,0.35)" }}>
            {brand.sub}
          </span>
        </div>
        <p className="text-xs mt-1" style={{ color: "rgba(245,240,232,0.45)" }}>
          {brand.desc}
        </p>
      </div>
      <span className="text-xs mt-auto" style={{ color: brand.color, opacity: 0.6 }}>
        바로가기 →
      </span>
    </>
  );
}
