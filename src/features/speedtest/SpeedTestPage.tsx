"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";

interface PlaceItem {
  rank: number;
  name: string;
}

interface MethodResult {
  method: string;
  elapsed: number;
  places: PlaceItem[];
  found_rank: number | null;
  error: string | null;
}

interface SpeedTestResult {
  results: MethodResult[];
}

interface TrackedKeyword {
  id: string;
  keyword: string;
  target: string;
  maxRank: number;
  lastRanks?: Record<string, number | null>;
  lastChecked?: string;
  loading?: boolean;
  checked?: boolean;
  pc?: number | null;
  mobile?: number | null;
  groupId?: string;
}

type TestStatus = "pending" | "running" | "done" | "error";

interface KeywordTestResult {
  keyword: string;
  target: string;
  result: SpeedTestResult | null;
  error: string | null;
  totalMs: number | null;
  status: TestStatus;
}

const METHOD_LABELS: Record<string, { label: string; color: string }> = {
  naver_api:          { label: "① 네이버 API",    color: "#03C75A" },
  httpx_ssr:          { label: "② httpx SSR",     color: "#3B82F6" },
  playwright_v2:      { label: "③ PW (새 컨텍스트)", color: "#8B5CF6" },
  playwright_pooled:  { label: "④ PW (공유 컨텍스트)", color: "#F59E0B" },
  graphql:            { label: "⑤ GraphQL",       color: "#EF4444" },
};

const METHOD_KEYS = ["naver_api", "httpx_ssr", "playwright_v2", "playwright_pooled", "graphql"];

const inputStyle = {
  background: "var(--color-bg)",
  border: "1px solid var(--color-border)",
  color: "var(--color-text-primary)",
};

function getBestMethod(r: SpeedTestResult): MethodResult | null {
  const ok = r.results.filter(m => !m.error);
  if (!ok.length) return null;
  return ok.sort((a, b) => a.elapsed - b.elapsed)[0];
}

export function SpeedTestPage() {
  // ── 대시보드 키워드 ──────────────────────────────────────
  const [keywords, setKeywords] = useState<TrackedKeyword[]>([]);
  const [results, setResults] = useState<Map<string, KeywordTestResult>>(new Map());
  const [running, setRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const abortRef = useRef(false);

  // ── 단일 수동 테스트 ──────────────────────────────────────
  const [tab, setTab] = useState<"batch" | "manual">("batch");
  const [manualKeyword, setManualKeyword] = useState("포항이동소고기");
  const [manualTarget, setManualTarget] = useState("단소상회");
  const [manualMaxRank, setManualMaxRank] = useState(10);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualResult, setManualResult] = useState<SpeedTestResult | null>(null);
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualTotalMs, setManualTotalMs] = useState<number | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("tduri_keywords");
      if (!raw) return;
      const kws = JSON.parse(raw) as TrackedKeyword[];
      setKeywords(kws);
      const map = new Map<string, KeywordTestResult>();
      kws.forEach(k =>
        map.set(k.id, {
          keyword: k.keyword,
          target: k.target,
          result: null,
          error: null,
          totalMs: null,
          status: "pending",
        })
      );
      setResults(map);
    } catch {}
  }, []);

  // ── 전체 실행 ─────────────────────────────────────────────
  const runAll = async () => {
    if (running) return;
    setRunning(true);
    abortRef.current = false;

    for (let i = 0; i < keywords.length; i++) {
      if (abortRef.current) break;
      const kw = keywords[i];
      setCurrentIndex(i);

      setResults(prev => {
        const next = new Map(prev);
        next.set(kw.id, { ...next.get(kw.id)!, status: "running" });
        return next;
      });

      const t0 = Date.now();
      try {
        const data = await api.post<SpeedTestResult>("/api/place-rank-speedtest", {
          keyword: kw.keyword,
          target: kw.target,
          max_rank: kw.maxRank || 10,
        });
        setResults(prev => {
          const next = new Map(prev);
          next.set(kw.id, {
            keyword: kw.keyword,
            target: kw.target,
            result: data,
            error: null,
            totalMs: Date.now() - t0,
            status: "done",
          });
          return next;
        });
      } catch (e: unknown) {
        setResults(prev => {
          const next = new Map(prev);
          next.set(kw.id, {
            keyword: kw.keyword,
            target: kw.target,
            result: null,
            error: e instanceof Error ? e.message : "오류",
            totalMs: Date.now() - t0,
            status: "error",
          });
          return next;
        });
      }
    }

    setRunning(false);
    setCurrentIndex(-1);
  };

  const stopAll = () => { abortRef.current = true; };

  const resetAll = () => {
    const map = new Map<string, KeywordTestResult>();
    keywords.forEach(k =>
      map.set(k.id, {
        keyword: k.keyword,
        target: k.target,
        result: null,
        error: null,
        totalMs: null,
        status: "pending",
      })
    );
    setResults(map);
  };

  // ── 단일 수동 테스트 실행 ─────────────────────────────────
  const runManual = async () => {
    if (!manualKeyword.trim() || !manualTarget.trim() || manualLoading) return;
    setManualLoading(true);
    setManualResult(null);
    setManualError(null);
    setManualTotalMs(null);
    const t0 = Date.now();
    try {
      const data = await api.post<SpeedTestResult>("/api/place-rank-speedtest", {
        keyword: manualKeyword.trim(),
        target: manualTarget.trim(),
        max_rank: manualMaxRank,
      });
      setManualTotalMs(Date.now() - t0);
      setManualResult(data);
    } catch (e: unknown) {
      setManualError(e instanceof Error ? e.message : "오류 발생");
    } finally {
      setManualLoading(false);
    }
  };

  // ── 통계 ─────────────────────────────────────────────────
  const doneCount = [...results.values()].filter(r => r.status === "done").length;
  const errorCount = [...results.values()].filter(r => r.status === "error").length;
  const foundCount = [...results.values()].filter(
    r => r.result && getBestMethod(r.result)?.found_rank != null
  ).length;

  const methodWins = METHOD_KEYS.map(key => ({
    key,
    wins: [...results.values()].filter(r => {
      if (!r.result) return false;
      const best = getBestMethod(r.result);
      return best?.method === key;
    }).length,
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>
          플레이스 순위 수집 속도 테스트
        </h1>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          3가지 수집 방법(네이버 API · httpx SSR · Playwright)을 병렬 실행해 속도·정확도를 비교합니다
        </p>
      </div>

      {/* 탭 */}
      <div className="flex gap-2 mb-6">
        {[
          { key: "batch", label: `대시보드 키워드 일괄 (${keywords.length}개)` },
          { key: "manual", label: "단일 수동 테스트" },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as "batch" | "manual")}
            className="px-4 py-2 rounded-xl text-sm font-medium"
            style={
              tab === t.key
                ? { background: "var(--color-primary)", color: "#fff" }
                : { background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ══ 일괄 탭 ══════════════════════════════════════ */}
      {tab === "batch" && (
        <div>
          {keywords.length === 0 ? (
            <div className="rounded-2xl p-10 text-center" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                대시보드에 등록된 키워드가 없습니다. 먼저 대시보드에서 키워드를 추가해주세요.
              </p>
            </div>
          ) : (
            <>
              {/* 컨트롤 + 통계 */}
              <div className="rounded-2xl p-4 mb-4 flex flex-wrap items-center gap-4"
                style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                <div className="flex gap-2">
                  {!running ? (
                    <button onClick={runAll}
                      className="px-5 py-2 rounded-xl text-sm font-semibold text-white"
                      style={{ background: "var(--color-primary)" }}>
                      ▶ 전체 실행 ({keywords.length}개)
                    </button>
                  ) : (
                    <button onClick={stopAll}
                      className="px-5 py-2 rounded-xl text-sm font-semibold text-white"
                      style={{ background: "#EF4444" }}>
                      ■ 중지
                    </button>
                  )}
                  <button onClick={resetAll} disabled={running}
                    className="px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-40"
                    style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}>
                    초기화
                  </button>
                </div>

                {/* 진행률 */}
                {(running || doneCount + errorCount > 0) && (
                  <div className="flex-1 min-w-48">
                    <div className="flex justify-between text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
                      <span>{running ? `실행 중... (${currentIndex + 1} / ${keywords.length})` : "완료"}</span>
                      <span>{doneCount + errorCount} / {keywords.length}</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${((doneCount + errorCount) / keywords.length) * 100}%`, background: "var(--color-primary)" }} />
                    </div>
                  </div>
                )}

                {/* 요약 통계 */}
                {doneCount + errorCount > 0 && (
                  <div className="flex gap-4 text-xs ml-auto">
                    <span style={{ color: "#10B981" }}>완료 {doneCount}</span>
                    <span style={{ color: "#EF4444" }}>실패 {errorCount}</span>
                    <span style={{ color: "var(--color-primary)" }}>발견 {foundCount}</span>
                    {methodWins.map(w => w.wins > 0 && (
                      <span key={w.key} style={{ color: METHOD_LABELS[w.key]?.color }}>
                        {METHOD_LABELS[w.key]?.label} 승 {w.wins}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 키워드 결과 테이블 */}
              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--color-border)" }}>
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: "var(--color-bg)", borderBottom: "1px solid var(--color-border)" }}>
                      <th className="px-3 py-2.5 text-left font-semibold w-6" style={{ color: "var(--color-text-muted)" }}>#</th>
                      <th className="px-3 py-2.5 text-left font-semibold" style={{ color: "var(--color-text-muted)" }}>키워드</th>
                      <th className="px-3 py-2.5 text-left font-semibold" style={{ color: "var(--color-text-muted)" }}>업체</th>
                      <th className="px-3 py-2.5 text-center font-semibold w-12" style={{ color: "var(--color-text-muted)" }}>상위</th>
                      {METHOD_KEYS.map(mkey => (
                        <th key={mkey} className="px-3 py-2.5 text-center font-semibold" style={{ color: METHOD_LABELS[mkey].color }}>
                          {METHOD_LABELS[mkey].label.split(" ")[0]}
                          <span className="block text-xs font-normal opacity-60">순위 / 속도</span>
                        </th>
                      ))}
                      <th className="px-3 py-2.5 text-center font-semibold w-14" style={{ color: "var(--color-text-muted)" }}>대기</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keywords.map((kw, i) => {
                      const res = results.get(kw.id);
                      const status = res?.status ?? "pending";
                      const best = res?.result ? getBestMethod(res.result) : null;
                      const isRunning = status === "running";

                      return (
                        <tr key={kw.id}
                          style={{
                            borderBottom: "1px solid var(--color-border)",
                            background: isRunning ? "var(--color-primary)08" : "var(--color-surface)",
                          }}>
                          <td className="px-3 py-2.5 text-center" style={{ color: "var(--color-text-muted)" }}>{i + 1}</td>
                          <td className="px-3 py-2.5 font-medium" style={{ color: "var(--color-text-primary)" }}>{kw.keyword}</td>
                          <td className="px-3 py-2.5" style={{ color: "var(--color-text-secondary)" }}>{kw.target}</td>
                          <td className="px-3 py-2.5 text-center" style={{ color: "var(--color-text-muted)" }}>{kw.maxRank ?? 10}위</td>

                          {METHOD_KEYS.map(mkey => {
                            const m = res?.result?.results.find(r => r.method === mkey);
                            const color = METHOD_LABELS[mkey]?.color ?? "#888";
                            const isFastest = best?.method === mkey;

                            if (!res || status === "pending") {
                              return (
                                <td key={mkey} className="px-2 py-2.5 text-center" style={{ color: "var(--color-text-muted)" }}>—</td>
                              );
                            }
                            if (isRunning) {
                              return (
                                <td key={mkey} className="px-2 py-2.5 text-center">
                                  <div className="w-3 h-3 border border-t-transparent rounded-full animate-spin mx-auto"
                                    style={{ borderColor: color, borderTopColor: "transparent" }} />
                                </td>
                              );
                            }
                            if (status === "error" || !m) {
                              return <td key={mkey} className="px-2 py-2.5 text-center" style={{ color: "#EF4444" }}>실패</td>;
                            }
                            if (m.error) {
                              return <td key={mkey} className="px-2 py-2.5 text-center" style={{ color: "#EF4444" }}>오류</td>;
                            }

                            return (
                              <td key={mkey} className="px-2 py-2"
                                style={{
                                  background: isFastest ? `${color}18` : "transparent",
                                  borderLeft: `2px solid ${isFastest ? color : "transparent"}`,
                                }}>
                                <div className="flex flex-col items-center gap-0.5">
                                  {/* 네이버 플레이스 순위 */}
                                  {m.found_rank ? (
                                    <span className="font-bold leading-none"
                                      style={{ fontSize: 14, color }}>
                                      {m.found_rank}위
                                    </span>
                                  ) : (
                                    <span className="leading-none" style={{ fontSize: 11, color: "var(--color-text-muted)" }}>미발견</span>
                                  )}
                                  {/* 수집 속도 */}
                                  <span style={{
                                    fontSize: 10,
                                    color: isFastest ? color : "var(--color-text-muted)",
                                    fontWeight: isFastest ? 600 : 400,
                                  }}>
                                    {isFastest && "⚡"}{m.elapsed}s
                                  </span>
                                </div>
                              </td>
                            );
                          })}

                          <td className="px-3 py-2.5 text-center" style={{ color: "var(--color-text-muted)", fontSize: 11 }}>
                            {res?.totalMs != null ? `${(res.totalMs / 1000).toFixed(1)}s` : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══ 수동 탭 ══════════════════════════════════════ */}
      {tab === "manual" && (
        <div>
          {/* 입력 */}
          <div className="rounded-2xl p-5 mb-6" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>검색 키워드</label>
                <input
                  type="text" value={manualKeyword}
                  onChange={e => setManualKeyword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && runManual()}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>업체명</label>
                <input
                  type="text" value={manualTarget}
                  onChange={e => setManualTarget(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && runManual()}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle}
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>상위</span>
                {[5, 10, 20].map(n => (
                  <button key={n} onClick={() => setManualMaxRank(n)}
                    className="px-3 py-1 rounded-lg text-xs font-medium"
                    style={manualMaxRank === n
                      ? { background: "var(--color-primary)", color: "#fff" }
                      : { background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}>
                    {n}위
                  </button>
                ))}
                <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>까지</span>
              </div>
              <button onClick={runManual} disabled={manualLoading || !manualKeyword.trim() || !manualTarget.trim()}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "var(--color-primary)" }}>
                {manualLoading ? "테스트 중..." : "▶ 테스트 실행"}
              </button>
            </div>
          </div>

          {/* 로딩 */}
          {manualLoading && (
            <div className="rounded-2xl p-10 text-center mb-6" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
              <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3"
                style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }} />
              <p className="text-sm font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>3가지 방법 병렬 실행 중...</p>
            </div>
          )}

          {/* 에러 */}
          {manualError && (
            <div className="rounded-2xl p-4 mb-6" style={{ background: "#FEF2F2", border: "1px solid #FCA5A5" }}>
              <p className="text-sm text-red-600">{manualError}</p>
            </div>
          )}

          {/* 결과 */}
          {manualResult && !manualLoading && (
            <div className="flex flex-col gap-4">
              {/* 요약 */}
              <div className="rounded-2xl p-4 flex items-center gap-4"
                style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                <div className="flex-1">
                  <p className="text-xs mb-0.5" style={{ color: "var(--color-text-muted)" }}>전체 실행 시간 (병렬)</p>
                  <p className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
                    {manualTotalMs != null ? `${(manualTotalMs / 1000).toFixed(1)}초` : "-"}
                  </p>
                </div>
                {(() => {
                  const best = getBestMethod(manualResult);
                  return best ? (
                    <div className="text-right">
                      <p className="text-xs mb-0.5" style={{ color: "var(--color-text-muted)" }}>가장 빠른 방법</p>
                      <p className="text-sm font-bold" style={{ color: METHOD_LABELS[best.method]?.color }}>
                        {METHOD_LABELS[best.method]?.label ?? best.method}
                      </p>
                      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{best.elapsed}초</p>
                    </div>
                  ) : null;
                })()}
              </div>

              {/* 방법별 카드 */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {manualResult.results.map(r => {
                  const meta = METHOD_LABELS[r.method] ?? { label: r.method, color: "#888" };
                  const best = getBestMethod(manualResult);
                  const isBest = best?.method === r.method;
                  return (
                    <div key={r.method} className="rounded-2xl overflow-hidden"
                      style={{ border: `2px solid ${isBest ? meta.color : "var(--color-border)"}`, background: "var(--color-surface)" }}>
                      <div className="px-4 py-3" style={{ background: isBest ? `${meta.color}15` : "var(--color-bg)" }}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-sm font-bold" style={{ color: meta.color }}>{meta.label}</span>
                          {isBest && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold text-white" style={{ background: meta.color }}>최속</span>
                          )}
                        </div>
                      </div>
                      <div className="px-4 py-3 grid grid-cols-3 gap-2 text-center"
                        style={{ borderBottom: "1px solid var(--color-border)" }}>
                        <div>
                          <p className="text-xs mb-0.5" style={{ color: "var(--color-text-muted)" }}>소요시간</p>
                          <p className="text-base font-bold" style={{ color: r.error ? "#EF4444" : meta.color }}>
                            {r.error ? "실패" : `${r.elapsed}s`}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs mb-0.5" style={{ color: "var(--color-text-muted)" }}>수집 수</p>
                          <p className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>{r.places.length}개</p>
                        </div>
                        <div>
                          <p className="text-xs mb-0.5" style={{ color: "var(--color-text-muted)" }}>업체 순위</p>
                          <p className="text-base font-bold" style={{ color: r.found_rank ? meta.color : "var(--color-text-muted)" }}>
                            {r.found_rank ? `${r.found_rank}위` : "없음"}
                          </p>
                        </div>
                      </div>
                      {r.error && (
                        <div className="px-4 py-3">
                          <p className="text-xs text-red-500 break-all">{r.error}</p>
                        </div>
                      )}
                      {!r.error && r.places.length > 0 && (
                        <div className="px-4 py-2 max-h-48 overflow-y-auto">
                          {r.places.map(p => {
                            const isTarget = r.found_rank === p.rank;
                            return (
                              <div key={p.rank} className="flex items-center gap-2 py-1"
                                style={{ borderBottom: "1px solid var(--color-border)" }}>
                                <span className="text-xs font-semibold w-6 shrink-0 text-right"
                                  style={{ color: isTarget ? meta.color : "var(--color-text-muted)" }}>{p.rank}</span>
                                <span className="text-xs flex-1 truncate"
                                  style={{ color: isTarget ? meta.color : "var(--color-text-primary)", fontWeight: isTarget ? 700 : 400 }}>
                                  {p.name}
                                  {isTarget && (
                                    <span className="ml-1 text-xs px-1 py-0.5 rounded font-semibold text-white"
                                      style={{ background: meta.color }}>내 업체</span>
                                  )}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
