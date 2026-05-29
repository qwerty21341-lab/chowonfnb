import type { Metadata } from "next";
import { Noto_Serif_KR, Noto_Sans_KR, Playfair_Display } from "next/font/google";
import { ThemeInit } from "@/components/ThemeInit";
import "./globals.css";

const serifKR = Noto_Serif_KR({
  variable: "--font-serif-kr",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  display: "swap",
});

const sansKR = Noto_Sans_KR({
  variable: "--font-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const playfairEn = Playfair_Display({
  variable: "--font-serif-en",
  subsets: ["latin"],
  weight: ["700", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://chowonfnb.com"),
  alternates: {
    canonical: "https://chowonfnb.com/",
  },
  title: "단소상회 — 포항 1++(9) 특상한우 참숯구이",
  description:
    "포항 이동 1++(9) 특상한우 참숯 직화구이 전문점. 포항 토박이 사장님이 직접 고르는 프리미엄 한우. 매일 17~23시.",
  keywords: [
    "포항 한우",
    "포항 한우 맛집",
    "포항 이동 맛집",
    "1++(9) 특상한우",
    "포항 참숯구이",
    "단소상회",
    "포항 소고기",
    "포항 한우 전문점",
    "포항 토박이",
    "경상북도 포항 맛집",
  ],
  openGraph: {
    title: "단소상회 — 포항 1++(9) 특상한우 참숯구이",
    description:
      "포항 토박이 사장님이 직접 고르는 1++(9) 특상한우. 참숯 직화구이 전문점. 포항 이동.",
    url: "https://chowonfnb.com/danso",
    siteName: "단소상회",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "https://chowonfnb.com/og/danso-ssam.jpg",
        width: 1200,
        height: 630,
        alt: "단소상회 1++(9) 특상한우 한 상",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "단소상회 — 포항 1++(9) 특상한우 참숯구이",
    description:
      "포항 토박이 사장님이 직접 고르는 1++(9) 특상한우. 참숯 직화구이 전문점. 포항 이동.",
    images: ["https://chowonfnb.com/og/danso-ssam.jpg"],
  },
  verification: {
    other: {
      "naver-site-verification": "f7291803f4e34290c9e38e07bd1c0b81b9e290c9",
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "@id": "https://chowonfnb.com/danso#restaurant",
  name: "단소상회",
  alternateName: ["단소상회 포항이동점", "포항 단소상회"],
  description:
    "포항 토박이 사장님이 운영하는 1++(9) 특상한우 참숯 직화구이 전문점. 포항 지역 식재료와 포항의 손맛으로 정직한 한 상을 드립니다.",
  url: "https://chowonfnb.com/danso",
  image: [
    "https://chowonfnb.com/og/danso-ssam.jpg",
    "https://chowonfnb.com/gallery/g1-hero-top.jpg",
    "https://chowonfnb.com/gallery/g2-marbling.jpg",
    "https://chowonfnb.com/exterior.jpg",
  ],
  logo: "https://chowonfnb.com/icon",
  telephone: "0507-1443-2080",
  address: {
    "@type": "PostalAddress",
    streetAddress: "대이로 159번길 12-8",
    addressLocality: "포항시 남구",
    addressRegion: "경상북도",
    postalCode: "37932",
    addressCountry: "KR",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 36.0190,
    longitude: 129.3435,
  },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: [
      "Monday", "Tuesday", "Wednesday",
      "Thursday", "Friday", "Saturday", "Sunday",
    ],
    opens: "17:00",
    closes: "23:00",
  },
  servesCuisine: ["한우", "한식", "BBQ", "참숯구이", "소고기"],
  priceRange: "₩₩₩",
  acceptsReservations: true,
  hasMenu: "https://chowonfnb.com/danso/menu",
  hasMap: "https://maps.google.com/maps?q=경상북도+포항시+남구+대이로+159번길+12-8",
  areaServed: {
    "@type": "City",
    name: "포항시",
  },
  founder: {
    "@type": "Person",
    description: "1991년생 포항 토박이. 30여년을 포항에서 나고 자란 사장님.",
  },
  sameAs: [
    "https://www.instagram.com/danso.pohang",
    "https://www.diningcode.com/profile.php?rid=eC9cGZFlFy8B",
  ],
  knowsAbout: [
    "1++(9) 특상한우",
    "참숯 직화구이",
    "포항 한우",
    "포항 로컬 식재료",
    "포항 소고기 맛집",
    "포항 이동 한우",
    "콜키지 프리",
    "단체 회식",
    "주차 편한 식당",
  ],
  potentialAction: {
    "@type": "ReserveAction",
    target: "https://chowonfnb.com/danso#reservation",
    name: "단소상회 예약하기",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={`${serifKR.variable} ${sansKR.variable} ${playfairEn.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-charcoal text-cream">
        <ThemeInit />
        {children}
      </body>
    </html>
  );
}
