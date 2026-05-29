"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export interface ContentGeneratorConfig {
  title: string;
  description: string;
  contentType: string;
  topicLabel: string;
  topicPlaceholder: string;
  extraLabel?: string;
  extraPlaceholder?: string;
  showFeatures?: boolean;
  platformColor?: string;
}

export function ContentGeneratorPage({ config }: { config: ContentGeneratorConfig }) {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("");
  const [features, setFeatures] = useState("");
  const [topic, setTopic] = useState("");
  const [extra, setExtra] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fillDummy = () => {
    setBusinessName("단소상회");
    setCategory("음식점");
    setFeatures("20년 경력 노포, 주차 가능, 당일 예약 가능, 단체석 보유");
    setTopic(config.topicPlaceholder.split("\n")[0] || "신메뉴 출시 홍보");
    if (config.extraPlaceholder) setExtra(config.extraPlaceholder.split("\n")[0] || "");
  };

  useEffect(() => {
    const s = localStorage.getItem("tduri_business");
    if (!s) return;
    try {
      const p = JSON.parse(s);
      if (p.name) { setBusinessName(p.name); setProfileLoaded(true); }
      if (p.category) setCategory(p.category);
      const parts: string[] = [];
      if (p.strengths) parts.push(p.strengths);
      if (p.services) parts.push(p.services);
      if (p.priceRange) parts.push(p.priceRange);
      if (p.hasParking) parts.push(p.parkingDetail ? `주차 가능 (${p.parkingDetail})` : "주차 가능");
      if (parts.length > 0) setFeatures(parts.join(", "));
    } catch {}
  }, []);

  const handleGenerate = async () => {
    if (!topic.trim() || busy) return;
    setBusy(true);
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const data = await api.post<{ result: string }>("/api/generate-content", {
        content_type: config.contentType,
        topic: topic.trim(),
        business_name: businessName,
        category,
        features,
        extra: extra.trim(),
      });
      setResult(data.result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "서버 연결 실패");
    } finally {
      setLoading(false);
      setBusy(false);
    }
  };

  const accentColor = config.platformColor ?? "var(--color-primary)";

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
              {config.title}
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              {config.description}
            </p>
          </div>
        </div>
        {profileLoaded ? (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
            style={{ background: `${accentColor}12`, border: `1px solid ${accentColor}30`, color: accentColor }}>
            <span>✓ 업체 설정에서 정보를 불러왔습니다</span>
            <button onClick={() => router.push("/todolist/settings/business")} className="ml-auto underline opacity-70">수정</button>
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
            style={{ background: "var(--color-border)", color: "var(--color-text-muted)" }}>
            <span>업체 정보를 미리 등록하면 매번 입력하지 않아도 돼요</span>
            <button onClick={() => router.push("/todolist/settings/business")} className="ml-auto underline">업체 설정</button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* 업체 정보 */}
        <div className="rounded-2xl p-6" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <p className="text-sm font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>업체 정보</p>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>업체명</p>
              <input
                type="text"
                placeholder="예: 단소상회"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
              />
            </div>
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>업종</p>
              <input
                type="text"
                placeholder="예: 미용실, 음식점"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
              />
            </div>
          </div>

          {config.showFeatures !== false && (
            <>
              <p className="text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>매장 특성 및 강점</p>
              <textarea
                rows={2}
                placeholder="예: 20년 경력, 주차 가능, 당일 예약 가능"
                value={features}
                onChange={(e) => setFeatures(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
              />
            </>
          )}
        </div>

        {/* 콘텐츠 입력 */}
        <div className="rounded-2xl p-6" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <p className="text-sm font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>콘텐츠 내용</p>

          <p className="text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{config.topicLabel}</p>
          <textarea
            rows={4}
            placeholder={config.topicPlaceholder}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none mb-3"
            style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
          />

          {config.extraLabel && (
            <>
              <p className="text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{config.extraLabel}</p>
              <textarea
                rows={3}
                placeholder={config.extraPlaceholder}
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none mb-3"
                style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
              />
            </>
          )}

          <button
            onClick={handleGenerate}
            disabled={busy || !topic.trim()}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
            style={{ background: accentColor }}
          >
            {loading ? "생성 중..." : "✦ 생성하기"}
          </button>
        </div>

        {/* 결과 */}
        <div className="rounded-2xl p-6" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <p className="text-sm font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>생성 결과</p>

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
            <div className="flex items-center justify-center h-32 rounded-xl text-sm"
              style={{ background: "var(--color-bg)", color: "var(--color-text-muted)" }}>
              내용을 입력하고 생성하기 버튼을 클릭해주세요
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
