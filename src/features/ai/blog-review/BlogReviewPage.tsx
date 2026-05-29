"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

const CATEGORIES = [
  { label: "음식점", emoji: "🍽️" },
  { label: "기타", emoji: "🏢" },
];

const AUTHOR_MAP: Record<string, [string, string, string, string]> = {
  "음식점": ["사장/대표", "업체를 대표하여 공식적이고 책임감 있는 답글", "직원 개인", "친근하고 개인적인 서비스 강조"],
  "기타":   ["대표/사장", "업체를 대표하여 공식적이고 책임감 있는 답글", "담당자 개인", "개인적이고 전문적인 서비스 어필"],
};

const POSITIVE_TONES = [
  "정중하고 공식적인", "친근하고 따뜻한", "감사하고 겸손한", "활기차고 밝은",
  "캐주얼하고 편안한", "세심하고 배려하는", "트렌디하고 젊은", "자신감 있고 당당한",
  "유머러스하고 재미있는", "겸손하고 진실한", "친절하고 다정한", "따뜻하고 포근한",
  "정성스럽고 세심한", "감동적이고 특별한", "전문적이고 신뢰감 있는", "프리미엄하고 고급스러운",
];

const NEGATIVE_TONES = [
  { label: "사과하고 개선 의지", desc: "부정적 리뷰에 진심으로 사과하며 개선 약속" },
  { label: "배달 문제 인정 및 개선", desc: "배달·포장 불만에 사과하고 구체적 해결 제시" },
  { label: "음식 품질 사과 및 보상", desc: "맛·양 불만에 진심 사과와 재방문 혜택 안내" },
];

const SAMPLES: Record<string, string> = {
  "음식점": "음식이 정말 맛있어요! 포장도 꼼꼼하게 해주셔서 국물 하나 안 흘리고 왔고, 배달도 예상보다 빠르게 와서 따뜻하게 먹었어요. 양도 푸짐하고 가격 대비 너무 만족스럽습니다. 다음에 또 주문할게요!",
  "기타":   "서비스가 정말 좋았어요. 꼼꼼하게 포장해주시고 빠르게 보내주셔서 감사합니다. 또 이용할게요!",
};

export function BlogReviewPage() {
  const router = useRouter();
  const [category, setCategory] = useState<string>("음식점");
  const [author, setAuthor] = useState<string>("owner");
  const [businessName, setBusinessName] = useState("");
  const [includeBusinessName, setIncludeBusinessName] = useState(true);
  const [staffName, setStaffName] = useState("");
  const [includeStaffName, setIncludeStaffName] = useState(false);
  const [features, setFeatures] = useState("");
  const [review, setReview] = useState("");
  const [tone, setTone] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem("tduri_business");
    if (!s) return;
    try {
      const p = JSON.parse(s);
      if (p.name) { setBusinessName(p.name); setProfileLoaded(true); }
      const featureParts: string[] = [];
      if (p.strengths) featureParts.push(p.strengths);
      if (p.services) featureParts.push(p.services);
      if (p.priceRange) featureParts.push(p.priceRange);
      if (p.hasParking) featureParts.push(p.parkingDetail ? `주차 가능 (${p.parkingDetail})` : "주차 가능");
      if (featureParts.length > 0) setFeatures(featureParts.join(", "));
      if (p.ownerName) {
        setStaffName(p.ownerName);
        setIncludeStaffName(!!p.includeOwnerInReply);
      }
    } catch {}
  }, []);

  const authorInfo = AUTHOR_MAP[category] ?? AUTHOR_MAP["기타"];
  const AUTHORS = [
    { id: "owner", label: authorInfo[0], desc: authorInfo[1] },
    { id: "staff", label: authorInfo[2], desc: authorInfo[3] },
  ];

  const handleGenerate = async () => {
    if (!review.trim() || !tone || busy) return;
    setBusy(true);
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const authorLabel = AUTHORS.find((a) => a.id === author)?.label ?? "사장/대표";
      const data = await api.post<{ reply: string }>("/api/generate-reply", {
        review, tone,
        category,
        author,
        author_label: authorLabel,
        business_name: businessName,
        include_business_name: includeBusinessName,
        staff_name: staffName,
        include_staff_name: includeStaffName,
        features,
        platform: "delivery",
      });
      setResult(data.reply);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "서버 연결 실패");
    } finally {
      setLoading(false);
      setBusy(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fillDummy = () => {
    setCategory("음식점");
    setBusinessName("단소상회");
    setFeatures("20년 경력 노포, 주차 가능, 당일 예약 가능, 단체석 보유");
    setReview(SAMPLES["음식점"]);
    setTone("친근하고 따뜻한");
  };

  const canGenerate = !!review.trim() && !!tone;

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
            배달앱 답글 생성
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            배달의민족·요기요·쿠팡이츠 리뷰에 맞는 답글을 AI가 작성해드려요
          </p>
        </div>
      </div>
      {profileLoaded ? (
        <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
          style={{ background: "var(--color-primary)" + "12", border: "1px solid var(--color-primary)" + "30", color: "var(--color-primary)" }}>
          <span>✓ 업체 설정에서 정보를 불러왔습니다</span>
          <button onClick={() => router.push("/todolist/settings/business")} className="ml-auto underline opacity-70">수정</button>
        </div>
      ) : (
        <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
          style={{ background: "var(--color-border)", color: "var(--color-text-muted)" }}>
          <span>업체 정보를 미리 등록하면 매번 입력하지 않아도 돼요</span>
          <button onClick={() => router.push("/todolist/settings/business")} className="ml-auto underline">업체 설정</button>
        </div>
      )}

      <div className="space-y-4">
        {/* 설정 */}
        <div className="rounded-2xl p-6" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <p className="text-sm font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>설정</p>

          <p className="text-xs font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>업종 선택</p>
          <div className="flex gap-2 mb-5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.label}
                onClick={() => setCategory(cat.label)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-colors"
                style={{
                  background: category === cat.label ? "var(--color-primary)" : "var(--color-bg)",
                  border: `1px solid ${category === cat.label ? "var(--color-primary)" : "var(--color-border)"}`,
                  color: category === cat.label ? "#fff" : "var(--color-text-secondary)",
                }}
              >
                <span className="text-lg">{cat.emoji}</span>
                {cat.label}
              </button>
            ))}
          </div>

          <p className="text-xs font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>답글 작성자</p>
          <div className="grid grid-cols-2 gap-2 mb-5">
            {AUTHORS.map((a) => (
              <button
                key={a.id}
                onClick={() => setAuthor(a.id)}
                className="text-left p-3 rounded-xl transition-colors"
                style={{
                  background: author === a.id ? "var(--color-primary)" + "18" : "var(--color-bg)",
                  border: `1px solid ${author === a.id ? "var(--color-primary)" : "var(--color-border)"}`,
                }}
              >
                <p className="text-sm font-semibold" style={{ color: author === a.id ? "var(--color-primary)" : "var(--color-text-primary)" }}>
                  {a.label}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{a.desc}</p>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>업체명</p>
            <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: "var(--color-text-muted)" }}>
              <input type="checkbox" checked={includeBusinessName} onChange={(e) => setIncludeBusinessName(e.target.checked)} />
              포함하기
            </label>
          </div>
          <input
            type="text"
            placeholder="예: 단소상회"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            disabled={!includeBusinessName}
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none mb-3 disabled:opacity-40"
            style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
          />

          {author === "staff" && (
            <>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>직원 이름</p>
                <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: "var(--color-text-muted)" }}>
                  <input type="checkbox" checked={includeStaffName} onChange={(e) => setIncludeStaffName(e.target.checked)} />
                  포함하기
                </label>
              </div>
              <input
                type="text"
                placeholder="예: 김민지"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                disabled={!includeStaffName}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none mb-3 disabled:opacity-40"
                style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
              />
            </>
          )}

          <p className="text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>가게 장점 및 특성</p>
          <textarea
            rows={3}
            placeholder="예: 직접 만든 소스, 넉넉한 양, 빠른 조리, 친환경 포장재 사용"
            value={features}
            onChange={(e) => setFeatures(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
            style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
          />
          <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
            가게 고유의 특성이나 장점을 입력하면 더 구체적인 답글이 생성됩니다.
          </p>
        </div>

        {/* 고객 리뷰 */}
        <div className="rounded-2xl p-6" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>고객 리뷰</p>
              <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ background: "var(--color-primary)" }}>
                {category}
              </span>
            </div>
            <button
              onClick={() => setReview(SAMPLES[category] ?? SAMPLES["기타"])}
              className="text-xs px-3 py-1.5 rounded-lg"
              style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}
            >
              샘플 불러오기
            </button>
          </div>
          <textarea
            rows={5}
            placeholder="배달앱에 작성된 고객 리뷰를 여기에 붙여넣으세요..."
            value={review}
            onChange={(e) => setReview(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
            style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
          />
          <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>{review.length} 글자</p>
        </div>

        {/* 답글 톤 */}
        <div className="rounded-2xl p-6" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <p className="text-sm font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>답글 톤 선택</p>

          <p className="text-xs font-semibold mb-2" style={{ color: "var(--color-success)" }}>긍정적 리뷰용 ({POSITIVE_TONES.length}가지)</p>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {POSITIVE_TONES.map((t) => (
              <button
                key={t}
                onClick={() => setTone((p) => p === t ? null : t)}
                className="py-2 px-3 rounded-xl text-xs font-medium transition-colors"
                style={{
                  background: tone === t ? "var(--color-primary)" : "var(--color-bg)",
                  border: `1px solid ${tone === t ? "var(--color-primary)" : "var(--color-border)"}`,
                  color: tone === t ? "#fff" : "var(--color-text-secondary)",
                }}
              >
                {t}
              </button>
            ))}
          </div>

          <p className="text-xs font-semibold mb-2" style={{ color: "var(--color-danger)" }}>부정적 리뷰용 ({NEGATIVE_TONES.length}가지)</p>
          <div className="grid grid-cols-3 gap-2 mb-5">
            {NEGATIVE_TONES.map((t) => (
              <button
                key={t.label}
                onClick={() => setTone((p) => p === t.label ? null : t.label)}
                className="text-left p-3 rounded-xl text-xs font-medium transition-colors"
                style={{
                  background: tone === t.label ? "var(--color-danger)" + "18" : "var(--color-bg)",
                  border: `1px solid ${tone === t.label ? "var(--color-danger)" : "var(--color-border)"}`,
                  color: tone === t.label ? "var(--color-danger)" : "var(--color-text-secondary)",
                }}
              >
                <p className="font-semibold">{t.label}</p>
                <p className="mt-0.5 opacity-70">{t.desc}</p>
              </button>
            ))}
          </div>

          <button
            onClick={handleGenerate}
            disabled={busy || !canGenerate}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
            style={{ background: "var(--color-primary)" }}
          >
            {loading ? "생성 중..." : "✦ 답글 생성하기"}
          </button>
        </div>

        {/* 생성된 답글 */}
        <div className="rounded-2xl p-6" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <p className="text-sm font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>생성된 답글</p>

          {tone && (
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>선택된 톤:</span>
              <span className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>{tone}</span>
              <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ background: "#8B5CF6" }}>
                {AUTHORS.find(a => a.id === author)?.label}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ background: "var(--color-primary)" }}>
                {category}
              </span>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl text-sm mb-3" style={{ background: "#FEF2F2", color: "var(--color-danger)" }}>
              {error}
            </div>
          )}

          {result ? (
            <div>
              <div
                className="p-4 rounded-xl text-sm whitespace-pre-wrap mb-3"
                style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)", lineHeight: "1.8" }}
              >
                {result}
              </div>
              <button
                onClick={handleCopy}
                className="text-xs px-4 py-2 rounded-lg font-medium"
                style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: copied ? "var(--color-success)" : "var(--color-text-secondary)" }}
              >
                {copied ? "복사됨 ✓" : "복사하기"}
              </button>
            </div>
          ) : (
            <div
              className="flex items-center justify-center h-32 rounded-xl text-sm"
              style={{ background: "var(--color-bg)", color: "var(--color-text-muted)" }}
            >
              고객 리뷰를 입력하고 답글 생성하기 버튼을 클릭해주세요
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
