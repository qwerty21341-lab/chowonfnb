import { ContentGeneratorPage } from "@/features/ai/shared/ContentGeneratorPage";

export default function ThreadsPostPage() {
  return (
    <ContentGeneratorPage
      config={{
        title: "스레드 게시글 생성기",
        description: "스레드에 올릴 공감 가는 게시글을 AI가 작성해 드립니다",
        contentType: "threads_post",
        topicLabel: "게시글 주제",
        topicPlaceholder: "예: 소상공인의 하루 일과 공유, 손님과의 에피소드, 계절 메뉴 소개",
        platformColor: "#888888",
      }}
    />
  );
}
