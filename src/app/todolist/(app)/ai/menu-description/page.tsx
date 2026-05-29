import { ContentGeneratorPage } from "@/features/ai/shared/ContentGeneratorPage";

export default function MenuDescriptionPage() {
  return (
    <ContentGeneratorPage
      config={{
        title: "배달앱 메뉴 설명 최적화",
        description: "클릭률과 주문율을 높이는 맛있는 메뉴 설명을 AI가 작성해 드립니다",
        contentType: "menu_description",
        topicLabel: "메뉴명",
        topicPlaceholder: "예: 특제 양념 닭갈비, 수제 버거 세트, 계절 딸기 케이크",
        extraLabel: "기존 설명 또는 재료·특징",
        extraPlaceholder: "예: 국내산 닭고기, 특제 고추장 양념, 매콤달콤한 맛, 1인분 300g",
        showFeatures: false,
        platformColor: "#1ECBDC",
      }}
    />
  );
}
