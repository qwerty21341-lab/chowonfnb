import { ContentGeneratorPage } from "@/features/ai/shared/ContentGeneratorPage";

export default function InstagramHashtagPage() {
  return (
    <ContentGeneratorPage
      config={{
        title: "인스타그램 해시태그 추천",
        description: "업종과 게시물에 맞는 최적의 해시태그 20~25개를 AI가 추천해 드립니다",
        contentType: "instagram_hashtag",
        topicLabel: "게시물 주제",
        topicPlaceholder: "예: 강남 헤어샵 봄 염색, 홍대 카페 딸기라떼, 성수동 네일아트",
        showFeatures: false,
        platformColor: "#E1306C",
      }}
    />
  );
}
