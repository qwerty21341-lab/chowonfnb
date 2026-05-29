/**
 * GET /api/license/list?adminSecret=...
 * 모든 라이선스 키 목록 조회 (관리자 전용)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

export async function GET(req: NextRequest) {
  const adminSecret = req.nextUrl.searchParams.get("adminSecret");

  // 1단계: 비밀번호만 먼저 확인
  if (!process.env.ADMIN_SECRET) {
    return NextResponse.json({ success: false, error: "서버에 ADMIN_SECRET이 설정되지 않았습니다", code: "no_secret" }, { status: 500 });
  }
  if (adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ success: false, error: "비밀번호가 틀렸습니다", code: "wrong_secret" }, { status: 401 });
  }

  // 2단계: Supabase 조회 (실패해도 auth는 성공으로 처리)
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("licenses")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      // DB 오류지만 auth는 성공 — 빈 목록 반환
      return NextResponse.json({ success: true, licenses: [], dbError: error.message });
    }

    return NextResponse.json({ success: true, licenses: data });
  } catch {
    return NextResponse.json({ success: true, licenses: [], dbError: "Supabase 연결 실패" });
  }
}
