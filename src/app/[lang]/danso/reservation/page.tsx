import type { Metadata } from "next";
import Link from "next/link";
import { getDictionary, hasLocale, type Locale } from "@/dictionaries";
import { notFound } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";
import { ReservationForm } from "./reservation-form";

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
    title: locale === "ko" ? "단소상회 예약 — 포항 한우 단소상회" : "Reservation — Danso",
    description: locale === "ko"
      ? "포항 이동 한우 전문점 단소상회 예약. 1++(9) 특상한우 참숯 직화구이. 매일 17:00~23:00, 연중무휴."
      : "Reserve a table at Danso, Pohang's premium Hanwoo restaurant. Grade 1++(9) charcoal grill.",
    alternates: {
      canonical: `https://chowonfnb.com/${locale}/danso/reservation`,
    },
  };
}

export default async function ReservationPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const r = dict.res;

  return (
    <main className="min-h-dvh bg-charcoal pb-24">
      <SiteNav lang={locale} />

      <div className="pt-14 max-w-md mx-auto px-6">
        {/* Header */}
        <div className="py-10 border-b border-gold/10">
          <p className="font-sans text-[10px] tracking-[0.45em] text-gold/45 mb-3">RESERVATION</p>
          <h1 className="font-serif text-3xl font-bold text-cream mb-1">{r.h2}</h1>
          <p className="font-sans text-xs text-gold/55 tracking-wide">단소상회</p>
        </div>

        {/* Form */}
        <div className="py-10">
          <ReservationForm r={r} lang={locale} />
        </div>

        {/* Info */}
        <div className="py-8 border-t border-gold/10 space-y-2">
          <p className="font-sans text-[11px] text-cream/25 leading-6">
            콜키지 프리 운영 · 단체룸 6~30인 · 주차 150대
          </p>
          <a href="tel:0507-1443-2080"
            className="block font-sans text-[11px] text-gold/40 hover:text-gold/70 transition-colors">
            전화 문의 0507-1443-2080
          </a>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 flex border-t border-gold/20 bg-charcoal/95 backdrop-blur-sm">
        <Link
          href={`/${locale}/danso`}
          className="flex-1 py-4 font-sans text-sm font-bold tracking-[0.3em] text-gold text-center hover:bg-gold/5 transition-colors border-r border-gold/20"
        >
          홈으로
        </Link>
        <a
          href="tel:0507-1443-2080"
          className="flex-1 py-4 font-sans text-sm font-bold tracking-[0.3em] text-gold text-center hover:bg-gold/5 transition-colors"
        >
          전화하기
        </a>
      </div>
    </main>
  );
}
