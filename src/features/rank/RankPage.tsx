"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface RankDetail {
  rank: number;
  matched: boolean;
  title: string;
  blog_name: string;
  href: string;
}

interface RankResult {
  rank: number | null;
  found: boolean;
  total_checked: number;
  message: string;
  details: RankDetail[];
}

interface BatchResultItem {
  keyword: string;
  target: string;
  rank: number | null;
  found: boolean;
  total_checked: number;
  details: RankDetail[];
  error: string | null;
}

interface RecentSearch {
  keyword: string;
  target: string;
  maxRank: number;
}

const RANK_OPTIONS = [5, 10, 15, 20];
const RECENT_KEY = "tduri_rank_recent";

export function RankPage() {
  // 모드: "single" | "batch"
  const [mode, setMode] = useState<"single" | "batch">("single");

  // ── 단일 모드 state ──
  const [keyword, setKeyword] = useState("");
  const [target, setTarget] = useState("");
  const [maxRank, setMaxRank] = useState(5);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<RankResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<RecentSearch[]>([]);
  const [volume, setVolume] = useState<{ pc: number; mobile: number } | null>(null);

  // ── 배치 모드 state ──
  const [batchKeywords, setBatchKeywords] = useState("");
  const [batchTarget, setBatchTarget] = useState("");
  const [batchMaxRank, setBatchMaxRank] = useState(10);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchResults, setBatchResults] = useState<BatchResultItem[]>([]);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [batchElapsed, setBatchElapsed] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(RECENT_KEY);
    if (saved) setRecent(JSON.parse(saved));
  }, []);

  const saveRecent = (kw: string, tgt: string, mr: number) => {
    const entry = { keyword: kw, target: tgt, maxRank: mr };
    const filtered = recent.filter((r) => !(r.keyword === kw && r.target === tgt));
    const updated = [entry, ...filtered].slice(0, 5);
    setRecent(updated);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  };

  // ── 단일 검색 ──
  const handleSearch = async (kw = keyword, tgt = target, mr = maxRank) => {
    if (!kw.trim() || !tgt.trim() || busy) return;
    setBusy(true);
    setKeyword(kw);
    setTarget(tgt);
    setMaxRank(mr);
    setLoading(true);
    setResult(null);
    setError(null);
    setVolume(null);

    try {
      const [rankRes, volRes] = await Promise.allSettled([
        api.post<RankResult>("/api/rank", { keyword: kw, target: tgt, max_rank: mr }),
        api.post<{ results: { pc: number; mobile: number }[] }>("/api/search-volume", { keywords: [kw] }),
      ]);

      if (rankRes.status === "rejected") throw new Error("백엔드 서버에 연결할 수 없습니다.");
      setResult(rankRes.value);
      saveRecent(kw, tgt, mr);

      if (volRes.status === "fulfilled") {
        const item = volRes.value?.results?.[0];
        if (item) setVolume({ pc: item.pc, mobile: item.mobile });
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "백엔드 서버에 연결할 수 없습니다.");
    } finally {
      setLoading(false);
      setBusy(false);
    }
  };

  // ── 배치 검색 ──
  const batchKeywordList = batchKeywords
    .split("\n")
    .map((k) => k.trim())
    .filter(Boolean)
    .slice(0, 200);

  const BATCH_CHUNK_SIZE = 20;

  // 청크 단위로 순차 요청하는 공통 함수
  const runBatchChunked = async (
    items: { keyword: string; target: string; max_rank: number }[],
    onChunkDone: (results: BatchResultItem[]) => void,
  ) => {
    for (let i = 0; i < items.length; i += BATCH_CHUNK_SIZE) {
      const chunk = items.slice(i, i + BATCH_CHUNK_SIZE);
      try {
        const data = await api.post<{ results: BatchResultItem[] }>(
          "/api/rank-batch",
          { items: chunk },
          90000, // 90초 per chunk (20개 × 최악 60s지만 보통 15~30s)
        );
        onChunkDone(data.results);
      } catch (e: unknown) {
        // 청크 자체가 실패하면 해당 항목들을 오류로 처리
        onChunkDone(
          chunk.map((item) => ({
            keyword: item.keyword,
            target: item.target,
            rank: null,
            found: false,
            total_checked: 0,
            details: [],
            error: e instanceof Error ? e.message : "오류",
          })),
        );
      }
      // 청크 간 랜덤 대기 (네이버 패턴 감지 방지)
      if (i + BATCH_CHUNK_SIZE < items.length) {
        await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200));
      }
    }
  };

  const handleBatchSearch = async () => {
    if (batchKeywordList.length === 0 || !batchTarget.trim() || batchLoading) return;
    setBatchLoading(true);
    setBatchResults([]);
    setBatchError(null);
    setBatchElapsed(null);
    const t0 = performance.now();

    const items = batchKeywordList.map((kw) => ({
      keyword: kw,
      target: batchTarget.trim(),
      max_rank: batchMaxRank,
    }));

    await runBatchChunked(items, (chunkResults) => {
      setBatchResults((prev) => [...prev, ...chunkResults]);
    });

    setBatchElapsed(Math.round((performance.now() - t0) / 100) / 10);
    setBatchLoading(false);
  };

  const matchedRanks = result?.details.filter((d) => d.matched) ?? [];
  const matchedRankNums = matchedRanks.map((d) => d.rank);

  const batchFound = batchResults.filter((r) => r.found);
  const batchNotFound = batchResults.filter((r) => !r.found && !r.error);
  const batchErrors = batchResults.filter((r) => r.error);

  return (
    <div>
      {/* 헤더 + 모드 토글 */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
            키워드 순위 검색
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            네이버 모바일 기준 실시간 블로그 순위를 확인하세요
          </p>
        </div>
        <div className="flex items-center gap-1 mt-1">
          {(["single", "batch"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: mode === m ? "var(--color-primary)" : "var(--color-bg)",
                color: mode === m ? "#fff" : "var(--color-text-secondary)",
                border: `1px solid ${mode === m ? "var(--color-primary)" : "var(--color-border)"}`,
              }}
            >
              {m === "single" ? "단일 검색" : "배치 검색"}
            </button>
          ))}
        </div>
      </div>

      {/* ─────────── 단일 검색 ─────────── */}
      {mode === "single" && (
        <>
          <div
            className="rounded-2xl p-4 md:p-6 mb-6"
            style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
                  검색 키워드
                </label>
                <input
                  type="text"
                  placeholder="예: 강남 맛집"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{
                    background: "var(--color-bg)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-primary)",
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
                  타겟 키워드 (블로그 제목에 포함된 단어)
                </label>
                <input
                  type="text"
                  placeholder="예: 단소상회"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{
                    background: "var(--color-bg)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-primary)",
                  }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
                  상위
                </span>
                <div className="flex gap-1">
                  {RANK_OPTIONS.map((n) => (
                    <button
                      key={n}
                      onClick={() => setMaxRank(n)}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                      style={{
                        background: maxRank === n ? "var(--color-primary)" : "var(--color-bg)",
                        color: maxRank === n ? "#fff" : "var(--color-text-secondary)",
                        border: `1px solid ${maxRank === n ? "var(--color-primary)" : "var(--color-border)"}`,
                      }}
                    >
                      {n}개
                    </button>
                  ))}
                </div>
                <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  까지 확인 · 광고 제외
                </span>
              </div>

              <button
                onClick={() => handleSearch()}
                disabled={busy || !keyword.trim() || !target.trim()}
                className="w-full md:w-auto md:ml-auto px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "var(--color-primary)" }}
              >
                {loading ? "검색 중..." : "순위 검색"}
              </button>
            </div>


            {recent.length > 0 && (
              <div className="flex items-center gap-2 mt-4 pt-4" style={{ borderTop: "1px solid var(--color-border)" }}>
                <span className="text-xs shrink-0" style={{ color: "var(--color-text-muted)" }}>최근</span>
                <div className="flex flex-wrap gap-1.5">
                  {recent.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => handleSearch(r.keyword, r.target, r.maxRank)}
                      disabled={busy}
                      className="px-2.5 py-1 rounded-lg text-xs disabled:opacity-50"
                      style={{
                        background: "var(--color-bg)",
                        border: "1px solid var(--color-border)",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      {r.keyword} / {r.target}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 단일 결과 */}
          <div
            className="rounded-2xl p-6"
            style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
          >
            {loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <div
                  className="w-8 h-8 rounded-full border-2 animate-spin mb-3"
                  style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }}
                />
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  네이버 블로그 크롤링 중... (약 5~10초 소요)
                </p>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-xl text-sm" style={{ background: "#FEF2F2", color: "var(--color-danger)" }}>
                {error}
              </div>
            )}

            {result && !loading && (
              <div className="space-y-5">
                <div
                  className="flex items-center gap-4 p-5 rounded-xl"
                  style={{
                    background: result.found ? "#F0FDF4" : "#FFF7ED",
                    border: `1px solid ${result.found ? "#BBF7D0" : "#FED7AA"}`,
                  }}
                >
                  <div className="flex gap-2 flex-wrap">
                    {result.found ? (
                      matchedRankNums.map((r) => (
                        <div
                          key={r}
                          className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                          style={{ background: "var(--color-success)" }}
                        >
                          {r}위
                        </div>
                      ))
                    ) : (
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                        style={{ background: "var(--color-warning)" }}
                      >
                        –
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-base font-semibold" style={{ color: result.found ? "#15803D" : "#92400E" }}>
                      {result.found ? `${matchedRankNums.join(", ")}위에 노출되고 있어요!` : "노출 없음"}
                    </p>
                    <p className="text-sm mt-0.5" style={{ color: result.found ? "#166534" : "#78350F" }}>
                      {`"${keyword}" 검색 상위 ${result.total_checked}개 기준 · 광고 제외`}
                    </p>
                    {volume && (
                      <p className="text-xs mt-1" style={{ color: result.found ? "#166534" : "#78350F", opacity: 0.8 }}>
                        월간 검색량 · PC {volume.pc.toLocaleString()} · MO {volume.mobile.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>
                    상세 결과
                  </p>
                  <div className="space-y-2">
                    {result.details.map((item) => (
                      <a
                        key={item.href}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-3 p-3 rounded-xl transition-colors block"
                        style={{
                          background: item.matched ? "#EFF6FF" : "var(--color-bg)",
                          border: `1px solid ${item.matched ? "#BFDBFE" : "var(--color-border)"}`,
                        }}
                      >
                        <span
                          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                          style={{
                            background: item.matched ? "var(--color-primary)" : "var(--color-border)",
                            color: item.matched ? "#fff" : "var(--color-text-muted)",
                          }}
                        >
                          {item.rank}
                        </span>
                        <div className="min-w-0">
                          <p
                            className="text-sm font-medium truncate"
                            style={{ color: item.matched ? "var(--color-primary)" : "var(--color-text-primary)" }}
                          >
                            {item.title}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                            {item.blog_name}
                            {item.matched && (
                              <span
                                className="ml-2 px-1.5 py-0.5 rounded text-xs font-bold"
                                style={{ background: "var(--color-primary)", color: "#fff" }}
                              >
                                타겟
                              </span>
                            )}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!loading && !result && !error && (
              <p className="text-sm text-center py-12" style={{ color: "var(--color-text-muted)" }}>
                검색어를 입력하고 순위 검색을 눌러주세요
              </p>
            )}
          </div>
        </>
      )}

      {/* ─────────── 배치 검색 ─────────── */}
      {mode === "batch" && (
        <>
          <div
            className="rounded-2xl p-4 md:p-6 mb-6"
            style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* 검색 키워드 목록 */}
              <div className="flex flex-col">
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
                  검색 키워드 목록
                  <span className="ml-2 text-xs font-normal" style={{ color: "var(--color-text-muted)" }}>
                    (한 줄에 하나씩 · 최대 200개)
                  </span>
                </label>
                <textarea
                  rows={8}
                  placeholder={"포항이동소고기\n포항한우\n포항소고기맛집\n포항정육식당\n..."}
                  value={batchKeywords}
                  onChange={(e) => setBatchKeywords(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl text-sm outline-none resize-none"
                  style={{
                    background: "var(--color-bg)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-primary)",
                    lineHeight: "1.8",
                  }}
                />
                <p className="text-xs mt-1.5" style={{ color: "var(--color-text-muted)" }}>
                  {batchKeywordList.length}개 입력됨
                </p>
              </div>

              {/* 타겟 + 설정 */}
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
                    타겟 키워드 (블로그 제목에 포함된 단어)
                  </label>
                  <input
                    type="text"
                    placeholder="예: 단소상회"
                    value={batchTarget}
                    onChange={(e) => setBatchTarget(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{
                      background: "var(--color-bg)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-text-primary)",
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
                    상위 몇 개까지
                  </label>
                  <div className="flex gap-1">
                    {RANK_OPTIONS.map((n) => (
                      <button
                        key={n}
                        onClick={() => setBatchMaxRank(n)}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                        style={{
                          background: batchMaxRank === n ? "var(--color-primary)" : "var(--color-bg)",
                          color: batchMaxRank === n ? "#fff" : "var(--color-text-secondary)",
                          border: `1px solid ${batchMaxRank === n ? "var(--color-primary)" : "var(--color-border)"}`,
                        }}
                      >
                        {n}개
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  className="rounded-xl p-3 text-xs"
                  style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
                >
                  <p className="font-semibold mb-1" style={{ color: "var(--color-text-secondary)" }}>배치 모드 속도</p>
                  <p>• 20개 동시 병렬 처리</p>
                  <p>• 94개 기준 약 10~15초 예상</p>
                  <p>• 광고 자동 제외</p>
                </div>

              </div>
            </div>

            <button
              onClick={handleBatchSearch}
              disabled={batchLoading || batchKeywordList.length === 0 || !batchTarget.trim()}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "var(--color-primary)" }}
            >
              {batchLoading
                ? `조회 중... ${batchResults.length > 0 ? `(${batchResults.length}/${batchKeywordList.length}개)` : ""}`
                : `${batchKeywordList.length}개 키워드 일괄 순위 검색`}
            </button>
          </div>

          {/* 배치 결과 */}
          <div
            className="rounded-2xl p-6"
            style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
          >
            {batchLoading && (
              <div className="flex flex-col items-center justify-center py-12">
                <div
                  className="w-8 h-8 rounded-full border-2 animate-spin mb-3"
                  style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }}
                />
                <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  {batchResults.length > 0
                    ? `${batchResults.length} / ${batchKeywordList.length}개 완료`
                    : `${batchKeywordList.length}개 크롤링 중...`}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                  20개씩 순차 처리 · 네이버 차단 방지 모드
                </p>
                {batchResults.length > 0 && (
                  <div className="mt-3 w-48 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.round((batchResults.length / batchKeywordList.length) * 100)}%`,
                        background: "var(--color-primary)",
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {batchError && (
              <div className="p-4 rounded-xl text-sm" style={{ background: "#FEF2F2", color: "var(--color-danger)" }}>
                {batchError}
              </div>
            )}

            {batchResults.length > 0 && !batchLoading && (
              <div className="space-y-4">
                {/* 요약 */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                    style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#15803D" }}>
                    ✅ 노출 {batchFound.length}개
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                    style={{ background: "#FFF7ED", border: "1px solid #FED7AA", color: "#92400E" }}>
                    ❌ 미노출 {batchNotFound.length}개
                  </div>
                  {batchErrors.length > 0 && (
                    <>
                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                        style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#991B1B" }}>
                        ⚠ 오류 {batchErrors.length}개
                      </div>
                      <button
                        onClick={async () => {
                          if (batchLoading) return;
                          setBatchLoading(true);
                          const t0 = performance.now();
                          const items = batchErrors.map((r) => ({
                            keyword: r.keyword,
                            target: r.target,
                            max_rank: batchMaxRank,
                          }));
                          await runBatchChunked(items, (chunkResults) => {
                            setBatchResults((prev) => {
                              const retryMap = new Map(chunkResults.map((r) => [r.keyword, r]));
                              return prev.map((r) => retryMap.get(r.keyword) ?? r);
                            });
                          });
                          setBatchElapsed(Math.round((performance.now() - t0) / 100) / 10);
                          setBatchLoading(false);
                        }}
                        disabled={batchLoading}
                        className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
                        style={{ background: "var(--color-primary)", color: "#fff" }}
                      >
                        {batchLoading ? "재시도 중..." : `↺ 오류 ${batchErrors.length}개 재시도`}
                      </button>
                    </>
                  )}
                  {batchElapsed !== null && (
                    <span className="text-xs ml-auto" style={{ color: "var(--color-text-muted)" }}>
                      소요 {batchElapsed}초
                    </span>
                  )}
                </div>

                {/* 테이블 */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                        <th className="text-left py-2 px-3 text-xs font-semibold" style={{ color: "var(--color-text-muted)", width: "40px" }}>결과</th>
                        <th className="text-left py-2 px-3 text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>검색 키워드</th>
                        <th className="text-center py-2 px-3 text-xs font-semibold" style={{ color: "var(--color-text-muted)", width: "80px" }}>순위</th>
                        <th className="text-center py-2 px-3 text-xs font-semibold" style={{ color: "var(--color-text-muted)", width: "80px" }}>확인범위</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchResults.map((item, i) => (
                        <tr
                          key={i}
                          style={{
                            borderBottom: "1px solid var(--color-border)",
                            background: item.found
                              ? "color-mix(in srgb, #22C55E 6%, transparent)"
                              : item.error
                              ? "color-mix(in srgb, #EF4444 4%, transparent)"
                              : "transparent",
                          }}
                        >
                          <td className="py-2.5 px-3 text-center">
                            <span>{item.error ? "⚠" : item.found ? "✅" : "❌"}</span>
                          </td>
                          <td className="py-2.5 px-3 font-medium">
                            <a
                              href={`https://m.search.naver.com/search.naver?ssc=tab.m_blog.all&query=${encodeURIComponent(item.keyword)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline"
                              style={{ color: "var(--color-primary)" }}
                            >
                              {item.keyword}
                            </a>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {item.error ? (
                              <span className="text-xs" style={{ color: "var(--color-danger)" }}>오류</span>
                            ) : item.found ? (
                              <span
                                className="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold text-white"
                                style={{ background: "var(--color-success)" }}
                              >
                                {item.rank}위
                              </span>
                            ) : (
                              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>–</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center text-xs" style={{ color: "var(--color-text-muted)" }}>
                            {item.total_checked > 0 ? `상위 ${item.total_checked}개` : "–"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {!batchLoading && batchResults.length === 0 && !batchError && (
              <p className="text-sm text-center py-12" style={{ color: "var(--color-text-muted)" }}>
                키워드 목록과 타겟을 입력하고 일괄 검색을 눌러주세요
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
