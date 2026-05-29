/**
 * POST /api/license/revoke
 * 라이선스 키 취소 또는 기기 바인딩 리셋 (관리자 전용)
 *
 * Body: { adminSecret: string, key: string, action: "revoke" | "reset_device" }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

export async function POST(req: NextRequest) {
  let body: { adminSecret: string; key: string; action: "revoke" | "reset_device" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "잘못된 요청 형식" }, { status: 400 });
  }

  if (body.adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ success: false, error: "인증 실패" }, { status: 401 });
  }

  const supabase = createServiceClient();

  if (body.action === "revoke") {
    const { error } = await supabase
      .from("licenses")
      .update({ revoked: true })
      .eq("key", body.key);

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (body.action === "reset_device") {
    const { error } = await supabase
      .from("licenses")
      .update({ bound_device_id: null, activated_at: null })
      .eq("key", body.key);

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false, error: "알 수 없는 action" }, { status: 400 });
}
