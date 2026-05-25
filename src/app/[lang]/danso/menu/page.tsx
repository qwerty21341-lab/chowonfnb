import type { Metadata } from "next";
import Link from "next/link";
import { getDictionary, hasLocale, type Locale } from "@/dictionaries";
import { notFound } from "next/navigation";

const META_TITLE: Record<Locale, string> = {
  ko: "단소상회 메뉴 — 포항 한우 메뉴 · 1++(9) 특상한우",
  en: "Danso Menu — Grade 1++(9) Korean Beef",
};

const META_DESC: Record<Locale, string> = {
  ko: "포항 이동 한우 전문점 단소상회 메뉴. 1++(9) 특상한우, 참숯 직화구이, 한우포갈비, 안창살, 등심, 꽃갈비살 등 포항 소고기 메뉴 안내.",
  en: "Danso restaurant menu in Idong, Pohang. Grade 1++(9) Hanwoo beef, charcoal grill, premium Korean beef cuts.",
};

export async function generateStaticParams() {
  return [{ lang: "ko" }, { lang: "en" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = hasLocale(lang) ? (lang as Locale) : "ko";
  return {
    title: META_TITLE[locale],
    description: META_DESC[locale],
    alternates: {
      canonical: `https://chowonfnb.com/${locale}/danso/menu`,
      languages: {
        "ko-KR": "https://chowonfnb.com/ko/danso/menu",
        "en-US": "https://chowonfnb.com/en/danso/menu",
      },
    },
    openGraph: {
      title: META_TITLE[locale],
      description: META_DESC[locale],
      url: `https://chowonfnb.com/${locale}/danso/menu`,
      siteName: "단소상회",
      locale: locale === "ko" ? "ko_KR" : "en_US",
      type: "website",
      images: [{ url: "https://chowonfnb.com/og/danso-ssam.jpg", width: 1200, height: 630 }],
    },
  };
}

const MENU_CATEGORIES_KO = [
  {
    catKey: "catBeef" as const,
    noteKey: "catBeefNote" as const,
    items: [
      { name: "등심",  descKo: "풍부한 마블링이 살아 있는 단소상회의 시그니처", descEn: "Signature cut — rich marbling throughout", unit: "100g" },
      { name: "채끝",  descKo: "부드러운 결, 담백하고 깔끔한 맛",              descEn: "Tender grain, clean and light flavor",    unit: "100g" },
      { name: "안심",  descKo: "가장 연한 부위, 특별한 날을 위해",              descEn: "The most tender cut, for special occasions", unit: "100g" },
      { name: "꽃살",  descKo: "꽃처럼 피어난 마블링, 육즙이 풍부",            descEn: "Flower-like marbling, intensely juicy",  unit: "100g" },
      { name: "갈비",  descKo: "참숯 위에서 천천히 익히는 프리미엄 갈비",       descEn: "Premium galbi, slow-cooked over charcoal", unit: "1인분" },
    ],
  },
  {
    catKey: "catSide" as const,
    noteKey: null,
    items: [
      { name: "냉면",    descKo: "고기 후에 마무리하는 시원한 평양냉면 스타일", descEn: "Cool Pyongyang-style naengmyeon to finish",  unit: "1그릇" },
      { name: "된장찌개", descKo: "사장님이 직접 끓이는 구수한 한식 된장찌개",   descEn: "Owner's homemade doenjang-jjigae",        unit: "1인" },
      { name: "공기밥",   descKo: "",                                          descEn: "",                                        unit: "1공기" },
    ],
  },
  {
    catKey: "catDrinks" as const,
    noteKey: null,
    items: [
      { name: "소주",   descKo: "", descEn: "",                                  unit: "1병" },
      { name: "맥주",   descKo: "", descEn: "",                                  unit: "1병" },
      { name: "막걸리", descKo: "한우와 어울리는 전통 막걸리", descEn: "Traditional makgeolli, pairs well with Hanwoo", unit: "1병" },
    ],
  },
];

export default async function MenuPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const m = dict.menuPage;

  return (
    <main className="min-h-dvh bg-charcoal pb-16">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-charcoal/95 backdrop-blur-sm border-b border-gold/15 px-6 py-4 flex items-center gap-4">
        <Link href={`/${locale}/danso`} className="font-sans text-gold/60 text-sm hover:text-gold transition-colors">
          ←
        </Link>
        <div>
          <p className="font-serif text-lg font-bold text-cream tracking-wider">{m.title}</p>
          <p className="font-sans text-[10px] text-gold/50 tracking-widest">{m.subtitle}</p>
        </div>
      </div>

      {/* Intro */}
      <div className="px-6 py-10 border-b border-gold/10">
        <p className="font-sans text-sm leading-7 text-cream/55 max-w-md">
          &ldquo;{m.quote}&rdquo;
        </p>
        <p className="font-serif text-sm text-gold/50 mt-3">{m.quoteAuthor}</p>
      </div>

      {/* Menu Categories */}
      <div className="px-6 pt-8 space-y-12 max-w-md mx-auto">
        {MENU_CATEGORIES_KO.map((cat) => (
          <div key={cat.catKey}>
            <div className="flex items-baseline gap-3 mb-6">
              <h2 className="font-serif text-xl font-bold text-gold tracking-wider">
                {m[cat.catKey]}
              </h2>
              {cat.noteKey && (
                <span className="font-sans text-[10px] text-cream/35 tracking-wide">
                  {m[cat.noteKey]}
                </span>
              )}
            </div>
            <div className="space-y-0">
              {cat.items.map((item) => {
                const desc = locale === "ko" ? item.descKo : item.descEn;
                return (
                  <div key={item.name}
                    className="flex items-start justify-between py-4 border-b border-gold/8 last:border-b-0">
                    <div className="flex-1">
                      <p className="font-serif text-base font-bold text-cream">{item.name}</p>
                      {desc && (
                        <p className="font-sans text-xs text-cream/40 mt-0.5 leading-5">{desc}</p>
                      )}
                    </div>
                    <div className="ml-4 text-right shrink-0">
                      <p className="font-sans text-xs text-gold/55">{m.price}</p>
                      <p className="font-sans text-[10px] text-cream/25 mt-0.5">{item.unit}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom note */}
      <div className="px-6 mt-12 max-w-md mx-auto">
        <p className="font-sans text-[11px] text-cream/25 leading-6 text-center">
          {m.note1}<br />{m.note2}
        </p>
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 flex border-t border-gold/20 bg-charcoal/95 backdrop-blur-sm">
        <Link href={`/${locale}/danso`}
          className="flex-1 py-4 font-sans text-sm font-bold tracking-[0.3em] text-charcoal bg-gold text-center hover:bg-gold/90 transition-colors">
          {m.reserve}
        </Link>
        <a href="tel:0507-1443-2080"
          className="flex-1 py-4 font-sans text-sm font-bold tracking-[0.3em] text-gold text-center border-l border-gold/20 hover:bg-gold/5 transition-colors">
          {m.call}
        </a>
      </div>
    </main>
  );
}
