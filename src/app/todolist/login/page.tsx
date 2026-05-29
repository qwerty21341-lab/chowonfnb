// 구 OAuth 로그인 페이지 → 활성화 페이지로 리다이렉트
import { redirect } from "next/navigation";

export default function LoginPage() {
  redirect("/todolist/activate");
}
