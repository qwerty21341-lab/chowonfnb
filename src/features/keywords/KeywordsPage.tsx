"use client";

import { useState } from "react";
import { api } from "@/lib/api";

interface VolumeResult {
  keyword: string;
  pc: number;
  mobile: number;
  total: number;
}

type SortMode = "desc" | "asc";

export function KeywordsPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<VolumeResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("desc");

  const keywords = input.split("\n").map((k) => k.trim()).filter(Boolean).slice(0, 5);

  const handleSearch = async () => {
    if (keywords.length === 0 || busy) return;
    setBusy(true);
    setLoading(true);
    setResults([]);
    setError(null);
    try {
      const data = await api.post<{ results: VolumeResult[] }>("/api/search-volume", { keywords });
      setResults(data.results);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "서버 연결 실패");
    } finally {
      setLoading(false);
      setBusy(false);
    }
  };

  const sortedResults = [...results].sort((a, b) =>
    sortMode === "asc" ? a.total - b.total : b.total - a.total
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
          월간 검색량
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          네이버 키워드 월간 PC/모바일 검색량 · 줄바꿈으로 구분 · 최대 5개
        </p>
      </div>

      {/* 입력 폼 */}
      <div
        className="rounded-2xl p-6 mb-6"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <div className="flex gap-4">
          <textarea
            placeholder={"키워드를 한 줄에 하나씩 입력하세요\n예:\n포항이동소고기\n단소상회\n강남맛집"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={8}
            className="flex-1 px-4 py-3 rounded-xl text-sm outline-none resize-none"
            style={{
              background: "var(--color-bg)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-primary)",
              lineHeight: "1.8",
            }}
          />
          <div className="flex flex-col justify-between shrink-0">
            <div className="text-xs text-right" style={{ color: "var(--color-text-muted)" }}>
              {keywords.length} / 5개
            </div>
            <div className="flex flex-col items-end gap-2">
              <button
                onClick={handleSearch}
                disabled={busy || keywords.length === 0}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "var(--color-primary)" }}
              >
                {loading ? "조회 중..." : "검색량\n조회"}
              </button>
              <p className="text-xs text-right" style={{ color: "var(--color-text-muted)" }}>
                ⚠ 공백 제외 후 동일 키워드는 1개로 출력
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 결과 */}
      <div
        className="rounded-2xl p-6"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        {loading && (
          <div className="flex items-center justify-center py-12 gap-3">
            <div
              className="w-6 h-6 rounded-full border-2 animate-spin"
              style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }}
            />
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>조회 중...</p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl text-sm" style={{ background: "#FEF2F2", color: "var(--color-danger)" }}>
            {error}
          </div>
        )}

        {results.length > 0 && !loading && (
          <div>
            <div className="grid gap-4 px-4 mb-2 items-center" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr" }}>
              <p className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>키워드</p>
              <p className="text-xs font-semibold text-right" style={{ color: "var(--color-text-muted)" }}>PC</p>
              <p className="text-xs font-semibold text-right" style={{ color: "var(--color-text-muted)" }}>모바일</p>
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>총합</span>
                <button
                  onClick={() => setSortMode((p) => p === "desc" ? "asc" : "desc")}
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{ color: "var(--color-primary)", border: "1px solid var(--color-primary)" }}
                >
                  {sortMode === "desc" ? "↓ 내림차" : "↑ 오름차"}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {sortedResults.map((r) => (
                <div
                  key={r.keyword}
                  className="rounded-xl px-4 py-3"
                  style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}
                >
                  <div className="grid gap-4 items-center" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr" }}>
                    <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                      {r.keyword}
                    </p>
                    <p className="text-sm text-right" style={{ color: "var(--color-text-secondary)" }}>
                      {r.pc.toLocaleString()}
                    </p>
                    <p className="text-sm text-right" style={{ color: "var(--color-text-secondary)" }}>
                      {r.mobile.toLocaleString()}
                    </p>
                    <p className="text-sm font-bold text-right" style={{ color: "var(--color-primary)" }}>
                      {r.total.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && !error && results.length === 0 && (
          <p className="text-sm text-center py-12" style={{ color: "var(--color-text-muted)" }}>
            키워드를 입력하고 조회해보세요
          </p>
        )}
      </div>
    </div>
  );
}
