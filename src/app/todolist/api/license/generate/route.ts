/**
 * POST /todolist/api/license/generate
 * 새 라이선스 키 생성 (관리자 전용)
 *
 * Body: { adminSecret: string, note?: string, expiresAt?: string }
 * Response: { success: true, key: string } | { success: false, error: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

function generateKey(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 헷갈리는 O/0, I/1 제외
  const rand = (len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `TDRI-${rand(4)}-${rand(4)}`;
}

export async function POST(req: NextRequest) {
  let body: { adminSecret: string; note?: string; expiresAt?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "잘못된 요청 형식" }, { status: 400 });
  }

  // 관리자 인증
  if (body.adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ success: false, error: "인증 실패" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // 중복 없는 키 생성 (최대 10회 시도)
  let key = "";
  for (let i = 0; i < 10; i++) {
    const candidate = generateKey();
    const { data } = await supabase
      .from("licenses")
      .select("key")
      .eq("key", candidate)
      .single();
    if (!data) {
      key = candidate;
      break;
    }
  }

  if (!key) {
    return NextResponse.json({ success: false, error: "키 생성 실패. 다시 시도하세요" }, { status: 500 });
  }

  const { error } = await supabase.from("licenses").insert({
    key,
    note: body.note ?? null,
    expires_at: body.expiresAt ?? null,
    revoked: false,
    bound_device_id: null,
    activated_at: null,
    created_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, key });
}
