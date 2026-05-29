import type { Metadata } from "next";
import Link from "next/link";
import { getDictionary } from "@/dictionaries";
import { SiteNav } from "@/components/SiteNav";

export const metadata: Metadata = {
  title: "단소상회 위치 — 포항 이동 한우 맛집 · 주차 안내",
  description:
    "단소상회 위치와 주차 안내. 경상북도 포항시 남구 대이로 159번길 12-8, 포항 이동 1++(9) 특상한우 참숯구이 전문점. 전화 0507-1443-2080.",
  alternates: {
    canonical: "https://chowonfnb.com/danso/info",
  },
  openGraph: {
    title: "단소상회 위치 — 포항 이동 한우 맛집 · 주차 안내",
    description:
      "단소상회 위치와 주차 안내. 경상북도 포항시 남구 대이로 159번길 12-8.",
    url: "https://chowonfnb.com/danso/info",
    siteName: "단소상회",
    locale: "ko_KR",
    type: "website",
    images: [{ url: "https://chowonfnb.com/og/danso-ssam.jpg", width: 1200, height: 630 }],
  },
};

export default async function InfoPage() {
  const dict = await getDictionary("ko");
  const i = dict.infoPage;

  return (
    <main className="min-h-dvh bg-charcoal pb-24">
      <SiteNav />
      {/* Header */}
      <div className="pt-14 border-b border-gold/15 px-6 py-4">
        <p className="font-serif text-lg font-bold text-cream tracking-wider">{i.title}</p>
        <p className="font-sans text-[10px] text-gold/50 tracking-widest">단소상회</p>
      </div>

      <div className="px-6 py-10 max-w-md mx-auto space-y-10">
        {/* Map */}
        <div className="w-full h-56 border border-gold/15 overflow-hidden">
          <iframe
            src="https://maps.google.com/maps?q=경상북도+포항시+남구+대이로+159번길+12-8&output=embed&hl=ko&zoom=17"
            width="100%" height="100%"
            style={{ border: 0, filter: "grayscale(30%) invert(90%) hue-rotate(180deg)" }}
            allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
            title="단소상회 위치"
          />
        </div>

        {/* Address block */}
        <div className="space-y-6 font-sans text-sm border-t border-gold/10 pt-8">
          <div className="flex gap-5">
            <span className="text-gold/55 w-14 shrink-0 pt-0.5 tracking-wide">{i.lAddress}</span>
            <span className="text-cream/65 leading-6">경상북도 포항시 남구 대이로 159번길 12-8</span>
          </div>
          <div className="flex gap-5">
            <span className="text-gold/55 w-14 shrink-0 pt-0.5 tracking-wide">{i.lHours}</span>
            <div className="text-cream/65 leading-6">
              <p>{i.hoursVal}</p>
              <p className="text-cream/35 text-xs mt-1">{i.lastOrder}</p>
            </div>
          </div>
          <div className="flex gap-5">
            <span className="text-gold/55 w-14 shrink-0 pt-0.5 tracking-wide">{i.lClosed}</span>
            <span className="text-cream/65">{i.closedVal}</span>
          </div>
          <div className="flex gap-5">
            <span className="text-gold/55 w-14 shrink-0 pt-0.5 tracking-wide">{i.lPhone}</span>
            <a href="tel:0507-1443-2080" className="text-cream/65 underline underline-offset-4 decoration-gold/20">
              0507-1443-2080
            </a>
          </div>
          <div className="flex gap-5">
            <span className="text-gold/55 w-14 shrink-0 pt-0.5 tracking-wide">{i.lParking}</span>
            <span className="text-cream/65 leading-6">{i.parkingVal}</span>
          </div>
        </div>

        {/* Notice */}
        <div className="border border-gold/15 p-5 space-y-3">
          <p className="font-sans text-[10px] text-gold/60 tracking-[0.3em]">{i.noticeTitle}</p>
          <ul className="font-sans text-xs text-cream/45 leading-7 space-y-1">
            <li>{i.notice1}</li>
            <li>{i.notice2}</li>
            <li>{i.notice3}</li>
          </ul>
        </div>

        {/* CTA */}
        <a href="https://map.kakao.com/link/search/단소상회" target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center py-3.5 border border-gold/35 text-gold font-sans text-xs tracking-[0.3em] hover:bg-gold/8 transition-colors">
          {i.kakao}
        </a>
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 flex border-t border-gold/20 bg-charcoal/95 backdrop-blur-sm">
        <Link href="/danso"
          className="flex-1 py-4 font-sans text-sm font-bold tracking-[0.3em] text-charcoal bg-gold text-center hover:bg-gold/90 transition-colors">
          {i.reserve}
        </Link>
        <a href="tel:0507-1443-2080"
          className="flex-1 py-4 font-sans text-sm font-bold tracking-[0.3em] text-gold text-center border-l border-gold/20 hover:bg-gold/5 transition-colors">
          {i.call}
        </a>
      </div>
    </main>
  );
}
