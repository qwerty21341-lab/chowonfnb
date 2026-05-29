import { ContentGeneratorPage } from "@/features/ai/shared/ContentGeneratorPage";

export default function KakaoMessagePage() {
  return (
    <ContentGeneratorPage
      config={{
        title: "카카오채널 메시지 생성",
        description: "단골 고객에게 보낼 카카오채널 홍보 메시지를 AI가 작성해 드립니다",
        contentType: "kakao_channel",
        topicLabel: "메시지 주제 / 이벤트 내용",
        topicPlaceholder: "예: 5월 가정의 달 특별 할인 10%, 신메뉴 출시, 주말 한정 이벤트",
        platformColor: "#FEE500",
      }}
    />
  );
}
