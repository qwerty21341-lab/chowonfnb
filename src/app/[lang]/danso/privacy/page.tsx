import { notFound } from "next/navigation";
import Link from "next/link";
import { hasLocale } from "@/dictionaries";
import type { Metadata } from "next";

type Props = { params: Promise<{ lang: string }> };

export async function generateStaticParams() {
  return [{ lang: "ko" }, { lang: "en" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const isEn = lang === "en";
  return {
    title: isEn ? "Privacy Policy — Danso" : "개인정보처리방침 — 단소상회",
    robots: { index: false, follow: false },
  };
}

export default async function PrivacyPage({ params }: Props) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  return (
    <main className="min-h-screen bg-charcoal px-6 pt-14 pb-24 text-cream">
      <div className="max-w-lg mx-auto">
        <Link
          href={`/${lang}/danso`}
          className="font-sans text-[11px] tracking-[0.3em] text-cream/30 hover:text-cream/60 transition-colors"
        >
          ← {lang === "en" ? "Back" : "돌아가기"}
        </Link>

        {lang === "en" ? <PrivacyEn /> : <PrivacyKo />}
      </div>
    </main>
  );
}

// ─── Korean ──────────────────────────────────────────────────────────────────

function PrivacyKo() {
  return (
    <article className="mt-10 space-y-8">
      <header>
        <p className="font-sans text-[10px] tracking-[0.45em] text-gold/50 mb-3">PRIVACY</p>
        <h1 className="font-serif text-2xl font-bold text-cream">개인정보처리방침</h1>
        <p className="font-sans text-xs text-cream/35 mt-2">단소상회</p>
      </header>

      <Section title="제1조 — 처리 목적">
        <p>
          단소상회는 다음 목적을 위해 개인정보를 처리합니다.
          처리된 개인정보는 아래 목적 이외의 용도로 이용되지 않습니다.
        </p>
        <ul>
          <li>예약 요청 접수 및 방문 일정 확인 연락</li>
        </ul>
      </Section>

      <Section title="제2조 — 수집 항목">
        <table>
          <tbody>
            <Row label="필수" value="이름, 휴대폰 번호, 방문 희망 일시, 인원" />
            <Row label="선택" value="요청사항 (아기의자 여부 등)" />
            <Row label="수집 방법" value="홈페이지 예약 요청 폼" />
          </tbody>
        </table>
      </Section>

      <Section title="제3조 — 보유 및 이용 기간">
        <p>
          예약 확인 완료 후 <strong className="text-cream/80">3개월 이내</strong>에 파기합니다.
          관련 법령에 따라 별도 보존이 필요한 경우 해당 기간 동안 보관할 수 있습니다.
        </p>
      </Section>

      <Section title="제4조 — 제3자 제공">
        <p>
          단소상회는 이용자의 개인정보를 제3자에게 제공하지 않습니다.
        </p>
      </Section>

      <Section title="제5조 — 파기 절차 및 방법">
        <ul>
          <li>전자적 파일 — 복구 불가능한 방법으로 영구 삭제</li>
          <li>종이 문서 — 분쇄 또는 소각</li>
        </ul>
      </Section>

      <Section title="제6조 — 정보주체의 권리">
        <p>
          이용자는 언제든지 개인정보 열람·정정·삭제·처리정지를 요청할 수 있습니다.
          아래 연락처로 문의하시면 지체 없이 처리하겠습니다.
        </p>
      </Section>

      <Section title="제7조 — 개인정보 보호책임자">
        <table>
          <tbody>
            <Row label="성명" value="김준후" />
            <Row label="연락처" value="0507-1443-2080" />
          </tbody>
        </table>
      </Section>

      <footer className="pt-4 border-t border-gold/10">
        <p className="font-sans text-[11px] text-cream/25">시행일: 2024년 11월 1일</p>
      </footer>
    </article>
  );
}

// ─── English ─────────────────────────────────────────────────────────────────

function PrivacyEn() {
  return (
    <article className="mt-10 space-y-8">
      <header>
        <p className="font-sans text-[10px] tracking-[0.45em] text-gold/50 mb-3">PRIVACY</p>
        <h1 className="font-serif text-2xl font-bold text-cream">Privacy Policy</h1>
        <p className="font-sans text-xs text-cream/35 mt-2">Danso — Pohang, Korea</p>
      </header>

      <Section title="Article 1 — Purpose">
        <p>
          Danso processes personal information solely for the following purpose.
          It will not be used for any other purpose.
        </p>
        <ul>
          <li>To receive reservation requests and contact guests to confirm their visit.</li>
        </ul>
      </Section>

      <Section title="Article 2 — Information Collected">
        <table>
          <tbody>
            <Row label="Required" value="Name, mobile number, preferred date/time, number of guests" />
            <Row label="Optional" value="Special requests (e.g. baby chair needs)" />
            <Row label="Method" value="Website reservation request form" />
          </tbody>
        </table>
      </Section>

      <Section title="Article 3 — Retention Period">
        <p>
          Your information is destroyed within{" "}
          <strong className="text-cream/80">3 months</strong> of reservation confirmation,
          unless a longer period is required by applicable law.
        </p>
      </Section>

      <Section title="Article 4 — Third-Party Sharing">
        <p>Danso does not share personal information with any third parties.</p>
      </Section>

      <Section title="Article 5 — Destruction">
        <ul>
          <li>Electronic files — permanently deleted by irrecoverable means</li>
          <li>Paper documents — shredded or incinerated</li>
        </ul>
      </Section>

      <Section title="Article 6 — Your Rights">
        <p>
          You may request access, correction, deletion, or suspension of processing
          of your personal information at any time. Contact us at the details below
          and we will respond promptly.
        </p>
      </Section>

      <Section title="Article 7 — Privacy Officer">
        <table>
          <tbody>
            <Row label="Name" value="Jun-hoo Kim" />
            <Row label="Phone" value="0507-1443-2080" />
          </tbody>
        </table>
      </Section>

      <footer className="pt-4 border-t border-gold/10">
        <p className="font-sans text-[11px] text-cream/25">Effective: November 1, 2024</p>
      </footer>
    </article>
  );
}

// ─── Shared components ────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-serif text-base font-bold text-gold/80">{title}</h2>
      <div className="font-sans text-sm leading-7 text-cream/55 space-y-2">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="pr-5 py-1 text-cream/35 text-xs align-top whitespace-nowrap">{label}</td>
      <td className="py-1 text-cream/65 text-sm">{value}</td>
    </tr>
  );
}
