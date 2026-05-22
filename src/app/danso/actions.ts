"use server";

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface ReservationData {
  name: string;
  date: string;
  time: string;
  guests: string;
  phone: string;
  note: string;
}

export async function submitReservation(data: ReservationData) {
  const to = process.env.RESERVATION_TO_EMAIL ?? "qwerty21341@gmail.com";

  const { error } = await resend.emails.send({
    from: "단소상회 예약 <onboarding@resend.dev>",
    to,
    subject: `[단소상회 예약] ${data.date} ${data.time} · ${data.name} (${data.guests}명)`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;padding:24px;background:#1a1612;color:#e8dcc8;border-radius:8px">
        <h2 style="color:#c9a84c;margin:0 0 20px">단소상회 예약 요청</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:8px 0;color:#c9a84c;width:80px">이름</td><td>${data.name}</td></tr>
          <tr><td style="padding:8px 0;color:#c9a84c">날짜</td><td>${data.date}</td></tr>
          <tr><td style="padding:8px 0;color:#c9a84c">시간</td><td>${data.time}</td></tr>
          <tr><td style="padding:8px 0;color:#c9a84c">인원</td><td>${data.guests}</td></tr>
          <tr><td style="padding:8px 0;color:#c9a84c">연락처</td><td>${data.phone}</td></tr>
          ${data.note ? `<tr><td style="padding:8px 0;color:#c9a84c">요청사항</td><td>${data.note}</td></tr>` : ""}
        </table>
      </div>
    `,
  });

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}
