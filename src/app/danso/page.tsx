"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

// ─── Ember Particles ─────────────────────────────────────────────────────────

interface Particle {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
}

function EmberParticles({ count = 20 }: { count?: number }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 4,
        duration: 2.5 + Math.random() * 3,
        size: 2 + Math.random() * 5,
      }))
    );
  }, [count]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full animate-ember-rise"
          style={{
            left: `${p.left}%`,
            bottom: "8%",
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.size > 5 ? "#ff6b2b" : "#ffaa44",
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Splash Screen ────────────────────────────────────────────────────────────

const SPLASH_PHASES = [
  { label: "포항유일", type: "plain" },
  { label: "1++(9)", type: "grade" },
  { label: "특상한우", type: "plain" },
  { label: "with", type: "italic" },
  { label: "숯불", type: "ember" },
  { label: "단소상회", type: "final" },
] as const;

function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    SPLASH_PHASES.forEach((_, i) => {
      timers.push(setTimeout(() => setPhase(i + 1), i * 680));
    });

    timers.push(
      setTimeout(() => {
        setExiting(true);
        setTimeout(onComplete, 550);
      }, SPLASH_PHASES.length * 680 + 900)
    );

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  const current = SPLASH_PHASES[phase - 1];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal"
      style={{
        animation: exiting ? "splash-out 0.55s ease-in forwards" : undefined,
      }}
    >
      <EmberParticles count={28} />

      <div className="relative z-10 text-center select-none">
        {phase > 0 && current && (
          <div className="animate-fade-up">
            {current.type === "grade" && (
              <p className="font-serif text-5xl font-black tracking-widest">
                <span className="text-glow-gold text-gold">1++</span>
                <span className="text-glow-ember">(9)</span>
              </p>
            )}
            {current.type === "final" && (
              <div>
                <p className="font-sans text-xs tracking-[0.45em] text-gold/50 mb-5">
                  포항 이동 · 한우 전문점
                </p>
                <p className="font-serif text-6xl font-black tracking-[0.15em] text-glow-gold text-gold">
                  단소상회
                </p>
              </div>
            )}
            {current.type === "plain" && (
              <p className="font-serif text-4xl font-bold tracking-widest text-cream">
                {current.label}
              </p>
            )}
            {current.type === "italic" && (
              <p className="font-serif text-4xl font-bold tracking-widest italic text-gold/80">
                {current.label}
              </p>
            )}
            {current.type === "ember" && (
              <p className="font-serif text-4xl font-bold tracking-widest text-glow-ember text-ember">
                {current.label}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Section: Hero ────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="relative h-dvh flex flex-col items-center justify-center overflow-hidden bg-charcoal">
      <EmberParticles count={35} />
      <div className="relative z-10 text-center px-8">
        <p className="font-sans text-xs tracking-[0.45em] text-gold/60 mb-6">
          포항 이동 · 한우 전문점
        </p>
        <h1 className="font-serif text-7xl font-black tracking-[0.15em] text-gold text-glow-gold mb-5">
          단소상회
        </h1>
        <p className="font-sans text-sm text-cream/50 tracking-widest">
          1<span className="text-gold font-bold">++</span> 등급 한우 · 참숯 직화구이
        </p>
      </div>
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
        <div className="w-px h-10 bg-gold" />
      </div>
    </section>
  );
}

// ─── Section: ABOUT ───────────────────────────────────────────────────────────

function AboutSection() {
  return (
    <section className="py-24 px-8 bg-panel">
      <div className="max-w-md mx-auto">
        <p className="font-sans text-xs tracking-[0.45em] text-gold/50 mb-5">
          ABOUT
        </p>
        <h2 className="font-serif text-3xl font-bold text-cream mb-7">
          Born 1991
        </h2>
        <p className="font-sans text-[15px] leading-8 text-cream/65">
          1991년생 사장님이 직접 고르고, 직접 굽는 한우.
          포항에서 나고 자란 사람이 포항 사람들에게 정직하게 드리는 한우 한 점입니다.
        </p>
        <p className="font-sans text-[15px] leading-8 text-cream/65 mt-4">
          등급은 숫자가 아니라 신념입니다.
          단소상회는 1++ 이하는 취급하지 않습니다.
        </p>
        <div className="mt-10 pt-8 border-t border-gold/15">
          <p className="font-serif text-xl text-gold/60 tracking-wider">— 사장님</p>
        </div>
      </div>
    </section>
  );
}

// ─── Section: STORY ───────────────────────────────────────────────────────────

function StorySection() {
  return (
    <section className="py-24 px-8 bg-charcoal">
      <div className="max-w-md mx-auto">
        <p className="font-sans text-xs tracking-[0.45em] text-gold/50 mb-5">
          STORY
        </p>
        <div className="space-y-10">
          <div className="border-l-2 border-gold/40 pl-6">
            <h3 className="font-serif text-xl font-bold text-gold mb-3">
              1++ 등급의 의미
            </h3>
            <p className="font-sans text-sm leading-7 text-cream/55">
              한우 등급체계에서 1++는 최고 등급입니다.
              근내지방도 8~9번만 받을 수 있는 등급.
              단소상회는 이 등급의 한우만 취급합니다.
            </p>
          </div>
          <div className="border-l-2 border-ember/40 pl-6">
            <h3 className="font-serif text-xl font-bold text-ember mb-3">
              참숯의 온도
            </h3>
            <p className="font-sans text-sm leading-7 text-cream/55">
              가스불이 아닌 참숯. 800도까지 오르는 직화 열기가
              1++ 한우의 마블링을 제대로 녹여냅니다.
              그 온도에서만 나오는 맛이 있습니다.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Section: MENU Preview ────────────────────────────────────────────────────

const FEATURED_MENU = [
  { name: "등심", desc: "풍부한 마블링, 단소상회의 시그니처" },
  { name: "채끝", desc: "부드러운 결, 담백하고 깔끔한 맛" },
  { name: "안심", desc: "가장 연한 부위, 특별한 날을 위해" },
];

function MenuSection() {
  return (
    <section className="py-24 px-8 bg-panel">
      <div className="max-w-md mx-auto">
        <p className="font-sans text-xs tracking-[0.45em] text-gold/50 mb-5">
          MENU
        </p>
        <h2 className="font-serif text-2xl font-bold text-cream mb-2">
          사장님이 추천하는 메뉴
        </h2>
        <p className="font-sans text-xs text-cream/40 mb-8 tracking-wide">
          모든 메뉴는 1++ 등급 한우입니다
        </p>
        <div className="space-y-0">
          {FEATURED_MENU.map((item) => (
            <div
              key={item.name}
              className="flex items-start justify-between py-5 border-b border-gold/10 last:border-b-0"
            >
              <div>
                <p className="font-serif text-lg font-bold text-cream">
                  {item.name}
                </p>
                <p className="font-sans text-xs text-cream/45 mt-1">
                  {item.desc}
                </p>
              </div>
              <span className="font-sans text-xs text-gold/60 ml-4 shrink-0 mt-1">
                시가
              </span>
            </div>
          ))}
        </div>
        <Link
          href="/danso/menu"
          className="mt-8 flex items-center justify-center py-3.5 border border-gold/35 text-gold font-sans text-xs tracking-[0.3em] hover:bg-gold/8 transition-colors"
        >
          전체 메뉴 보기
        </Link>
      </div>
    </section>
  );
}

// ─── Section: RESERVATION ────────────────────────────────────────────────────

function ReservationSection({
  sectionRef,
}: {
  sectionRef: React.RefObject<HTMLElement | null>;
}) {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <section ref={sectionRef} className="py-24 px-8 bg-charcoal">
      <div className="max-w-md mx-auto">
        <p className="font-sans text-xs tracking-[0.45em] text-gold/50 mb-5">
          RESERVATION
        </p>
        <h2 className="font-serif text-2xl font-bold text-cream mb-10">
          예약하기
        </h2>

        {sent ? (
          <div className="text-center py-14">
            <p className="font-serif text-4xl text-gold text-glow-gold mb-5">
              감사합니다
            </p>
            <p className="font-sans text-sm text-cream/55 leading-8">
              예약 요청이 접수되었습니다.
              <br />
              확인 후 연락드리겠습니다.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="font-sans text-[10px] text-gold/55 tracking-[0.35em] block mb-2">
                이름
              </label>
              <input
                type="text"
                required
                className="w-full bg-white/4 border border-gold/20 text-cream font-sans text-sm px-4 py-3 focus:outline-none focus:border-gold/50 rounded-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-sans text-[10px] text-gold/55 tracking-[0.35em] block mb-2">
                  날짜
                </label>
                <input
                  type="date"
                  required
                  className="w-full bg-white/4 border border-gold/20 text-cream font-sans text-sm px-4 py-3 focus:outline-none focus:border-gold/50 rounded-none"
                />
              </div>
              <div>
                <label className="font-sans text-[10px] text-gold/55 tracking-[0.35em] block mb-2">
                  시간
                </label>
                <select className="w-full bg-charcoal border border-gold/20 text-cream font-sans text-sm px-4 py-3 focus:outline-none focus:border-gold/50 rounded-none">
                  {[
                    "17:00","17:30","18:00","18:30","19:00",
                    "19:30","20:00","20:30","21:00",
                  ].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="font-sans text-[10px] text-gold/55 tracking-[0.35em] block mb-2">
                인원
              </label>
              <select className="w-full bg-charcoal border border-gold/20 text-cream font-sans text-sm px-4 py-3 focus:outline-none focus:border-gold/50 rounded-none">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    {n}명
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-sans text-[10px] text-gold/55 tracking-[0.35em] block mb-2">
                연락처
              </label>
              <input
                type="tel"
                required
                placeholder="010-0000-0000"
                className="w-full bg-white/4 border border-gold/20 text-cream font-sans text-sm px-4 py-3 focus:outline-none focus:border-gold/50 rounded-none placeholder:text-cream/20"
              />
            </div>
            <div>
              <label className="font-sans text-[10px] text-gold/55 tracking-[0.35em] block mb-2">
                요청사항
              </label>
              <textarea
                rows={3}
                placeholder="생일, 기념일 등 특별한 사항을 알려주세요"
                className="w-full bg-white/4 border border-gold/20 text-cream font-sans text-sm px-4 py-3 focus:outline-none focus:border-gold/50 rounded-none placeholder:text-cream/20 resize-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-4 bg-gold text-charcoal font-sans font-bold tracking-[0.3em] text-sm mt-2 hover:bg-gold/90 transition-colors"
            >
              예약 요청하기
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

// ─── Section: INFO ────────────────────────────────────────────────────────────

function InfoSection() {
  return (
    <section className="py-24 px-8 bg-panel pb-36">
      <div className="max-w-md mx-auto">
        <p className="font-sans text-xs tracking-[0.45em] text-gold/50 mb-5">
          INFO
        </p>
        <h2 className="font-serif text-2xl font-bold text-cream mb-10">
          찾아오기
        </h2>
        <div className="space-y-7 font-sans text-sm">
          <div className="flex gap-5">
            <span className="text-gold/55 w-14 shrink-0 pt-0.5">주소</span>
            <span className="text-cream/65 leading-6">
              경상북도 포항시 남구 이동
            </span>
          </div>
          <div className="flex gap-5">
            <span className="text-gold/55 w-14 shrink-0 pt-0.5">영업</span>
            <div className="text-cream/65 leading-6">
              <p>매일 17:00 — 23:00</p>
              <p className="text-cream/35 text-xs mt-1">라스트 오더 22:00</p>
            </div>
          </div>
          <div className="flex gap-5">
            <span className="text-gold/55 w-14 shrink-0 pt-0.5">전화</span>
            <a href="tel:010-0000-0000" className="text-cream/65">
              010-0000-0000
            </a>
          </div>
          <div className="flex gap-5">
            <span className="text-gold/55 w-14 shrink-0 pt-0.5">휴무</span>
            <span className="text-cream/65">매주 월요일</span>
          </div>
        </div>
        <a
          href="https://map.kakao.com/link/search/단소상회"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-10 flex items-center justify-center py-3.5 border border-gold/35 text-gold font-sans text-xs tracking-[0.3em] hover:bg-gold/8 transition-colors"
        >
          카카오맵으로 보기
        </a>
        <Link
          href="/danso/info"
          className="mt-3 flex items-center justify-center py-3.5 border border-cream/10 text-cream/40 font-sans text-xs tracking-[0.2em] hover:border-cream/20 transition-colors"
        >
          상세 안내 보기
        </Link>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-charcoal py-10 px-8 text-center border-t border-gold/10">
      <p className="font-serif text-2xl text-gold/35 mb-2 tracking-widest">
        단소상회
      </p>
      <p className="font-sans text-[11px] text-cream/20">
        © 2025 단소상회. All rights reserved.
      </p>
    </footer>
  );
}

// ─── Fixed Bottom Bar ─────────────────────────────────────────────────────────

function BottomBar({
  onReservation,
}: {
  onReservation: () => void;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-gold/20 bg-charcoal/95 backdrop-blur-sm">
      <button
        onClick={onReservation}
        className="flex-1 py-4 font-sans text-sm font-bold tracking-[0.3em] text-charcoal bg-gold hover:bg-gold/90 transition-colors"
      >
        예약하기
      </button>
      <a
        href="tel:010-0000-0000"
        className="flex-1 py-4 font-sans text-sm font-bold tracking-[0.3em] text-gold text-center border-l border-gold/20 hover:bg-gold/5 transition-colors"
      >
        전화하기
      </a>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DansoPage() {
  const [splashDone, setSplashDone] = useState(false);
  const reservationRef = useRef<HTMLElement>(null);

  const handleSplashComplete = useCallback(() => setSplashDone(true), []);

  const scrollToReservation = useCallback(() => {
    reservationRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <>
      {!splashDone && <SplashScreen onComplete={handleSplashComplete} />}

      <main
        style={{
          opacity: splashDone ? 1 : 0,
          transition: "opacity 0.7s ease",
        }}
      >
        <HeroSection />
        <AboutSection />
        <StorySection />
        <MenuSection />
        <ReservationSection sectionRef={reservationRef} />
        <InfoSection />
        <Footer />
      </main>

      {splashDone && <BottomBar onReservation={scrollToReservation} />}
    </>
  );
}
