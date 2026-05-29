import { ContentGeneratorPage } from "@/features/ai/shared/ContentGeneratorPage";

export default function ThreadsPromoPage() {
  return (
    <ContentGeneratorPage
      config={{
        title: "스레드 홍보글 작성",
        description: "스레드에서 자연스럽게 홍보되는 게시글을 AI가 작성해 드립니다",
        contentType: "threads_promo",
        topicLabel: "홍보 내용 / 이벤트 내용",
        topicPlaceholder: "예: 6월 한정 멤버십 20% 할인, 신메뉴 출시, 리뉴얼 오픈 기념",
        extraLabel: "추가 정보 (선택)",
        extraPlaceholder: "예: 기간, 조건, 혜택 등",
        platformColor: "#888888",
      }}
    />
  );
}
