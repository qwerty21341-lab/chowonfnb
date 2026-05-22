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
  title: "단소상회 — 포항 이동 1++(9) 특상한우 참숯구이",
  description: "포항 유일 1++(9) 특상한우만 취급. 참숯 직화구이 전문점 단소상회.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={`${serifKR.variable} ${sansKR.variable}`}>
      <body className="bg-charcoal text-cream">{children}</body>
    </html>
  );
}
