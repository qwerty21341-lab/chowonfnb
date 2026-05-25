"use server";

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface ReservationData {
  name: string;
  date: string;
  time: string;
  guests: string;
  babyChairs: string;
  phone: string;
  note: string;
  website?: string;
  lang?: string;
}

async function translateToKo(text: string): Promise<string | null> {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|ko`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const json = (await res.json()) as { responseData?: { translatedText?: string } };
    const translated = json?.responseData?.translatedText ?? null;
    // MyMemory returns the original text if it can't translate
    if (!translated || translated === text) return null;
    return translated;
  } catch {
    return null;
  }
}

function formatDate(dateStr: string) {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const [y, m, d] = dateStr.split("-").map(Number);
  const day = new Date(y, m - 1, d).getDay();
  return `${dateStr}(${days[day]})`;
}

function formatGuests(guests: string, babyChairs: string) {
  const baby = parseInt(babyChairs) || 0;
  if (baby === 0) return guests;
  const total = parseInt(guests);
  if (isNaN(total)) return `${guests} +${baby}(아기의자)`;
  const adults = total - baby;
  return `${adults}+${baby}(아기의자)명`;
}

function normalizePhone(phone: string) {
  return phone.replace(/[^\d]/g, "");
}

function isValidKoreanMobile(phone: string) {
  const normalized = normalizePhone(phone);
  return /^01[016789]\d{7,8}$/.test(normalized);
}

/** Returns true if the string contains at least one Hangul character */
function isKoreanText(text: string): boolean {
  return /[가-힣ᄀ-ᇿ㄰-㆏]/.test(text);
}

function getKoreaNow() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    hourCycle: "h23",
  }).formatToParts(new Date());

  const value = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    date: `${value("year")}-${value("month")}-${value("day")}`,
    hour: Number(value("hour")),
  };
}

function validateReservationDate(date: string) {
  const now = getKoreaNow();
  if (date < now.date) {
    return "지난 날짜는 예약할 수 없습니다.";
  }
  if (date === now.date && now.hour >= 16) {
    return "당일 예약 요청은 오후 4시 전까지만 가능합니다. 급한 예약은 전화로 문의해 주세요.";
  }
  return "";
}

export async function submitReservation(data: ReservationData) {
  const to = process.env.RESERVATION_TO_EMAIL ?? "qwerty21341@gmail.com";

  if (data.website) {
    console.warn("[reservation] honeypot filled, ignored");
    return { success: true };
  }

  if (!isValidKoreanMobile(data.phone)) {
    return { success: false, error: "휴대폰 번호 형식을 확인해 주세요." };
  }

  const dateError = validateReservationDate(data.date);
  if (dateError) {
    return { success: false, error: dateError };
  }

  const dateDisplay = formatDate(data.date);
  const guestsDisplay = formatGuests(data.guests, data.babyChairs);

  const isEn = data.lang === "en";
  const subjectPrefix = isEn ? "[EN] " : "";

  // Translate note whenever it contains foreign (non-Korean) text,
  // regardless of which page the reservation came from.
  const noteNeedsTranslation = !!data.note && !isKoreanText(data.note);
  let noteTranslation: string | null = null;
  if (noteNeedsTranslation) {
    noteTranslation = await translateToKo(data.note);
  }

  // Korean-formatted date (always shown in Korean regardless of lang)
  const dateKo = formatDate(data.date); // e.g. "2026-06-01(월)"

  // Build guest display in Korean
  const babyNum = parseInt(data.babyChairs) || 0;
  const guestNum = parseInt(data.guests);
  let guestsKo: string;
  if (!isNaN(guestNum)) {
    guestsKo = babyNum > 0
      ? `${guestNum}명 (유아 ${babyNum}명 포함)`
      : `${guestNum}명`;
  } else {
    guestsKo = `${data.guests}명`;
  }

  // Korean summary block appended when lang === "en"
  const koSummaryHtml = isEn ? `
    <div style="margin-top:24px;border-top:1px solid #c9a84c40;padding-top:18px">
      <p style="font-size:10px;letter-spacing:0.3em;color:#c9a84c;margin:0 0 12px">한국어 요약</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:7px 0;color:#c9a84c;width:80px">날짜</td><td>${dateKo}</td></tr>
        <tr><td style="padding:7px 0;color:#c9a84c">시간</td><td>${data.time}</td></tr>
        <tr><td style="padding:7px 0;color:#c9a84c">인원</td><td>${guestsKo}</td></tr>
        ${data.note ? `
        <tr>
          <td style="padding:7px 0;color:#c9a84c;vertical-align:top">요청사항</td>
          <td>${noteTranslation ?? "(번역 실패 — 원문 참고)"}</td>
        </tr>` : ""}
      </table>
    </div>` : "";

  console.log(
    "[reservation] sending to:", to,
    "| lang:", data.lang ?? "ko",
    "| key exists:", !!process.env.RESEND_API_KEY
  );

  try {
    const { data: result, error } = await resend.emails.send({
      from: "단소상회 예약 <noreply@chowonfnb.com>",
      to,
      subject: `${subjectPrefix}[단소상회 예약 요청] ${dateKo} ${data.time} · ${data.name} (${guestsDisplay})`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;padding:24px;background:#1a1612;color:#e8dcc8;border-radius:8px">
          <h2 style="color:#c9a84c;margin:0 0 20px">단소상회 예약 요청</h2>
          <p style="margin:0 0 18px;padding:12px;background:#2a2118;color:#f1d38a;border-radius:6px;font-size:13px;line-height:1.6">
            ※ 아직 확정 예약이 아닙니다. 고객 확인 연락 후 확정 처리하세요.${isEn ? " (영어 페이지 접수)" : ""}
          </p>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr><td style="padding:8px 0;color:#c9a84c;width:80px">이름</td><td>${data.name}</td></tr>
            <tr><td style="padding:8px 0;color:#c9a84c">날짜</td><td>${dateKo}</td></tr>
            <tr><td style="padding:8px 0;color:#c9a84c">시간</td><td>${data.time}</td></tr>
            <tr><td style="padding:8px 0;color:#c9a84c">인원</td><td>${guestsDisplay}</td></tr>
            <tr><td style="padding:8px 0;color:#c9a84c">연락처</td><td>${data.phone}</td></tr>
            ${data.note ? `
            <tr>
              <td style="padding:8px 0;color:#c9a84c;vertical-align:top">요청사항</td>
              <td>
                ${data.note}
                ${noteNeedsTranslation ? `<br/><span style="font-size:11px;color:#c9a84c;opacity:0.6">*(번역)</span> <span style="font-size:13px;color:#e8dcc8;opacity:0.8">${noteTranslation ?? "(번역 실패 — 원문 참고)"}</span>` : ""}
              </td>
            </tr>` : ""}
          </table>
          ${koSummaryHtml}
        </div>
      `,
    });

    if (error) {
      console.error("[reservation] resend error:", error);
      return { success: false, error: error.message };
    }

    console.log("[reservation] sent ok, id:", result?.id);
    return { success: true };
  } catch (e) {
    console.error("[reservation] exception:", e);
    return { success: false, error: String(e) };
  }
}
