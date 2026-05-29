"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface PlaceDetail {
  rank: number;
  name: string;
}

interface PlaceRankResult {
  rank: number | null;
  found: boolean;
  total_checked: number;
  message: string;
  details: PlaceDetail[];
}

interface RecentSearch {
  keyword: string;
  target: string;
  maxRank: number;
}

const RANK_OPTIONS = [5, 10, 15, 20];
const RECENT_KEY = "tduri_place_rank_recent";

export function PlaceRankPage() {
  const [keyword, setKeyword] = useState("");
  const [target, setTarget] = useState("");
  const [maxRank, setMaxRank] = useState(10);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PlaceRankResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<RecentSearch[]>([]);

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

  const handleSearch = async (kw = keyword, tgt = target, mr = maxRank) => {
    if (!kw.trim() || !tgt.trim() || busy) return;
    setBusy(true);
    setKeyword(kw);
    setTarget(tgt);
    setMaxRank(mr);
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const data = await api.post<PlaceRankResult>("/api/place-rank", {
        keyword: kw.trim(),
        target: tgt.trim(),
        max_rank: mr,
      });
      setResult(data);
      saveRecent(kw.trim(), tgt.trim(), mr);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "조회 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
      setBusy(false);
    }
  };

  const inputStyle = {
    background: "var(--color-bg)",
    border: "1px solid var(--color-border)",
    color: "var(--color-text-primary)",
  };

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>
          네이버 플레이스 순위 조회
        </h1>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          키워드로 검색했을 때 내 업체가 몇 위에 노출되는지 확인합니다
        </p>
      </div>

      {/* 입력 폼 */}
      <div
        className="rounded-2xl p-4 md:p-6 mb-6"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
                검색 키워드
              </label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="예) 강남 미용실, 홍대 카페"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
                내 업체명
              </label>
              <input
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="예) 헤어살롱 마이자"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={inputStyle}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>상위</span>
              <div className="flex gap-1">
                {RANK_OPTIONS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setMaxRank(n)}
                    className="px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                    style={
                      maxRank === n
                        ? { background: "var(--color-primary)", color: "#fff" }
                        : { background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }
                    }
                  >
                    {n}위
                  </button>
                ))}
              </div>
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>까지 조회</span>
            </div>
            <button
              onClick={() => handleSearch()}
              disabled={busy || !keyword.trim() || !target.trim()}
              className="w-full md:w-auto px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
              style={{ background: "var(--color-primary)" }}
            >
              {loading ? "조회 중..." : "순위 조회"}
            </button>
          </div>
        </div>
      </div>

      {/* 최근 검색 */}
      {recent.length > 0 && !loading && !result && (
        <div className="mb-6">
          <p className="text-xs font-medium mb-2" style={{ color: "var(--color-text-muted)" }}>최근 검색</p>
          <div className="flex flex-wrap gap-2">
            {recent.map((r, i) => (
              <button
                key={i}
                onClick={() => handleSearch(r.keyword, r.target, r.maxRank)}
                className="px-3 py-1.5 rounded-xl text-xs"
                style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}
              >
                {r.keyword} · {r.target}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 로딩 */}
      {loading && (
        <div
          className="rounded-2xl p-12 text-center"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3"
            style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }} />
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            네이버 플레이스 검색 결과를 확인하고 있습니다...
          </p>
        </div>
      )}

      {/* 에러 */}
      {error && (
        <div className="rounded-2xl p-5" style={{ background: "#FEF2F2", border: "1px solid #FCA5A5" }}>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* 결과 */}
      {result && !loading && (
        <div className="flex flex-col gap-4">
          {/* 순위 요약 */}
          <div
            className="rounded-2xl p-6 flex items-center gap-5"
            style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: result.found ? "var(--color-primary)" : "var(--color-bg)" }}
            >
              {result.found ? (
                <span className="text-white text-2xl font-bold">{result.rank}</span>
              ) : (
                <span className="text-2xl">—</span>
              )}
            </div>
            <div>
              <p className="text-base font-semibold mb-0.5" style={{ color: "var(--color-text-primary)" }}>
                {result.found ? `상위 ${result.rank}위 노출 중` : "노출 없음"}
              </p>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{result.message}</p>
            </div>
          </div>

          {/* 상위 업체 목록 */}
          {result.details.length > 0 && (
            <div
              className="rounded-2xl overflow-hidden"
              style={{ border: "1px solid var(--color-border)", background: "var(--color-surface)" }}
            >
              <div
                className="px-5 py-3 text-xs font-semibold grid"
                style={{
                  gridTemplateColumns: "48px 1fr",
                  background: "var(--color-bg)",
                  borderBottom: "1px solid var(--color-border)",
                  color: "var(--color-text-muted)",
                }}
              >
                <span>순위</span>
                <span>업체명</span>
              </div>
              {result.details.map((place, idx) => {
                const isTarget =
                  result.found && result.rank === place.rank;
                return (
                  <div
                    key={idx}
                    className="px-5 py-3 grid items-center text-sm"
                    style={{
                      gridTemplateColumns: "48px 1fr",
                      borderBottom: idx < result.details.length - 1 ? "1px solid var(--color-border)" : "none",
                      background: isTarget ? "color-mix(in srgb, var(--color-primary) 8%, transparent)" : "transparent",
                    }}
                  >
                    <span
                      className="font-semibold text-xs"
                      style={{ color: isTarget ? "var(--color-primary)" : "var(--color-text-muted)" }}
                    >
                      {place.rank}위
                    </span>
                    <span
                      className="font-medium"
                      style={{ color: isTarget ? "var(--color-primary)" : "var(--color-text-primary)" }}
                    >
                      {place.name}
                      {isTarget && (
                        <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full font-semibold"
                          style={{ background: "var(--color-primary)", color: "#fff" }}>
                          내 업체
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
