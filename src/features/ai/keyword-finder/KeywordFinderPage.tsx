"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface KeywordResult {
  keyword: string;
  pc: number;
  mobile: number;
  total: number;
  competition: string;
}

type SortKey = "total" | "pc" | "mobile";

const COMPETITION_LABEL: Record<string, { label: string; color: string }> = {
  low:    { label: "낮음", color: "#22C55E" },
  medium: { label: "보통", color: "#F59E0B" },
  high:   { label: "높음", color: "#EF4444" },
};

function CompBadge({ val }: { val: string }) {
  const info = COMPETITION_LABEL[val] ?? { label: val || "-", color: "var(--color-text-muted)" };
  return (
    <span className="text-xs font-medium" style={{ color: info.color }}>
      {info.label}
    </span>
  );
}

function VolumeBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 rounded-full overflow-hidden" style={{ height: 4, background: "var(--color-border)" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--color-primary)" }} />
      </div>
      <span className="text-sm font-medium w-16 text-right" style={{ color: "var(--color-text-primary)" }}>
        {value.toLocaleString()}
      </span>
    </div>
  );
}

type Tab = "related" | "best";

interface BestKeyword {
  keyword: string;
  reason: string;
  pc: number;
  mobile: number;
  total: number;
  competition: string;
}

const SAMPLE_WORD: BestKeyword[] = [
  { keyword: "한우 갈비찜",      reason: "대표 메뉴 직접 노출 — 방문 의향 고객이 많이 검색",    pc: 1200, mobile: 8400,  total: 9600,  competition: "medium" },
  { keyword: "이동갈비 한식당",  reason: "업종+메뉴 조합 — 경쟁도 대비 검색량 균형이 좋음",    pc: 2100, mobile: 11200, total: 13300, competition: "high"   },
  { keyword: "점심특선 한정식",  reason: "점심 수요 + 메뉴 특화 — 경쟁 적고 전환율 높음",      pc: 340,  mobile: 2800,  total: 3140,  competition: "low"    },
  { keyword: "갈비찜 소고기",    reason: "메뉴 구체화 — 근거리 고객 공략에 적합",              pc: 180,  mobile: 1560,  total: 1740,  competition: "low"    },
  { keyword: "가족 외식 한식당", reason: "가족 단위 방문 유도 — 리뷰·블로그와 시너지 기대",    pc: 890,  mobile: 5600,  total: 6490,  competition: "medium" },
  { keyword: "소고기 한식당",    reason: "업종+식재료 조합 — 폭넓은 검색 수요 커버",           pc: 620,  mobile: 4100,  total: 4720,  competition: "medium" },
  { keyword: "갈비찜 한정식",    reason: "메뉴+업종 묶음 — 고급 한식 수요 공략",               pc: 290,  mobile: 2100,  total: 2390,  competition: "low"    },
  { keyword: "저녁 한우 코스",   reason: "시간대+메뉴 조합 — 특별한 저녁 식사 수요",           pc: 150,  mobile: 1200,  total: 1350,  competition: "low"    },
  { keyword: "한우 모둠구이",    reason: "구이류 세부화 — 구이 전문 수요 직접 노출",            pc: 410,  mobile: 3300,  total: 3710,  competition: "low"    },
  { keyword: "단체 한식 식당",   reason: "단체+업종 조합 — 회식·모임 수요 광범위 커버",         pc: 730,  mobile: 5200,  total: 5930,  competition: "medium" },
];
const SAMPLE_SENTENCE: BestKeyword[] = [
  { keyword: "단체회식하기좋은소고기집",  reason: "상황+업종 조합 — 회식 수요 고객이 자연어로 검색",    pc: 980,  mobile: 6200,  total: 7180,  competition: "medium" },
  { keyword: "주차되는갈비집",           reason: "시설 특징 — 주차 편의를 중시하는 고객 공략",          pc: 540,  mobile: 3800,  total: 4340,  competition: "low"    },
  { keyword: "룸있는한식당",             reason: "프라이빗 공간 수요 — 가족·소모임 고객 유입",           pc: 720,  mobile: 5100,  total: 5820,  competition: "medium" },
  { keyword: "점심특선있는고기집",       reason: "가격·시간대 특화 — 직장인 점심 수요 겨냥",             pc: 310,  mobile: 2400,  total: 2710,  competition: "low"    },
  { keyword: "돌잔치할수있는식당",       reason: "이벤트 키워드 — 경쟁 적고 예약 전환율 높음",           pc: 420,  mobile: 3100,  total: 3520,  competition: "low"    },
  { keyword: "어른생신하기좋은한식당",   reason: "어른 생신 이벤트 수요 — 고객 전환율 높은 롱테일",      pc: 190,  mobile: 1600,  total: 1790,  competition: "low"    },
  { keyword: "소고기코스요리되는식당",   reason: "코스 메뉴 수요 직접 공략 — 단가 높은 고객 유입",       pc: 260,  mobile: 2000,  total: 2260,  competition: "low"    },
  { keyword: "고기무한리필한식당",       reason: "가성비 수요 — 검색량 높고 클릭 전환 강함",             pc: 870,  mobile: 6800,  total: 7670,  competition: "medium" },
  { keyword: "예약가능한한우집",         reason: "예약 편의 강조 — 특별 방문 고객 선점 가능",            pc: 330,  mobile: 2700,  total: 3030,  competition: "low"    },
  { keyword: "아이랑가기좋은고기집",     reason: "패밀리 수요 — 가족 단위 방문 고객 직접 공략",          pc: 450,  mobile: 3500,  total: 3950,  competition: "low"    },
];

function BestKeywordTab() {
  const [profile, setProfile] = useState<{ name: string; category: string; features: string; location: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [keywords, setKeywords] = useState<BestKeyword[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showSample, setShowSample] = useState(false);
  const [useWord, setUseWord] = useState(true);
  const [useSentence, setUseSentence] = useState(false);
  const [useLocation, setUseLocation] = useState(false);
  const [locationInput, setLocationInput] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [addedToDash, setAddedToDash] = useState(false);
  const [bestSort, setBestSort] = useState<"default" | "total" | "competition">("default");
  const [bestSortDir, setBestSortDir] = useState<Record<"total" | "competition", "asc" | "desc">>({ total: "desc", competition: "asc" });

  useEffect(() => {
    try {
      const s = localStorage.getItem("tduri_business");
      if (!s) return;
      const p = JSON.parse(s);
      const parts: string[] = [];
      if (p.strengths) parts.push(p.strengths);
      if (p.services)  parts.push(p.services);
      if (p.priceRange) parts.push(p.priceRange);
      setProfile({
        name: p.name || "",
        category: p.category || "",
        features: parts.join(", "),
        location: p.location || "",
      });
      if (p.location) setLocationInput(p.location);
    } catch {}
  }, []);

  const handleAnalyze = async () => {
    if (busy) return;
    setBusy(true);
    setLoading(true);
    setError(null);
    setKeywords([]);
    setSelected(new Set());
    const style = useWord && useSentence ? "both" : useSentence ? "sentence" : "word";
    try {
      const data = await api.post<{ keywords: BestKeyword[] }>("/api/best-keywords", { ...(profile ?? {}), style, use_location: useLocation, location: locationInput });
      setKeywords(data.keywords);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "서버 연결 실패");
    } finally {
      setLoading(false);
      setBusy(false);
    }
  };

  const toggleSelect = (kw: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(kw)) next.delete(kw); else next.add(kw);
      return next;
    });
  };

  const handleCopySelected = async () => {
    const text = [...selected].join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddToDashboard = () => {
    const target = profile?.name || "";
    const saved = localStorage.getItem("tduri_keywords");
    const existing: { keyword: string }[] = saved ? JSON.parse(saved) : [];
    const existingSet = new Set(existing.map((k) => k.keyword));
    const newItems = [...selected]
      .filter((kw) => !existingSet.has(kw))
      .map((kw, i) => ({
        id: (Date.now() + i).toString(),
        keyword: kw,
        target,
        maxRank: 20,
        lastRanks: [],
        lastChecked: null,
        loading: false,
        checked: false,
      }));
    localStorage.setItem("tduri_keywords", JSON.stringify([...existing, ...newItems]));
    setAddedToDash(true);
    setTimeout(() => setAddedToDash(false), 2000);
  };

  const sampleData = useSentence && !useWord ? SAMPLE_SENTENCE
    : useWord && !useSentence ? SAMPLE_WORD
    : [...SAMPLE_WORD, ...SAMPLE_SENTENCE];

  const COMP_ORDER: Record<string, number> = { low: 0, medium: 1, high: 2 };
  const sortList = (list: BestKeyword[]) => {
    if (bestSort === "total") {
      return [...list].sort((a, b) => bestSortDir.total === "desc" ? b.total - a.total : a.total - b.total);
    }
    if (bestSort === "competition") {
      return [...list].sort((a, b) => {
        const diff = (COMP_ORDER[a.competition] ?? 9) - (COMP_ORDER[b.competition] ?? 9);
        return bestSortDir.competition === "asc" ? diff : -diff;
      });
    }
    return list;
  };

  const handleBestSort = (key: "total" | "competition") => {
    if (bestSort === key) {
      setBestSortDir((prev) => ({ ...prev, [key]: prev[key] === "desc" ? "asc" : "desc" }));
    } else {
      setBestSort(key);
    }
  };

  const displayed = sortList(showSample ? sampleData : keywords);
  const maxTotal  = displayed.reduce((m, k) => Math.max(m, k.total), 0);

  return (
    <div className="space-y-4">
      {/* 업체 정보 카드 */}
      <div className="rounded-2xl p-5" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <p className="text-xs font-semibold mb-3" style={{ color: "var(--color-text-muted)" }}>분석에 사용되는 매장 정보</p>
        {profile ? (
          <div className="space-y-1.5">
            {[
              { label: "업체명",  value: profile.name },
              { label: "업종",    value: profile.category },
              { label: "특징",    value: profile.features },
            ].map(({ label, value }) => value ? (
              <div key={label} className="flex gap-3 text-sm">
                <span className="shrink-0 w-12" style={{ color: "var(--color-text-muted)" }}>{label}</span>
                <span style={{ color: "var(--color-text-primary)" }}>{value}</span>
              </div>
            ) : null)}
          </div>
        ) : (
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            업체 설정에서 매장 정보를 입력하면 더 정확한 키워드를 추천받을 수 있어요
          </p>
        )}
        {/* 키워드 유형 선택 */}
        <div className="flex flex-wrap gap-4 mt-4 mb-3">
          {[
            { key: "word",     label: "단어형",   sub: "한우갈비찜",              val: useWord,        set: setUseWord },
            { key: "sentence", label: "문장형",   sub: "단체회식하기좋은고기집",  val: useSentence,    set: setUseSentence },
          ].map(({ key, label, sub, val, set }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
              <div
                onClick={() => set((v) => !v)}
                className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                style={{
                  background: val ? "var(--color-primary)" : "transparent",
                  border: `1.5px solid ${val ? "var(--color-primary)" : "var(--color-border)"}`,
                }}
              >
                {val && <span className="text-white text-[10px] font-bold leading-none">✓</span>}
              </div>
              <div>
                <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{label}</span>
                <span className="text-xs ml-1.5" style={{ color: "var(--color-text-muted)" }}>{sub}</span>
              </div>
            </label>
          ))}
          {/* 지역명 포함 */}
          <div className="flex items-center gap-2">
            <div
              onClick={() => setUseLocation((v) => !v)}
              className="w-4 h-4 rounded flex items-center justify-center shrink-0 cursor-pointer"
              style={{
                background: useLocation ? "var(--color-primary)" : "transparent",
                border: `1.5px solid ${useLocation ? "var(--color-primary)" : "var(--color-border)"}`,
              }}
            >
              {useLocation && <span className="text-white text-[10px] font-bold leading-none">✓</span>}
            </div>
            <span className="text-sm font-medium cursor-pointer select-none" onClick={() => setUseLocation((v) => !v)} style={{ color: "var(--color-text-primary)" }}>지역명 포함</span>
            <input
              type="text"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && useLocation && keywords.length > 0 && handleAnalyze()}
              disabled={!useLocation}
              placeholder="예: 포항, 이동"
              className="text-sm px-3 py-1.5 rounded-lg"
              style={{
                background: useLocation ? "var(--color-bg)" : "var(--color-surface)",
                border: `1px solid ${useLocation ? "var(--color-border)" : "color-mix(in srgb, var(--color-border) 40%, transparent)"}`,
                color: useLocation ? "var(--color-text-primary)" : "var(--color-text-muted)",
                outline: "none",
                width: 130,
                opacity: useLocation ? 1 : 0.5,
              }}
            />
            {useLocation && (
              <button
                onClick={handleAnalyze}
                disabled={busy || (!useWord && !useSentence)}
                className="text-xs px-2.5 py-1.5 rounded-lg font-medium"
                style={{
                  background: "var(--color-primary)",
                  color: "#fff",
                  opacity: loading || (!useWord && !useSentence) ? 0.5 : 1,
                  whiteSpace: "nowrap",
                }}
              >
                {loading ? "..." : "적용"}
              </button>
            )}
          </div>
        </div>
        <p className="text-xs mb-3" style={{ color: "var(--color-text-muted)" }}>
          경쟁도: <span style={{ color: "#22C55E" }}>낮음</span> 등록 시 상위 노출 유리 &nbsp;·&nbsp; <span style={{ color: "#F59E0B" }}>보통</span> 검색량과 균형 확인 &nbsp;·&nbsp; <span style={{ color: "#EF4444" }}>높음</span> 경쟁자 많아 노출 어려울 수 있음
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleAnalyze}
            disabled={loading || (!useWord && !useSentence)}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "var(--color-primary)" }}
          >
            {loading ? "분석 중..." : "대표키워드 분석"}
          </button>
          <button
            onClick={() => { setShowSample((v) => !v); setKeywords([]); setError(null); }}
            className="px-4 py-2.5 rounded-xl text-sm"
            style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
          >
            {showSample ? "샘플 닫기" : "샘플 보기"}
          </button>
        </div>
      </div>

      {/* 로딩 */}
      {loading && (
        <div className="rounded-2xl p-10 flex items-center justify-center gap-3"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <div className="w-5 h-5 rounded-full border-2 animate-spin"
            style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }} />
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>AI가 매장 정보를 분석 중입니다...</p>
        </div>
      )}

      {/* 에러 */}
      {error && (
        <div className="p-4 rounded-xl text-sm" style={{ background: "#FEF2F2", color: "#EF4444" }}>{error}</div>
      )}

      {/* 결과 */}
      {!loading && displayed.length > 0 && (
        <div className="rounded-2xl p-6" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          {/* 상단 바: 샘플 안내 + 정렬 버튼 */}
          <div className="flex items-center justify-between gap-2 mb-4">
            {showSample ? (
              <div className="flex-1 px-3 py-2 rounded-lg"
                style={{ background: "var(--color-primary)" + "12", border: "1px solid var(--color-primary)" + "30" }}>
                <span className="text-xs" style={{ color: "var(--color-primary)" }}>
                  ✦ 샘플 데이터입니다 — 실제 분석 버튼을 누르면 내 매장 맞춤 키워드가 나옵니다
                </span>
              </div>
            ) : (
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                총 {displayed.length}개
              </span>
            )}
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => setBestSort("default")}
                className="text-xs px-2.5 py-1 rounded-lg"
                style={{
                  background: bestSort === "default" ? "var(--color-primary)" : "transparent",
                  color: bestSort === "default" ? "#fff" : "var(--color-text-muted)",
                  border: `1px solid ${bestSort === "default" ? "var(--color-primary)" : "var(--color-border)"}`,
                }}
              >
                기본
              </button>
              {(["total", "competition"] as const).map((key) => {
                const active = bestSort === key;
                const label = key === "total" ? "검색량" : "경쟁도";
                const dir = bestSortDir[key];
                const arrow = active ? (dir === "desc" ? " ↓" : " ↑") : "";
                return (
                  <button
                    key={key}
                    onClick={() => handleBestSort(key)}
                    className="text-xs px-2.5 py-1 rounded-lg"
                    style={{
                      background: active ? "var(--color-primary)" : "transparent",
                      color: active ? "#fff" : "var(--color-text-muted)",
                      border: `1px solid ${active ? "var(--color-primary)" : "var(--color-border)"}`,
                    }}
                  >
                    {label}{arrow}
                  </button>
                );
              })}
            </div>
          </div>
          {/* 선택 요약 바 */}
          {!showSample && selected.size > 0 && (
            <div className="flex items-center justify-between mb-3 px-3 py-2 rounded-lg"
              style={{ background: "var(--color-primary)" + "15", border: "1px solid var(--color-primary)" + "40" }}>
              <span className="text-xs font-medium" style={{ color: "var(--color-primary)" }}>
                {selected.size}개 선택됨
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleAddToDashboard}
                  className="text-xs px-3 py-1 rounded-lg font-semibold"
                  style={{ background: "var(--color-bg)", border: "1px solid var(--color-primary)", color: "var(--color-primary)" }}
                >
                  {addedToDash ? "추가됨 ✓" : "대시보드에 추가"}
                </button>
                <button
                  onClick={handleCopySelected}
                  className="text-xs px-3 py-1 rounded-lg font-semibold"
                  style={{ background: "var(--color-primary)", color: "#fff" }}
                >
                  {copied ? "복사됨 ✓" : "선택 복사"}
                </button>
              </div>
            </div>
          )}
          <div className="space-y-3">
            {displayed.map((k, i) => {
              const isSelected = selected.has(k.keyword);
              return (
                <div
                  key={k.keyword}
                  className="rounded-xl p-4 cursor-pointer"
                  onClick={() => !showSample && toggleSelect(k.keyword)}
                  style={{
                    background: isSelected && !showSample ? "var(--color-primary)" + "10" : "var(--color-bg)",
                    border: `1px solid ${isSelected && !showSample ? "var(--color-primary)" + "60" : "var(--color-border)"}`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-bold mt-0.5 shrink-0 w-5 text-center"
                      style={{ color: "var(--color-primary)" }}>
                      {i + 1}
                    </span>
                    {/* 선택 체크박스 (실제 결과일 때만) */}
                    {!showSample && (
                      <div
                        className="w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5"
                        style={{
                          background: isSelected ? "var(--color-primary)" : "transparent",
                          border: `1.5px solid ${isSelected ? "var(--color-primary)" : "var(--color-border)"}`,
                        }}
                      >
                        {isSelected && <span className="text-white text-[10px] font-bold leading-none">✓</span>}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>{k.keyword}</span>
                        {k.competition && <CompBadge val={k.competition} />}
                      </div>
                      <p className="text-xs mb-2" style={{ color: "var(--color-text-muted)" }}>{k.reason}</p>
                      {k.total > 0 && (
                        <div>
                          <VolumeBar value={k.total} max={maxTotal} />
                          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                            PC {k.pc.toLocaleString()} · 모바일 {k.mobile.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function KeywordFinderPage() {
  const [tab, setTab] = useState<Tab>("related");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<KeywordResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("total");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [seed, setSeed] = useState("");

  // 업체 프로필에서 업종 자동 로드
  useEffect(() => {
    try {
      const s = localStorage.getItem("tduri_business");
      if (!s) return;
      const p = JSON.parse(s);
      if (p.name && !input) setInput(p.name);
    } catch {}
  }, []); // eslint-disable-line

  const handleSearch = async () => {
    const kw = input.trim();
    if (!kw || busy) return;
    setBusy(true);
    setLoading(true);
    setResults([]);
    setError(null);
    setSeed("");
    try {
      const data = await api.post<{ results: KeywordResult[]; seed: string }>(
        "/api/related-keywords",
        { keyword: kw }
      );
      setResults(data.results);
      setSeed(data.seed);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "서버 연결 실패");
    } finally {
      setLoading(false);
      setBusy(false);
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sorted = [...results].sort((a, b) => {
    const diff = a[sortKey] - b[sortKey];
    return sortDir === "desc" ? -diff : diff;
  });

  const maxTotal = results.reduce((m, r) => Math.max(m, r.total), 0);

  const SortBtn = ({ col }: { col: SortKey }) => {
    const active = sortKey === col;
    const label = col === "total" ? "합계" : col === "pc" ? "PC" : "모바일";
    return (
      <button
        onClick={() => toggleSort(col)}
        className="text-xs px-1.5 py-0.5 rounded flex items-center gap-0.5"
        style={{
          color: active ? "var(--color-primary)" : "var(--color-text-muted)",
          border: `1px solid ${active ? "var(--color-primary)" : "var(--color-border)"}`,
          background: active ? "var(--color-primary)" + "10" : "transparent",
        }}
      >
        {label} {active ? (sortDir === "desc" ? "↓" : "↑") : ""}
      </button>
    );
  };

  const TABS: { key: Tab; label: string; sub?: string }[] = [
    { key: "related", label: "연관 키워드 찾기", sub: "네이버 '공식' 키워드도구" },
    { key: "best",    label: "내게 맞는 대표키워드", sub: "네이버 플레이스 · 카카오 매장관리" },
  ];

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
            내게 맞는 키워드 찾기
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            업종·메뉴명을 입력하면 네이버에서 실제 검색되는 연관 키워드를 보여드려요
          </p>
          <p className="mt-0.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
            *월간 검색량 기준 · 네이버 검색광고 데이터
          </p>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", width: "fit-content" }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-left"
            style={{
              background: tab === t.key ? "var(--color-primary)" : "transparent",
              color: tab === t.key ? "#fff" : "var(--color-text-muted)",
            }}
          >
            <div>{t.label}</div>
            {t.sub && (
              <div className="text-xs font-normal mt-0.5" style={{ opacity: 0.75 }}>
                {t.sub}
              </div>
            )}
          </button>
        ))}
      </div>

      {tab === "best" && <BestKeywordTab />}

      {tab === "related" && (
      <>
      {/* 입력 */}
      <div
        className="rounded-2xl p-6 mb-6"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="예: 포항맛집, 삼겹살, 강남카페"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
            style={{
              background: "var(--color-bg)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-primary)",
            }}
          />
          <button
            onClick={handleSearch}
            disabled={loading || !input.trim()}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 shrink-0"
            style={{ background: "var(--color-primary)" }}
          >
            {loading ? "조회 중..." : "검색"}
          </button>
        </div>
        <p className="mt-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
          업체 이름, 메뉴명, 업종 키워드 등 다양하게 시도해보세요
        </p>
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
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>연관 키워드 조회 중...</p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl text-sm" style={{ background: "#FEF2F2", color: "#EF4444" }}>
            {error}
          </div>
        )}

        {!loading && !error && results.length === 0 && (
          <p className="text-sm text-center py-12" style={{ color: "var(--color-text-muted)" }}>
            키워드를 입력하고 검색해보세요
          </p>
        )}

        {results.length > 0 && !loading && (
          <div>
            {/* 결과 헤더 */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  &quot;{seed}&quot; 연관 키워드
                </span>
                <span className="ml-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
                  {results.length}개
                </span>
              </div>
              <div className="flex gap-1.5">
                <SortBtn col="total" />
                <SortBtn col="mobile" />
                <SortBtn col="pc" />
                <button
                  onClick={() => { setSortKey("total"); setSortDir("desc"); }}
                  className="text-xs px-2 py-0.5 rounded"
                  style={{
                    color: "var(--color-text-muted)",
                    border: "1px solid var(--color-border)",
                    background: "transparent",
                  }}
                >
                  초기화
                </button>
              </div>
            </div>

            {/* 컬럼 헤더 */}
            <div
              className="grid px-4 mb-2 text-xs font-semibold"
              style={{ gridTemplateColumns: "2fr 3fr 1fr", color: "var(--color-text-muted)" }}
            >
              <span>키워드</span>
              <span>월간 검색량 (합계)</span>
              <span className="text-right">경쟁도</span>
            </div>

            {/* 리스트 */}
            <div className="space-y-1.5">
              {sorted.map((r, i) => (
                <div
                  key={r.keyword}
                  className="grid px-4 py-3 rounded-xl items-center"
                  style={{
                    gridTemplateColumns: "2fr 3fr 1fr",
                    background: "var(--color-bg)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-5 text-center shrink-0" style={{ color: "var(--color-text-muted)" }}>
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                      {r.keyword}
                    </span>
                  </div>
                  <div className="px-2">
                    <VolumeBar value={r.total} max={maxTotal} />
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                      PC {r.pc.toLocaleString()} · 모바일 {r.mobile.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <CompBadge val={r.competition} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      </>
      )}
    </div>
  );
}
