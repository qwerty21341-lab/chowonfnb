import type { Metadata } from "next";
import { hasLocale, type Locale } from "@/dictionaries";

const META: Record<Locale, {
  title: string;
  description: string;
  ogTitle: string;
  ogDesc: string;
  locale: string;
}> = {
  ko: {
    title: "단소상회 — 포항 한우 맛집 · 1++(9) 특상한우 참숯구이",
    description:
      "포항 이동 한우 맛집 단소상회. 1++(9) 특상한우 참숯 직화구이 전문점. 콜키지 프리, 단체룸. 매일 17~23시, 연중무휴.",
    ogTitle: "단소상회 — 포항 한우 맛집 · 1++(9) 특상한우",
    ogDesc: "포항 한우 맛집 단소상회. 포항 이동, 1++(9) 특상한우 참숯 직화구이 전문점.",
    locale: "ko_KR",
  },
  en: {
    title: "Danso — Pohang Grade 1++(9) Premium Hanwoo Charcoal BBQ",
    description:
      "Danso, a premium Hanwoo restaurant in Idong, Pohang. Grade 1++(9) Korean beef charcoal grill, personally curated by a Pohang-native owner. Open daily 17:00–23:00.",
    ogTitle: "Danso — Grade 1++(9) Premium Hanwoo, Pohang",
    ogDesc: "Grade 1++(9) Hanwoo charcoal grill in Idong, Pohang. Handpicked by a local owner.",
    locale: "en_US",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "포항 한우 맛집 어디가 좋나요?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "단소상회는 포항 이동에 위치한 1++(9) 특상한우 전문점입니다. 포항 토박이 사장님이 직접 고르는 최상급 한우를 참숯 직화로 구워드립니다. 주소: 경상북도 포항시 남구 대이로 159번길 12-8.",
      },
    },
    {
      "@type": "Question",
      name: "포항 소고기 맛집 추천해주세요.",
      acceptedAnswer: {
        "@type": "Answer",
        text: "포항 한우 전문점 단소상회를 추천드립니다. 1++(9) 등급 특상한우만 취급하며, 참숯 직화구이로 운영합니다. 포항시 남구 이동에 위치, 매일 오후 5시부터 11시까지 연중무휴 영업합니다.",
      },
    },
    {
      "@type": "Question",
      name: "단소상회 위치가 어디인가요?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "경상북도 포항시 남구 대이로 159번길 12-8입니다. 전화번호는 0507-1443-2080입니다.",
      },
    },
    {
      "@type": "Question",
      name: "단소상회 영업시간은 언제인가요?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "매일 오후 5시(17:00)부터 오후 11시(23:00)까지 영업합니다. 연중무휴로 운영합니다.",
      },
    },
    {
      "@type": "Question",
      name: "1++(9) 특상한우란 무엇인가요?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "1++(9)는 한우 등급체계에서 최고 등급입니다. 근내지방도 9번을 받은 한우로, 단소상회는 이 등급 이하는 취급하지 않습니다.",
      },
    },
    {
      "@type": "Question",
      name: "포항 한우 예약은 어떻게 하나요?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "단소상회 홈페이지에서 온라인 예약이 가능하며, 전화 예약은 0507-1443-2080으로 연락하시면 됩니다.",
      },
    },
    {
      "@type": "Question",
      name: "포항 콜키지 프리 한우집인가요?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "단소상회는 양산형 소주·맥주를 제외한 대부분의 주류 반입이 가능한 콜키지 프리 한우집입니다. 전용잔을 제공하며 콜키지 비용은 없습니다.",
      },
    },
  ],
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = hasLocale(lang) ? (lang as Locale) : "ko";
  const m = META[locale];

  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `https://chowonfnb.com/${locale}/danso`,
      languages: {
        "ko-KR": "https://chowonfnb.com/ko/danso",
        "en-US": "https://chowonfnb.com/en/danso",
      },
    },
    openGraph: {
      title: m.ogTitle,
      description: m.ogDesc,
      url: `https://chowonfnb.com/${locale}/danso`,
      siteName: "단소상회",
      locale: m.locale,
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
      title: m.ogTitle,
      description: m.ogDesc,
      images: ["https://chowonfnb.com/og/danso-ssam.jpg"],
    },
  };
}

export default function DansoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {children}
    </>
  );
}
