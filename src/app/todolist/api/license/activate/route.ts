/**
 * POST /todolist/api/license/activate
 * 라이선스 키 + 기기 ID를 받아 활성화 처리
 *
 * Body: { key: string, deviceId: string }
 * Response:
 *   200 { success: true, expiresAt: string | null }
 *   400 { success: false, error: string }
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
  let key: string, deviceId: string;
  try {
    ({ key, deviceId } = await req.json());
  } catch {
    return NextResponse.json({ success: false, error: "잘못된 요청 형식" }, { status: 400 });
  }

  if (!key || !deviceId) {
    return NextResponse.json({ success: false, error: "키와 기기 ID가 필요합니다" }, { status: 400 });
  }

  // 키 형식 검사: TDRI-XXXX-XXXX
  if (!/^TDRI-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(key)) {
    return NextResponse.json({ success: false, error: "유효하지 않은 키 형식입니다 (TDRI-XXXX-XXXX)" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // 키 조회
  const { data: license, error: fetchError } = await supabase
    .from("licenses")
    .select("*")
    .eq("key", key)
    .single();

  if (fetchError || !license) {
    return NextResponse.json({ success: false, error: "존재하지 않는 키입니다" }, { status: 400 });
  }

  if (license.revoked) {
    return NextResponse.json({ success: false, error: "사용이 중지된 키입니다" }, { status: 400 });
  }

  // 만료 체크
  if (license.expires_at && new Date(license.expires_at) < new Date()) {
    return NextResponse.json({ success: false, error: "만료된 키입니다. 새 키를 발급받으세요" }, { status: 400 });
  }

  // 기기 바인딩 체크
  if (license.bound_device_id) {
    if (license.bound_device_id !== deviceId) {
      return NextResponse.json(
        { success: false, error: "다른 기기에 이미 등록된 키입니다. 기기 변경이 필요하면 관리자에게 문의하세요" },
        { status: 400 }
      );
    }
    // 같은 기기 → 이미 활성화됨, 그냥 성공 반환
    return NextResponse.json({ success: true, expiresAt: license.expires_at ?? null });
  }

  // 첫 활성화 → 기기 바인딩
  const { error: updateError } = await supabase
    .from("licenses")
    .update({
      bound_device_id: deviceId,
      activated_at: new Date().toISOString(),
    })
    .eq("key", key);

  if (updateError) {
    return NextResponse.json({ success: false, error: "서버 오류. 다시 시도해주세요" }, { status: 500 });
  }

  return NextResponse.json({ success: true, expiresAt: license.expires_at ?? null });
}
