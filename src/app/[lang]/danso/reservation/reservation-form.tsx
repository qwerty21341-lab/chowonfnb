"use client";

import { useState, useTransition } from "react";
import { submitReservation } from "../actions";
import type { Dict } from "@/dictionaries";

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

export function ReservationForm({ r, lang }: { r: Dict["res"]; lang: string }) {
  const [sent, setSent]     = useState(false);
  const [error, setError]   = useState("");
  const [today]             = useState(() => getKoreaNow().date);
  const [isPending, startTransition] = useTransition();
  const [pendingData, setPendingData] = useState<ReservationData | null>(null);

  const fmtDate = (dateStr: string) => {
    const [y, m, day] = dateStr.split("-");
    if (lang === "ko") return `${y}년 ${Number(m)}월 ${Number(day)}일`;
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    return `${months[Number(m) - 1]} ${Number(day)}, ${y}`;
  };

  const fmtGuests = (guests: string, baby: string) =>
    baby === "0" ? guests : `${guests} ${r.cBabyFmt.replace("{n}", baby)}`;

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
      if (result.success) setSent(true);
      else setError(result.error ?? r.errServer);
    });
  };

  return (
    <>
      {/* 확인 모달 */}
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
              <button type="button" onClick={() => setPendingData(null)}
                className="flex-1 py-3.5 border border-gold/25 text-cream/50 font-sans text-xs tracking-[0.2em] hover:bg-white/4 transition-colors">
                {r.no}
              </button>
              <button type="button" onClick={handleConfirm} disabled={isPending}
                className="flex-1 py-3.5 bg-gold text-charcoal font-sans font-bold text-xs tracking-[0.2em] hover:bg-gold/90 transition-colors disabled:opacity-50">
                {isPending ? r.sending : r.yes}
              </button>
            </div>
          </div>
        </div>
      )}

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
    </>
  );
}
