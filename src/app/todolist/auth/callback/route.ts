// OAuth 콜백은 더 이상 사용하지 않음 → 메인으로 리다이렉트
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/todolist/notice`);
}
