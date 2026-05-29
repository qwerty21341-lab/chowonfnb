import { PlaceReplyPage } from "@/features/ai/place-reply/PlaceReplyPage";

export default function KakaoReplyPage() {
  return (
    <PlaceReplyPage
      platform="kakao_map"
      title="카카오맵 답글 생성"
      subtitle="카카오맵 리뷰에 달 친근한 답글을 AI가 작성해 드립니다"
      accentColor="#FEE500"
    />
  );
}
