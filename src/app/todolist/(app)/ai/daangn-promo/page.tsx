import { ContentGeneratorPage } from "@/features/ai/shared/ContentGeneratorPage";

export default function DaangnPromoPage() {
  return (
    <ContentGeneratorPage
      config={{
        title: "당근마켓 홍보글 생성기",
        description: "동네 이웃에게 어필하는 당근마켓 홍보글을 AI가 작성해 드립니다",
        contentType: "daangn_promo",
        topicLabel: "홍보 내용 / 이벤트",
        topicPlaceholder: "예: 신규 오픈 기념 첫 방문 10% 할인, 주말 특별 메뉴, 동네 단골 모집",
        extraLabel: "위치 정보나 추가 혜택 (선택)",
        extraPlaceholder: "예: ○○역 도보 3분, 주차 가능, 당일 예약 가능",
        platformColor: "#FF6F0F",
      }}
    />
  );
}
