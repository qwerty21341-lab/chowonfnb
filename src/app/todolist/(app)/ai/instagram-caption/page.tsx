import { ContentGeneratorPage } from "@/features/ai/shared/ContentGeneratorPage";

export default function InstagramCaptionPage() {
  return (
    <ContentGeneratorPage
      config={{
        title: "인스타그램 캡션 생성기",
        description: "사진·영상에 어울리는 감성적인 인스타그램 캡션을 AI가 작성해 드립니다",
        contentType: "instagram_caption",
        topicLabel: "게시물 주제 / 내용",
        topicPlaceholder: "예: 오늘 오픈한 신메뉴 딸기 케이크, 봄 시즌 한정 음료 출시, 매장 리뉴얼 오픈",
        extraLabel: "추가 분위기나 강조할 포인트 (선택)",
        extraPlaceholder: "예: 따뜻하고 감성적인 분위기, 프리미엄 느낌, 고객 후기 언급",
        platformColor: "#E1306C",
      }}
    />
  );
}
