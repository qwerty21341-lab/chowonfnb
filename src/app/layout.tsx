import type { Metadata } from "next";
import { Noto_Serif_KR, Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const serifKR = Noto_Serif_KR({
  variable: "--font-serif-kr",
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  display: "swap",
});

const sansKR = Noto_Sans_KR({
  variable: "--font-sans-kr",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "단소상회 — 포항 1++(9) 특상한우 참숯구이",
  description:
    "포항 이동 한우 전문점. 매일 직접 고르는 1++(9) 특상한우를 참숯 직화로 굽습니다. 17:00~23:00 영업, 연중무휴.",
  openGraph: {
    title: "단소상회 — 포항 1++(9) 특상한우",
    description:
      "포항 이동 한우 전문점. 매일 직접 고르는 1++(9) 특상한우를 참숯 직화로 굽습니다.",
    url: "https://chowonfnb.com/danso",
    siteName: "단소상회",
    locale: "ko_KR",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: "단소상회",
  url: "https://chowonfnb.com/danso",
  telephone: "0507-1443-2080",
  address: {
    "@type": "PostalAddress",
    streetAddress: "대이로 159번길 12-8",
    addressLocality: "포항시 남구",
    addressRegion: "경상북도",
    addressCountry: "KR",
  },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    opens: "17:00",
    closes: "23:00",
  },
  servesCuisine: ["한우", "한식", "BBQ"],
  priceRange: "₩₩₩",
  sameAs: ["https://www.instagram.com/danso.pohang"],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={`${serifKR.variable} ${sansKR.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-charcoal text-cream">{children}</body>
    </html>
  );
}
