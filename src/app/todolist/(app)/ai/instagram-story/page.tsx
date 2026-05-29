import { ContentGeneratorPage } from "@/features/ai/shared/ContentGeneratorPage";

export default function InstagramStoryPage() {
  return (
    <ContentGeneratorPage
      config={{
        title: "인스타그램 스토리 문구 생성",
        description: "인스타그램 스토리에 올릴 임팩트 있는 문구를 AI가 생성해 드립니다",
        contentType: "instagram_story",
        topicLabel: "스토리 주제 / 상황",
        topicPlaceholder: "예: 오늘 하루 특별 할인, 신메뉴 예고, 매장 비하인드 컷 공개",
        extraLabel: "추가 정보 (선택)",
        extraPlaceholder: "예: 할인율 20%, 오늘만 한정, 선착순 10명",
        showFeatures: false,
        platformColor: "#E1306C",
      }}
    />
  );
}
