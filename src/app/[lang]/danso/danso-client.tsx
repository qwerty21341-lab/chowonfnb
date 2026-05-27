"use client";

import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  useTransition,
  createContext,
  useContext,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { submitReservation } from "./actions";
import type { Dict, Locale } from "@/dictionaries";
import { SiteNav } from "@/components/SiteNav";

// ─── Context ──────────────────────────────────────────────────────────────────

interface Ctx {
  d: Dict;
  lang: Locale;
}

const DictCtx = createContext<Ctx>({ d: {} as Dict, lang: "ko" });
const useD = () => useContext(DictCtx);

// ─── Ember Particles ──────────────────────────────────────────────────────────

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
    const frame = requestAnimationFrame(() => {
      setParticles(
        Array.from({ length: count }, (_, i) => ({
          id: i,
          left: Math.random() * 100,
          delay: Math.random() * 4,
          duration: 2.5 + Math.random() * 3,
          size: 2 + Math.random() * 5,
        }))
      );
    });
    return () => cancelAnimationFrame(frame);
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

const BUILD_WORDS = [
  { text: "포항",    cls: "text-cream/60" },
  { text: "한우",    cls: "text-cream/60" },
  { text: "1++(9)", cls: "text-gold/80"  },
  { text: "참숯",   cls: "text-ember/80" },
] as const;

function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase,   setPhase]   = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 560),
      setTimeout(() => setPhase(2), 1440),
      setTimeout(() => setPhase(3), 2320),
      setTimeout(() => setPhase(4), 3200),
      setTimeout(() => setPhase(5), 4240),
      setTimeout(() => {
        setExiting(true);
        setTimeout(onComplete, 550);
      }, 5760),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  const atFinal = phase >= 5;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal"
      style={{
        animation: exiting ? "splash-out 0.55s ease-in forwards" : undefined,
      }}
    >
      <EmberParticles count={18} />

      <div className="relative z-10 text-center select-none px-8 space-y-10">
        <div
          className="flex items-center justify-center gap-3"
          style={{ opacity: atFinal ? 0.18 : 1, transition: "opacity 1.1s ease" }}
        >
          {BUILD_WORDS.map((word, i) => (
            <span key={word.text} className="flex items-center gap-3">
              {i > 0 && (
                <span
                  className="font-sans text-cream/25 text-[1.2rem]"
                  style={{ opacity: phase > i ? 1 : 0, transition: "opacity 0.9s ease" }}
                >
                  ·
                </span>
              )}
              <span
                className={`font-sans text-[1.2rem] tracking-[0.4em] ${word.cls}`}
                style={{ opacity: phase > i ? 1 : 0, transition: "opacity 0.9s ease" }}
              >
                {word.text}
              </span>
            </span>
          ))}
        </div>

        <div style={{ opacity: atFinal ? 1 : 0, transition: "opacity 1.4s ease" }}>
          <p className="font-serif text-6xl font-black tracking-[0.15em] text-glow-gold text-gold">
            단소상회
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Section: Hero ────────────────────────────────────────────────────────────

function HeroSection() {
  const { d } = useD();
  return (
    <section className="relative h-dvh flex flex-col items-center justify-center overflow-hidden bg-charcoal">
      <EmberParticles count={35} />
      <div className="relative z-10 text-center px-8">
        <p className="font-sans text-sm tracking-[0.45em] text-gold/60 mb-6">
          {d.hero.subtitle}
        </p>
        <h1 className="font-serif text-7xl font-black tracking-[0.15em] text-gold text-glow-gold mb-5">
          단소상회
        </h1>
        <p className="font-sans text-base text-cream/50 tracking-widest">
          <span className="text-gold font-bold">1++(9)</span> {d.hero.tagline}
        </p>
      </div>
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
        <p className="font-sans text-[9px] tracking-[0.45em] text-gold/35">SCROLL</p>
        <div className="flex flex-col items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 border-r border-b border-gold rotate-45 animate-chevron-cascade"
              style={{ animationDelay: `${i * 0.22}s` }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section: ABOUT ───────────────────────────────────────────────────────────

function AboutSection() {
  const { d } = useD();
  const a = d.about;
  return (
    <section className="py-24 px-8 bg-panel">
      <div className="max-w-md mx-auto">
        <p className="font-sans text-xs tracking-[0.45em] text-gold/50 mb-5">ABOUT</p>
        <h2 className="font-serif text-3xl font-bold text-cream mb-7">{a.h2}</h2>
        <p className="font-sans text-[15px] leading-8 text-cream/65">{a.p1}</p>
        <p className="font-sans text-[15px] leading-8 text-cream/65 mt-4">
          {a.p2l1}<br />{a.p2l2}
        </p>
        <p className="font-sans text-[15px] leading-8 text-cream/65 mt-4">{a.p3}</p>
        <p className="font-sans text-[15px] leading-8 text-cream/65 mt-4">
          {a.p4l1}<br />{a.p4l2}
        </p>
        <p className="font-sans text-[15px] leading-8 text-cream/65 mt-6 font-medium">
          {a.p5l1}<br />{a.p5l2}
        </p>
        <p className="font-sans text-[15px] leading-8 text-cream/65 mt-4">{a.p6}</p>
        <div className="mt-10 pt-8 border-t border-gold/15">
          <p className="font-serif text-xl text-gold/60 tracking-wider">{a.signature}</p>
        </div>
      </div>
    </section>
  );
}

// ─── Section: STANDARD ────────────────────────────────────────────────────────

function StorySection() {
  const { d } = useD();
  const s = d.standard;
  return (
    <section className="py-24 px-8 bg-charcoal">
      <div className="max-w-md mx-auto">
        <p className="font-sans text-xs tracking-[0.45em] text-gold/50 mb-5">STANDARD</p>
        <h2 className="font-serif text-2xl font-bold text-cream mb-10">{s.h2}</h2>
        <div className="space-y-10">

          {/* 01 */}
          <div className="border-l-2 border-gold/40 pl-6">
            <p className="font-sans text-[10px] tracking-[0.35em] text-gold/35 mb-2">01</p>
            <h3 className="font-serif text-xl font-bold text-gold mb-3">{s.i01h3}</h3>
            <p className="font-sans text-sm leading-7 text-cream/55">
              {s.i01b1}<br />
              {s.i01b2}<br />
              {s.i01b3}<br /><br />
              {s.i01b4}
            </p>
            <div className="mt-5 relative aspect-square overflow-hidden rounded-sm">
              <Image
                src="/story/raw-marbling.jpg"
                alt={s.i01caption}
                fill
                className="object-cover"
                sizes="(max-width: 500px) 90vw, 400px"
              />
              <div className="absolute bottom-0 left-0 right-0 py-2 px-3 bg-gradient-to-t from-charcoal/80 to-transparent">
                <p className="font-sans text-[10px] text-gold/70 tracking-[0.2em]">
                  {s.i01caption}
                </p>
              </div>
            </div>
            {/* grade bar */}
            <div className="mt-6 border border-gold/10 rounded-sm px-4 py-4 space-y-2">
              {[
                { label: "1++(9)", w: "2.5%", gold: true  },
                { label: "1++(8)", w: "16%",  gold: false },
                { label: "1++(7)", w: "26%",  gold: false },
                { label: "1+",     w: "38%",  gold: false },
                { label: "1",      w: "52%",  gold: false },
                { label: "2",      w: "66%",  gold: false },
                { label: "3",      w: "80%",  gold: false },
                { label: s.i01gradeUngraded, w: "100%", gold: false },
              ].map((g) => (
                <div key={g.label} className="flex items-center gap-3">
                  <span className={`font-sans text-[10px] w-11 shrink-0 text-right tracking-wide ${g.gold ? "text-gold font-bold" : "text-cream/20"}`}>
                    {g.label}
                  </span>
                  <div className={`h-px ${g.gold ? "bg-gold" : "bg-cream/12"}`} style={{ width: g.w }} />
                  {g.gold && (
                    <span className="font-sans text-[12px] text-gold/60 tracking-[0.2em]">
                      {s.i01marker}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 02 */}
          <div className="border-l-2 border-ember/40 pl-6 relative overflow-hidden">
            <EmberParticles count={12} />
            <div className="relative z-10">
              <p className="font-sans text-[10px] tracking-[0.35em] text-ember/35 mb-2">02</p>
              <h3 className="font-serif text-xl font-bold text-ember mb-3">{s.i02h3}</h3>
              <p className="font-sans text-sm leading-7 text-cream/55">
                {s.i02b1}<br /><br />
                {s.i02b2}<br />
                {s.i02b3}<br />
                {s.i02b4}<br />
                {s.i02b5}<br /><br />
                {s.i02b6}<br />
                {s.i02b7}
              </p>
            </div>
          </div>

          {/* 03 */}
          <div className="border-l-2 border-cream/25 pl-6">
            <p className="font-sans text-[10px] tracking-[0.35em] text-cream/30 mb-2">03</p>
            <h3 className="font-serif text-xl font-bold text-cream/80 mb-3">{s.i03h3}</h3>
            <p className="font-sans text-sm leading-7 text-cream/55">
              {s.i03b1}<br />
              {s.i03b2}<br /><br />
              {s.i03b3}
            </p>
            <p className="font-sans text-[11px] leading-7 text-cream/40 mt-4">{s.i03note}</p>
          </div>

          {/* 04 */}
          <div className="border-l-2 border-sage/40 pl-6">
            <p className="font-sans text-[10px] tracking-[0.35em] text-sage/35 mb-2">04</p>
            <h3 className="font-serif text-xl font-bold text-sage mb-3">{s.i04h3}</h3>
            <p className="font-sans text-sm leading-7 text-cream/55">
              {s.i04b1}<br /><br />
              {s.i04b2}<br />
              {s.i04b3}<br />
              {s.i04b4}
            </p>
          </div>

          {/* 05 */}
          <div className="border-l-2 border-slate/40 pl-6">
            <p className="font-sans text-[10px] tracking-[0.35em] text-slate/35 mb-2">05</p>
            <h3 className="font-serif text-xl font-bold text-slate mb-3">{s.i05h3}</h3>
            <p className="font-sans text-sm leading-7 text-cream/55">
              {s.i05b1}<br /><br />
              {s.i05b2}<br />
              {s.i05b3}<br />
              {s.i05b4}
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}

// ─── Section: GALLERY ────────────────────────────────────────────────────────

const GALLERY_SRCS = [
  "/gallery/g1-hero-top.jpg",
  "/gallery/g2-marbling.jpg",
  "/gallery/g3-smoke.jpg",
  "/gallery/g4-gyeran.jpg",
  "/gallery/g5-ssam.jpg",
  "/gallery/g6-cuts.jpg",
  "/gallery/g7-glove.jpg",
  "/gallery/g8-hero-bottom.jpg",
];

const REVIEW_SRCS = Array.from({ length: 12 }, (_, i) => `/reviews/r${i + 1}.jpg`);

function GallerySection() {
  const { d } = useD();
  const alts = d.gallery.imgAlts;
  return (
    <section className="bg-charcoal py-24">
      <div className="px-8 max-w-md mx-auto mb-10">
        <p className="font-sans text-xs tracking-[0.45em] text-gold/50 mb-5">GALLERY</p>
        <h2 className="font-serif text-2xl font-bold text-cream">{d.gallery.h2}</h2>
      </div>

      <div className="grid grid-cols-2 gap-0.5">
        <div className="col-span-2 relative aspect-video overflow-hidden">
          <Image src={GALLERY_SRCS[0]} alt={alts[0]} fill className="object-cover" sizes="100vw" />
        </div>
        {GALLERY_SRCS.slice(1, 7).map((src, i) => (
          <div key={src} className="relative aspect-square overflow-hidden">
            <Image src={src} alt={alts[i + 1]} fill className="object-cover" sizes="50vw" />
          </div>
        ))}
        <div className="col-span-2 relative aspect-video overflow-hidden">
          <Image src={GALLERY_SRCS[7]} alt={alts[7]} fill className="object-cover" sizes="100vw" />
        </div>
      </div>
    </section>
  );
}

// ─── Section: REVIEW ─────────────────────────────────────────────────────────

function ReviewSection() {
  const { d, lang } = useD();
  const [visibleCount, setVisibleCount] = useState(4);
  const STEP = 4;
  const remaining = REVIEW_SRCS.length - visibleCount;
  const showQuotes = lang === "en";

  return (
    <section className="py-24 bg-panel">
      <div className="px-8 max-w-md mx-auto mb-10">
        <p className="font-sans text-xs tracking-[0.45em] text-gold/50 mb-5">REVIEW</p>
        <h2 className="font-serif text-2xl font-bold text-cream">{d.review.h2}</h2>
        <p className="font-sans text-xs text-cream/35 mt-2 tracking-wide">{d.review.source}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 px-4">
        {REVIEW_SRCS.slice(0, visibleCount).map((src, i) => (
          <div key={src} className="rounded-sm overflow-hidden">
            <Image src={src} alt={d.review.imgAlt} width={600} height={900} className="w-full h-auto" />
            {showQuotes && d.review.quotes[i] && (
              <div className="px-3 py-3 bg-charcoal border-t border-gold/15">
                <p className="font-serif text-[10px] italic leading-[1.65] text-cream/55">
                  <span className="text-gold/50 not-italic text-sm leading-none">"</span>
                  {d.review.quotes[i]}
                  <span className="text-gold/50 not-italic text-sm leading-none">"</span>
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {remaining > 0 && (
        <div className="px-8 mt-6">
          <button
            type="button"
            onClick={() => setVisibleCount((v) => Math.min(v + STEP, REVIEW_SRCS.length))}
            className="w-full max-w-md mx-auto flex items-center justify-center gap-2 py-3.5 border border-gold/25 text-gold/70 font-sans text-xs tracking-[0.3em] hover:bg-gold/6 transition-colors"
          >
            {d.review.showMore} +{Math.min(remaining, STEP)}
          </button>
        </div>
      )}
    </section>
  );
}

// ─── Section: MENU ───────────────────────────────────────────────────────────

const MENU_ITEMS = [
  "한우포갈비(안동식)",
  "한우안창살",
  "한우치마살",
  "한우새우등심",
  "한우등심",
  "한우꽃갈비살",
  "한우살치살",
  "한우치마살",
  "한우부채살",
  "한우업진살",
  "한우제비추리",
  "한우갈비살",
  "*한우마늘양념구이",
];

function MenuSection() {
  const { d } = useD();
  const m = d.menu;
  return (
    <section className="py-24 px-8 bg-panel">
      <div className="max-w-md mx-auto">
        <p className="font-sans text-xs tracking-[0.45em] text-gold/50 mb-5">MENU</p>
        <h2 className="font-serif text-2xl font-bold text-cream mb-2">{m.h2}</h2>
        <p className="font-sans text-xs text-cream/40 mb-10 tracking-wide">{m.subtitle}</p>

        {/* signature */}
        <div className="mb-10 py-6 border-y border-gold/20 flex flex-col items-center gap-2">
          <p className="font-sans text-[9px] tracking-[0.5em] text-gold/45">SIGNATURE</p>
          <p className="font-serif text-2xl font-black tracking-[0.12em] text-gold text-glow-gold">
            {MENU_ITEMS[0]}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
          {MENU_ITEMS.slice(1).map((item, i) => {
            const isRec = item.startsWith("*");
            const label = isRec ? item.slice(1) : item;
            return (
              <div key={i} className="flex items-baseline gap-1.5">
                <p className={`font-serif text-[15px] font-bold tracking-wide ${isRec ? "text-gold" : "text-cream"}`}>
                  {label}
                </p>
                {isRec && (
                  <span className="font-sans text-[9px] text-gold/55 tracking-[0.15em]">
                    {m.rec}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <p className="font-sans text-[11px] text-cream/30 mt-8 leading-6">{m.note}</p>
      </div>
    </section>
  );
}

// ─── Section: RESERVATION ────────────────────────────────────────────────────

function getKoreaNow() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", hour12: false, hourCycle: "h23",
  }).formatToParts(new Date());

  const value = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    date: `${value("year")}-${value("month")}-${value("day")}`,
    hour: Number(value("hour")),
  };
}

type ReservationData = {
  name: string; date: string; time: string; guests: string;
  babyChairs: string; phone: string; note: string; website: string;
  lang?: string;
};

function ReservationSection({
  sectionRef,
}: {
  sectionRef: React.RefObject<HTMLElement | null>;
}) {
  const { d, lang } = useD();
  const r = d.res;

  const [sent, setSent]         = useState(false);
  const [error, setError]       = useState("");
  const [today]                 = useState(() => getKoreaNow().date);
  const [isPending, startTransition] = useTransition();
  const [pendingData, setPendingData] = useState<ReservationData | null>(null);

  const fmtDate = (dateStr: string) => {
    const [y, m, day] = dateStr.split("-");
    if (lang === "ko") {
      return `${y}년 ${Number(m)}월 ${Number(day)}일`;
    }
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    return `${months[Number(m) - 1]} ${Number(day)}, ${y}`;
  };

  const fmtGuests = (guests: string, baby: string) => {
    if (baby === "0") return guests;
    return `${guests} ${r.cBabyFmt.replace("{n}", baby)}`;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const data: ReservationData = {
      name:       fd.get("name") as string,
      date:       fd.get("date") as string,
      time:       fd.get("time") as string,
      guests:     fd.get("guests") as string,
      babyChairs: fd.get("babyChairs") as string,
      phone:      fd.get("phone") as string,
      note:       fd.get("note") as string,
      website:    fd.get("website") as string,
      lang,
    };

    const now = getKoreaNow();
    if (data.date < now.date) { setError(r.errPast); return; }
    if (data.date === now.date && now.hour >= 16) { setError(r.errSameDay); return; }
    const phoneClean = data.phone.replace(/-/g, "");
    if (!/^01[016789]\d{7,8}$/.test(phoneClean)) { setError(r.errPhone); return; }

    setPendingData(data);
  };

  const handleConfirm = () => {
    if (!pendingData) return;
    startTransition(async () => {
      const result = await submitReservation(pendingData);
      setPendingData(null);
      if (result.success) {
        setSent(true);
      } else {
        setError(result.error ?? r.errServer);
      }
    });
  };

  return (
    <>
      {/* Confirmation modal */}
      {pendingData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-panel border border-gold/20 p-7 space-y-5">
            <p className="font-sans text-[10px] tracking-[0.4em] text-gold/50">{r.confirmTitle}</p>
            <div className="border-t border-gold/10 pt-5 space-y-3">
              {[
                { label: r.cName,   value: pendingData.name },
                { label: r.cDate,   value: fmtDate(pendingData.date) },
                { label: r.cTime,   value: pendingData.time },
                { label: r.cGuests, value: fmtGuests(pendingData.guests, pendingData.babyChairs) },
                { label: r.cPhone,  value: pendingData.phone },
                ...(pendingData.note ? [{ label: r.cNote, value: pendingData.note }] : []),
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-4">
                  <span className="font-sans text-xs text-gold/50 w-16 shrink-0">{label}</span>
                  <span className="font-sans text-xs text-cream/80 leading-5">{value}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gold/10 pt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setPendingData(null)}
                className="flex-1 py-3.5 border border-gold/25 text-cream/50 font-sans text-xs tracking-[0.2em] hover:bg-white/4 transition-colors"
              >
                {r.no}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending}
                className="flex-1 py-3.5 bg-gold text-charcoal font-sans font-bold text-xs tracking-[0.2em] hover:bg-gold/90 transition-colors disabled:opacity-50"
              >
                {isPending ? r.sending : r.yes}
              </button>
            </div>
          </div>
        </div>
      )}

      <section ref={sectionRef} className="py-24 px-8 bg-charcoal">
        <div className="max-w-md mx-auto">
          <p className="font-sans text-xs tracking-[0.45em] text-gold/50 mb-5">RESERVATION</p>
          <h2 className="font-serif text-2xl font-bold text-cream mb-10">{r.h2}</h2>

          {sent ? (
            <div className="text-center py-14">
              <p className="font-serif text-4xl text-gold text-glow-gold mb-5">{r.successH}</p>
              <p className="font-sans text-sm text-cream/55 leading-8">
                {r.successP1}<br />{r.successP2}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="font-sans text-xs text-cream/45 leading-7 -mt-4">
                {r.desc1}<br />{r.desc2}<br />{r.desc3}
              </p>
              <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

              <div>
                <label htmlFor="res-name" className="font-sans text-[10px] text-gold/55 tracking-[0.35em] block mb-2">{r.fName}</label>
                <input id="res-name" type="text" name="name" required
                  className="w-full bg-white/4 border border-gold/20 text-cream font-sans text-sm px-4 py-3 focus:outline-none focus:border-gold/50 rounded-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="res-date" className="font-sans text-[10px] text-gold/55 tracking-[0.35em] block mb-2">{r.fDate}</label>
                  <input id="res-date" type="date" name="date" required min={today}
                    className="w-full bg-white/4 border border-gold/20 text-cream font-sans text-sm px-4 py-3 focus:outline-none focus:border-gold/50 rounded-none" />
                </div>
                <div>
                  <label htmlFor="res-time" className="font-sans text-[10px] text-gold/55 tracking-[0.35em] block mb-2">{r.fTime}</label>
                  <select id="res-time" name="time"
                    className="w-full bg-charcoal border border-gold/20 text-cream font-sans text-sm px-4 py-3 focus:outline-none focus:border-gold/50 rounded-none">
                    {["17:00","17:30","18:00","18:30","19:00","19:30","20:00","20:30","21:00"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="res-guests" className="font-sans text-[10px] text-gold/55 tracking-[0.35em] block mb-2">{r.fGuests}</label>
                  <select id="res-guests" name="guests"
                    className="w-full bg-charcoal border border-gold/20 text-cream font-sans text-sm px-4 py-3 focus:outline-none focus:border-gold/50 rounded-none">
                    {Array.from({ length: 30 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={`${n}`}>{n}{r.guestSuffix}</option>
                    ))}
                    <option value="30~70">{r.guestRange}</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="res-baby" className="font-sans text-[10px] text-gold/55 tracking-[0.35em] block mb-2">{r.fBaby}</label>
                  <select id="res-baby" name="babyChairs"
                    className="w-full bg-charcoal border border-gold/20 text-cream font-sans text-sm px-4 py-3 focus:outline-none focus:border-gold/50 rounded-none">
                    <option value="0">{r.fBabyNone}</option>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={`${n}`}>{n}{r.guestSuffix}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="res-phone" className="font-sans text-[10px] text-gold/55 tracking-[0.35em] block mb-2">{r.fPhone}</label>
                <input id="res-phone" type="tel" name="phone" required inputMode="numeric" placeholder="010-1234-5678"
                  className="w-full bg-white/4 border border-gold/20 text-cream font-sans text-sm px-4 py-3 focus:outline-none focus:border-gold/50 rounded-none placeholder:text-cream/20" />
              </div>

              <div>
                <label htmlFor="res-note" className="font-sans text-[10px] text-gold/55 tracking-[0.35em] block mb-2">{r.fNote}</label>
                <textarea id="res-note" name="note" rows={3} placeholder={r.fNotePlh}
                  className="w-full bg-white/4 border border-gold/20 text-cream font-sans text-sm px-4 py-3 focus:outline-none focus:border-gold/50 rounded-none placeholder:text-cream/20 resize-none" />
              </div>

              {error && <p className="font-sans text-xs text-ember/80">{error}</p>}

              <button type="submit" disabled={isPending}
                className="w-full py-4 bg-gold text-charcoal font-sans font-bold tracking-[0.3em] text-sm mt-2 hover:bg-gold/90 transition-colors disabled:opacity-50">
                {isPending ? r.sending : r.submit}
              </button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}

// ─── Section: LOCATION ────────────────────────────────────────────────────────

function InfoSection() {
  const { d, lang } = useD();
  const l = d.loc;
  const [mapActive, setMapActive] = useState(false);

  const MAP_SRC = "https://maps.google.com/maps?q=경상북도+포항시+남구+대이로+159번길+12-8&output=embed&hl=" + lang;

  return (
    <section className="py-24 bg-panel pb-36">
      <div className="px-8 max-w-md mx-auto mb-8">
        <p className="font-sans text-xs tracking-[0.45em] text-gold/50 mb-5">LOCATION</p>
        <h2 className="font-serif text-2xl font-bold text-cream">{l.h2}</h2>
      </div>

      <div className="relative aspect-video overflow-hidden mb-0">
        <Image src="/exterior.jpg" alt="단소상회 외관" fill className="object-cover" sizes="100vw" />
      </div>

      <div className="relative w-full" style={{ aspectRatio: "16/7" }}>
        <iframe
          src={MAP_SRC}
          width="100%" height="100%"
          style={{ border: 0, display: "block" }}
          allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
          title="단소상회 지도"
        />
        {!mapActive && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer"
            onClick={() => setMapActive(true)}
          >
            <span className="bg-charcoal/65 text-cream/55 font-sans text-[11px] tracking-[0.25em] px-4 py-2">
              {l.tapMap}
            </span>
          </div>
        )}
      </div>

      <div className="px-8 max-w-md mx-auto mt-10">
        <div className="space-y-7 font-sans text-sm">
          {[
            { lbl: l.lAddress, val: l.addressVal },
            { lbl: l.lHours,   val: l.hoursVal,   sub: l.lastOrder },
            { lbl: l.lPhone,   val: null },
            { lbl: l.lClosed,  val: l.closedVal },
            { lbl: l.lParking, val: l.parkingVal },
          ].map(({ lbl, val, sub }) =>
            lbl === l.lPhone ? (
              <div key={lbl} className="flex gap-5">
                <span className="text-gold/55 w-14 shrink-0 pt-0.5">{lbl}</span>
                <a href="tel:0507-1443-2080" className="text-cream/65">0507-1443-2080</a>
              </div>
            ) : (
              <div key={lbl} className="flex gap-5">
                <span className="text-gold/55 w-14 shrink-0 pt-0.5">{lbl}</span>
                <div className="text-cream/65 leading-6">
                  <p>{val}</p>
                  {sub && <p className="text-cream/35 text-xs mt-1">{sub}</p>}
                </div>
              </div>
            )
          )}
        </div>

        <a href="https://map.kakao.com/link/search/단소상회" target="_blank" rel="noopener noreferrer"
          className="mt-10 flex items-center justify-center py-3.5 border border-gold/35 text-gold font-sans text-xs tracking-[0.3em] hover:bg-gold/8 transition-colors">
          {l.kakao}
        </a>
        <a href="https://search.naver.com/search.naver?where=nexearch&sm=top_hty&fbm=0&ie=utf8&query=%ED%8F%AC%ED%95%AD+%EC%86%8C%EA%B3%A0%EA%B8%B0+%EB%8B%A8%EC%86%8C%EC%83%81%ED%9A%8C&ackey=bguzrn86"
          target="_blank" rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center py-3.5 border border-gold/35 text-gold font-sans text-xs tracking-[0.3em] hover:bg-gold/8 transition-colors">
          {l.naver}
        </a>
        <a href="https://www.google.com/search?q=%ED%8F%AC%ED%95%AD+%EC%86%8C%EA%B3%A0%EA%B8%B0+%EB%8B%A8%EC%86%8C%EC%83%81%ED%9A%8C&hl=ko"
          target="_blank" rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center py-3.5 border border-gold/35 text-gold font-sans text-xs tracking-[0.3em] hover:bg-gold/8 transition-colors">
          {l.google}
        </a>
        <Link href={`/${lang}/danso/info`}
          className="mt-3 flex items-center justify-center py-3.5 border border-cream/10 text-cream/40 font-sans text-xs tracking-[0.2em] hover:border-cream/20 transition-colors">
          {l.detail}
        </Link>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  const { d, lang } = useD();
  return (
    <footer className="bg-charcoal pt-10 pb-24 px-8 text-center border-t border-gold/10">
      <p className="font-serif text-2xl text-gold/35 mb-2 tracking-widest">단소상회</p>
      <a href="https://www.instagram.com/danso.pohang" target="_blank" rel="noopener noreferrer"
        className="font-sans text-[11px] text-cream/30 tracking-widest hover:text-cream/60 transition-colors">
        @danso.pohang
      </a>
      <p className="font-sans text-[11px] text-cream/20 mt-3">© 2026 단소상회. All rights reserved.</p>
      <Link href={`/${lang}/danso/privacy`}
        className="font-sans text-[10px] text-cream/20 mt-2 inline-block tracking-widest hover:text-cream/50 transition-colors">
        {d.footer.privacy}
      </Link>
    </footer>
  );
}

// ─── Fixed Bottom Bar ─────────────────────────────────────────────────────────

function BottomBar({ onReservation }: { onReservation: () => void }) {
  const { d } = useD();
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-gold/20 bg-charcoal/95 backdrop-blur-sm">
      <button onClick={onReservation}
        className="flex-1 py-4 font-sans text-sm font-bold tracking-[0.3em] text-charcoal bg-gold hover:bg-gold/90 transition-colors">
        {d.bar.reserve}
      </button>
      <a href="tel:0507-1443-2080"
        className="flex-1 py-4 font-sans text-sm font-bold tracking-[0.3em] text-gold text-center border-l border-gold/20 hover:bg-gold/5 transition-colors">
        {d.bar.call}
      </a>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function DansoPage({ dict, lang }: { dict: Dict; lang: Locale }) {
  const [splashDone, setSplashDone] = useState(false);
  const reservationRef = useRef<HTMLElement>(null);

  // 페인트 전에 실행 → 깜빡임 없이 스플래시 스킵
  useLayoutEffect(() => {
    if (window.location.hash === "#reservation") {
      setSplashDone(true);
    }
  }, []);

  // splashDone 후 예약 섹션으로 스크롤
  useEffect(() => {
    if (splashDone && window.location.hash === "#reservation") {
      setTimeout(() => {
        reservationRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [splashDone]);

  const handleSplashComplete = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    setSplashDone(true);
  }, []);

  const scrollToReservation = useCallback(() => {
    reservationRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <DictCtx.Provider value={{ d: dict, lang }}>
      {!splashDone && <SplashScreen onComplete={handleSplashComplete} />}

      {splashDone && <SiteNav lang={lang} />}

      <main style={{ opacity: splashDone ? 1 : 0, transition: "opacity 0.7s ease" }}>
        <HeroSection />
        <AboutSection />
        <StorySection />
        <GallerySection />
        <ReviewSection />
        <MenuSection />
        <ReservationSection sectionRef={reservationRef} />
        <InfoSection />
        <Footer />
      </main>

      {splashDone && <BottomBar onReservation={scrollToReservation} />}
    </DictCtx.Provider>
  );
}
