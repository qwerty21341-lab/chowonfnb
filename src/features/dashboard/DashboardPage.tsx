"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/supabase/useUser";


interface Group {
  id: string;
  name: string;
}

interface TrackedKeyword {
  id: string;
  keyword: string;
  target: string;
  maxRank: number;
  lastRanks: number[];
  lastChecked: string | null;
  loading: boolean;
  checked: boolean;
  pc?: number;
  mobile?: number;
  groupId?: string;
}

interface ComparisonResult {
  newlyExposed: { keyword: string; ranks: number[] }[];
  droppedToHidden: { keyword: string; prevRanks: number[] }[];
  rankUp: { keyword: string; from: number; to: number }[];
  rankDown: { keyword: string; from: number; to: number }[];
}

interface HistoryRow {
  date: string;
  ranks: number[];
}

export function DashboardPage() {
  const { user } = useUser();
  const supabase = createClient();

  const [keywords, setKeywords] = useState<TrackedKeyword[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("all");
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [addMode, setAddMode] = useState<"single" | "bulk">("single");
  const [form, setForm] = useState({ keyword: "", target: "", maxRank: 20 });
  const [bulkText, setBulkText] = useState("");
  const [bulkTarget, setBulkTarget] = useState("");
  const [bulkMaxRank, setBulkMaxRank] = useState(20);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);
  const [showDoneModal, setShowDoneModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkTargetGroup, setBulkTargetGroup] = useState<string>("");
  const [historyKeyword, setHistoryKeyword] = useState<TrackedKeyword | null>(null);

  const [busy, setBusy] = useState(false);

  // 이력 비교
  const [historyDates, setHistoryDates] = useState<string[]>([]);
  const [compareFrom, setCompareFrom] = useState<string>("");
  const [compareTo, setCompareTo] = useState<string>("");
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);

  const keywordsRef = useRef(keywords);
  useEffect(() => { keywordsRef.current = keywords; }, [keywords]);

  const checkStartRef = useRef<number>(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  useEffect(() => {
    if (!bulkProgress) { setElapsedSec(0); return; }
    const id = setInterval(() => setElapsedSec(Math.floor((Date.now() - checkStartRef.current) / 1000)), 500);
    return () => clearInterval(id);
  }, [bulkProgress]);

  useEffect(() => {
    const savedGroups = localStorage.getItem("tduri_groups");
    if (savedGroups) setGroups(JSON.parse(savedGroups));
  }, []);

  const saveGroups = (g: Group[]) => {
    setGroups(g);
    localStorage.setItem("tduri_groups", JSON.stringify(g));
  };

  const addGroup = () => {
    const name = newGroupName.trim();
    if (!name) return;
    const g: Group = { id: Date.now().toString(), name };
    saveGroups([...groups, g]);
    setNewGroupName("");
    setSelectedGroupId(g.id);
  };

  const deleteGroup = (id: string) => {
    saveGroups(groups.filter((g) => g.id !== id));
    // 해당 그룹 키워드는 미분류로 이동
    setKeywords((prev) => {
      const updated = prev.map((k) => k.groupId === id ? { ...k, groupId: undefined } : k);
      localStorage.setItem("tduri_keywords", JSON.stringify(updated));
      return updated;
    });
    if (selectedGroupId === id) setSelectedGroupId("all");
  };

  useEffect(() => {
    const saved = localStorage.getItem("tduri_keywords");
    if (!saved) return;
    const parsed = JSON.parse(saved);
    const migrated: TrackedKeyword[] = parsed.map((k: TrackedKeyword & { lastRank?: number | null }) => ({
      ...k,
      lastRanks: k.lastRanks ?? (k.lastRank != null ? [k.lastRank] : []),
      checked: k.checked ?? k.lastRank != null,
    }));
    setKeywords(migrated);

    const missing = migrated.filter((k) => k.pc == null && k.mobile == null);
    if (missing.length === 0) return;

    const batches: TrackedKeyword[][] = [];
    for (let i = 0; i < missing.length; i += 5) batches.push(missing.slice(i, i + 5));

    batches.forEach(async (batch) => {
      try {
        const data = await api.post<{ results: { keyword: string; pc: number; mobile: number }[] }>(
          "/api/search-volume",
          { keywords: batch.map((k) => k.keyword) }
        );
        const norm = (s: string) => s.toLowerCase().replace(/\s+/g, "");
        const volMap: Record<string, { pc: number; mobile: number }> = {};
        for (const item of data.results ?? []) {
          volMap[norm(item.keyword)] = { pc: item.pc, mobile: item.mobile };
        }
        setKeywords((prev) => {
          const updated = prev.map((k) => {
            const vol = volMap[norm(k.keyword)];
            return vol && k.pc == null ? { ...k, pc: vol.pc, mobile: vol.mobile } : k;
          });
          localStorage.setItem("tduri_keywords", JSON.stringify(updated));
          return updated;
        });
      } catch {
        // 볼륨 조회 실패 무시
      }
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchHistoryDates();
  }, [user]);

  const fetchHistoryDates = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("rank_history")
      .select("date")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    const dates = [...new Set((data ?? []).map((r: { date: string }) => r.date))];
    setHistoryDates(dates);

    if (dates.length >= 2 && !compareFrom && !compareTo) {
      setCompareTo(dates[0]);
      setCompareFrom(dates[1]);
    } else if (dates.length === 1 && !compareTo) {
      setCompareTo(dates[0]);
    }
  };

  const saveToHistory = async (kwList: TrackedKeyword[]) => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    const rows = kwList.map((k) => ({
      user_id: user.id,
      date: today,
      keyword_id: k.id,
      keyword: k.keyword,
      ranks: k.lastRanks,
    }));
    await supabase.from("rank_history").upsert(rows, { onConflict: "user_id,date,keyword_id" });
    await fetchHistoryDates();
  };

  const runComparison = async () => {
    if (!compareFrom || !compareTo || !user || busy) return;
    setBusy(true);
    setComparison(null);

    try {
      const [fromRes, toRes] = await Promise.all([
        supabase.from("rank_history").select("keyword_id, keyword, ranks").eq("user_id", user.id).eq("date", compareFrom),
        supabase.from("rank_history").select("keyword_id, keyword, ranks").eq("user_id", user.id).eq("date", compareTo),
      ]);

      const fromMap = new Map((fromRes.data ?? []).map((r: { keyword_id: string; keyword: string; ranks: number[] }) => [r.keyword_id, r]));
      const toMap = new Map((toRes.data ?? []).map((r: { keyword_id: string; keyword: string; ranks: number[] }) => [r.keyword_id, r]));
      const allIds = new Set([...fromMap.keys(), ...toMap.keys()]);

      const newlyExposed: { keyword: string; ranks: number[] }[] = [];
      const droppedToHidden: { keyword: string; prevRanks: number[] }[] = [];
      const rankUp: { keyword: string; from: number; to: number }[] = [];
      const rankDown: { keyword: string; from: number; to: number }[] = [];

      for (const id of allIds) {
        const from = fromMap.get(id);
        const to = toMap.get(id);
        if (!from || !to) continue;

        if (from.ranks.length === 0 && to.ranks.length > 0) {
          newlyExposed.push({ keyword: to.keyword, ranks: to.ranks });
        } else if (from.ranks.length > 0 && to.ranks.length === 0) {
          droppedToHidden.push({ keyword: from.keyword, prevRanks: from.ranks });
        } else if (from.ranks.length > 0 && to.ranks.length > 0) {
          if (to.ranks[0] < from.ranks[0]) {
            rankUp.push({ keyword: to.keyword, from: from.ranks[0], to: to.ranks[0] });
          } else if (to.ranks[0] > from.ranks[0]) {
            rankDown.push({ keyword: to.keyword, from: from.ranks[0], to: to.ranks[0] });
          }
        }
      }

      setComparison({ newlyExposed, droppedToHidden, rankUp, rankDown });
    } finally {
      setBusy(false);
    }
  };

  const save = (updated: TrackedKeyword[]) => {
    setKeywords(updated);
    localStorage.setItem("tduri_keywords", JSON.stringify(updated));
  };

  const addKeyword = () => {
    if (!form.keyword.trim() || !form.target.trim()) return;
    const newItem: TrackedKeyword = {
      id: Date.now().toString(),
      keyword: form.keyword.trim(),
      target: form.target.trim(),
      maxRank: form.maxRank,
      lastRanks: [],
      lastChecked: null,
      loading: false,
      checked: false,
      groupId: selectedGroupId !== "all" && selectedGroupId !== "ungrouped" ? selectedGroupId : undefined,
    };
    save([...keywords, newItem]);
    setForm({ keyword: "", target: "", maxRank: 20 });
    setShowAddForm(false);
  };

  const deleteKeyword = (id: string) => {
    save(keywords.filter((k) => k.id !== id));
  };

  const updateKeywordGroup = (id: string, groupId: string | undefined) => {
    setKeywords((prev) => {
      const updated = prev.map((k) => k.id === id ? { ...k, groupId } : k);
      localStorage.setItem("tduri_keywords", JSON.stringify(updated));
      return updated;
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === visibleKeywords.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleKeywords.map((k) => k.id)));
    }
  };

  const moveSelectedToGroup = () => {
    if (selectedIds.size === 0) return;
    const groupId = bulkTargetGroup || undefined;
    setKeywords((prev) => {
      const updated = prev.map((k) => selectedIds.has(k.id) ? { ...k, groupId } : k);
      localStorage.setItem("tduri_keywords", JSON.stringify(updated));
      return updated;
    });
    setSelectedIds(new Set());
    setEditMode(false);
  };

  const exitEditMode = () => {
    setEditMode(false);
    setSelectedIds(new Set());
  };

  const addBulk = () => {
    const lines = bulkText.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0 || !bulkTarget.trim()) return;
    const existing = new Set(keywords.map((k) => k.keyword));
    const newItems: TrackedKeyword[] = lines
      .filter((kw) => !existing.has(kw))
      .map((kw, i) => ({
        id: (Date.now() + i).toString(),
        keyword: kw,
        target: bulkTarget.trim(),
        maxRank: bulkMaxRank,
        lastRanks: [],
        lastChecked: null,
        loading: false,
        checked: false,
        groupId: selectedGroupId !== "all" && selectedGroupId !== "ungrouped" ? selectedGroupId : undefined,
      }));
    if (newItems.length > 0) save([...keywords, ...newItems]);
    setBulkText("");
    setShowAddForm(false);
  };

  const checkRank = async (id: string) => {
    const kw = keywords.find((k) => k.id === id);
    if (!kw) return;

    setKeywords((prev) => prev.map((k) => (k.id === id ? { ...k, loading: true } : k)));

    try {
      const [rankRes, volRes] = await Promise.allSettled([
        api.post<{ details?: { matched: boolean; rank: number }[] }>("/api/rank", { keyword: kw.keyword, target: kw.target, max_rank: kw.maxRank }),
        api.post<{ results?: { keyword: string; pc: number; mobile: number; total: number }[] }>("/api/search-volume", { keywords: [kw.keyword] }),
      ]);

      const rankData = rankRes.status === "fulfilled" ? rankRes.value : null;
      const volData = volRes.status === "fulfilled" ? volRes.value : null;

      const matchedRanks: number[] = rankData
        ? (rankData.details ?? [])
            .filter((d: { matched: boolean }) => d.matched)
            .map((d: { rank: number }) => d.rank)
        : [];

      const norm = (s: string) => s.toLowerCase().replace(/\s+/g, "");
      const volResult = volData?.results?.find(
        (r: { keyword: string }) => norm(r.keyword) === norm(kw.keyword)
      );

      const updatedKw = {
        ...kw,
        loading: false,
        lastRanks: matchedRanks,
        lastChecked: new Date().toLocaleString("ko-KR"),
        checked: true,
        ...(volResult != null ? { pc: volResult.pc, mobile: volResult.mobile } : {}),
      };
      setKeywords((prev) => {
        const updated = prev.map((k) => (k.id === id ? updatedKw : k));
        localStorage.setItem("tduri_keywords", JSON.stringify(updated));
        return updated;
      });
      saveToHistory(keywordsRef.current.map((k) => (k.id === id ? updatedKw : k))).catch(() => {});
    } catch {
      setKeywords((prev) => prev.map((k) => (k.id === id ? { ...k, loading: false } : k)));
    }
  };

  const checkAll = async () => {
    const toCheck = selectedGroupId === "all"
      ? keywords
      : selectedGroupId === "ungrouped"
        ? keywords.filter((k) => !k.groupId)
        : keywords.filter((k) => k.groupId === selectedGroupId);

    if (toCheck.length === 0 || busy) return;
    setBusy(true);
    const total = toCheck.length;
    checkStartRef.current = Date.now();
    setBulkProgress({ done: 0, total });
    const now = new Date();
    const formatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    setLastRefreshed(formatted);

    try {
      const totalStart = performance.now();
      const norm = (s: string) => s.toLowerCase().replace(/\s+/g, "");

      // 1. 검색량 수집 — 순위 수집과 병렬로 백그라운드 실행 (progress 차단 안 함)
      const volMap: Record<string, { pc: number; mobile: number }> = {};
      const volPromise = (async () => {
        const chunks: (typeof toCheck)[] = [];
        for (let i = 0; i < toCheck.length; i += 5) chunks.push(toCheck.slice(i, i + 5));
        await Promise.allSettled(
          chunks.map(async (chunk) => {
            try {
              const data = await api.post<{ results?: { keyword: string; pc: number; mobile: number }[] }>("/api/search-volume", { keywords: chunk.map((k) => k.keyword) });
              for (const r of data?.results ?? []) {
                volMap[norm(r.keyword)] = { pc: r.pc, mobile: r.mobile };
              }
            } catch {}
          })
        );
      })();

      // 2. 순위 수집 — 검색량 기다리지 않고 즉시 시작 (10개씩 순차 배치)
      const BATCH = 10;
      for (let i = 0; i < toCheck.length; i += BATCH) {
        const batch = toCheck.slice(i, i + BATCH);
        await Promise.allSettled(
          batch.map(async (kw) => {
            setKeywords((prev) => prev.map((k) => k.id === kw.id ? { ...k, loading: true } : k));
            try {
              const rankData = await api.post<{ details?: { matched: boolean; rank: number }[] }>("/api/rank", { keyword: kw.keyword, target: kw.target, max_rank: kw.maxRank });
              const matchedRanks: number[] = (rankData?.details ?? [])
                .filter((d: { matched: boolean }) => d.matched)
                .map((d: { rank: number }) => d.rank);
              const vol = volMap[norm(kw.keyword)];
              setKeywords((prev) => {
                const updated = prev.map((k) =>
                  k.id === kw.id
                    ? {
                        ...k,
                        loading: false,
                        lastRanks: matchedRanks,
                        lastChecked: new Date().toLocaleString("ko-KR"),
                        checked: true,
                        ...(vol != null ? { pc: vol.pc, mobile: vol.mobile } : {}),
                      }
                    : k
                );
                localStorage.setItem("tduri_keywords", JSON.stringify(updated));
                return updated;
              });
            } catch {
              setKeywords((prev) => prev.map((k) => k.id === kw.id ? { ...k, loading: false } : k));
            }
            setBulkProgress((prev) => prev ? { ...prev, done: prev.done + 1 } : null);
          })
        );
      }

      // 3. 검색량이 늦게 도착했으면 미적용 키워드에 사후 적용
      await volPromise;
      setKeywords((prev) => {
        const updated = prev.map((k) => {
          if (k.pc != null) return k;
          const vol = volMap[norm(k.keyword)];
          return vol ? { ...k, pc: vol.pc, mobile: vol.mobile } : k;
        });
        localStorage.setItem("tduri_keywords", JSON.stringify(updated));
        return updated;
      });

      const totalMs = Math.round(performance.now() - totalStart);
      console.log(`[수집완료] ${total}개 키워드 | 총 ${totalMs}ms (${(totalMs / 1000).toFixed(1)}초)`);

      try {
        await Promise.race([
          saveToHistory(keywordsRef.current),
          new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 10000)),
        ]);
      } catch {}
    } finally {
      setBulkProgress(null);
      setShowDoneModal(true);
      setBusy(false);
      setTimeout(() => setShowDoneModal(false), 2000);
    }
  };

  const deleteAll = () => {
    if (selectedGroupId === "all") {
      save([]);
    } else if (selectedGroupId === "ungrouped") {
      save(keywords.filter((k) => k.groupId != null));
    } else {
      save(keywords.filter((k) => k.groupId !== selectedGroupId));
    }
    setShowDeleteModal(false);
  };

  const visibleKeywords = selectedGroupId === "all"
    ? keywords
    : selectedGroupId === "ungrouped"
      ? keywords.filter((k) => !k.groupId)
      : keywords.filter((k) => k.groupId === selectedGroupId);

  const exposedCount = keywords.filter((k) => k.checked && k.lastRanks.length > 0).length;
  const hasComparison = comparison && (
    comparison.newlyExposed.length + comparison.droppedToHidden.length +
    comparison.rankUp.length + comparison.rankDown.length > 0
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>대시보드</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>오늘의 마케팅 현황을 한눈에 확인하세요</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="모니터링 키워드" value={String(keywords.length)} unit="개" />
        <StatCard label="노출 확인됨" value={String(exposedCount)} unit="건" />
        <StatCard label="AI 리뷰 잔여" value="0" unit="회" />
      </div>

      {/* 이력 비교 섹션 */}
      <div className="rounded-2xl p-5 mb-6" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <h2 className="text-base font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>이력 비교</h2>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>수집시작일</span>
              <input
                type="date"
                value={compareFrom}
                onChange={(e) => { setCompareFrom(e.target.value); setComparison(null); }}
                onClick={(e) => { try { (e.currentTarget as HTMLInputElement).showPicker(); } catch {} }}
                className="px-3 py-2 rounded-lg text-sm outline-none cursor-pointer"
                style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
              />
            </div>

            <span className="text-sm mt-4" style={{ color: "var(--color-text-muted)" }}>→</span>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>비교기준일</span>
              <input
                type="date"
                value={compareTo}
                onChange={(e) => { setCompareTo(e.target.value); setComparison(null); }}
                onClick={(e) => { try { (e.currentTarget as HTMLInputElement).showPicker(); } catch {} }}
                className="px-3 py-2 rounded-lg text-sm outline-none cursor-pointer"
                style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
              />
            </div>

            <button
              onClick={runComparison}
              disabled={busy || !compareFrom || !compareTo || compareFrom === compareTo}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-40"
              style={{ background: "var(--color-primary)" }}
            >
              {busy ? "처리 중..." : "비교하기"}
            </button>
          </div>

          {comparison && (
            <div className="mt-4">
              {!hasComparison ? (
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>두 날짜 사이에 변화가 없습니다.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {comparison.newlyExposed.length > 0 && (
                    <details className="group rounded-xl overflow-hidden" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                      <summary className="flex items-center justify-between px-4 py-3 cursor-pointer list-none" style={{ color: "#15803D" }}>
                        <span className="text-xs font-semibold">↑ 새로 노출 {comparison.newlyExposed.length}개</span>
                        <span className="text-xs font-medium">
                          <span className="group-open:hidden">열기 ▾</span>
                          <span className="hidden group-open:inline">접기 ▴</span>
                        </span>
                      </summary>
                      <div className="px-4 pb-3 space-y-2">
                        {comparison.newlyExposed.map((item, i) => (
                          <div key={i} className="flex items-center justify-between gap-2">
                            <a href={`https://search.naver.com/search.naver?ssc=tab.blog.all&sm=tab_jum&query=${encodeURIComponent(item.keyword)}`} target="_blank" rel="noopener noreferrer" className="text-sm truncate hover:underline" style={{ color: "#166534" }}>{item.keyword}</a>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: "#22C55E", color: "#fff" }}>{item.ranks[0]}위</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                  {comparison.droppedToHidden.length > 0 && (
                    <details className="group rounded-xl overflow-hidden" style={{ background: "#FFF7ED", border: "1px solid #FED7AA" }}>
                      <summary className="flex items-center justify-between px-4 py-3 cursor-pointer list-none" style={{ color: "#C2410C" }}>
                        <span className="text-xs font-semibold">↓ 미노출로 변경 {comparison.droppedToHidden.length}개</span>
                        <span className="text-xs font-medium">
                          <span className="group-open:hidden">열기 ▾</span>
                          <span className="hidden group-open:inline">접기 ▴</span>
                        </span>
                      </summary>
                      <div className="px-4 pb-3 space-y-2">
                        {comparison.droppedToHidden.map((item, i) => (
                          <div key={i} className="flex items-center justify-between gap-2">
                            <a href={`https://search.naver.com/search.naver?ssc=tab.blog.all&sm=tab_jum&query=${encodeURIComponent(item.keyword)}`} target="_blank" rel="noopener noreferrer" className="text-sm truncate hover:underline" style={{ color: "#9A3412" }}>{item.keyword}</a>
                            <span className="text-xs shrink-0" style={{ color: "#EA580C" }}>이전 {item.prevRanks[0]}위</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                  {comparison.rankUp.length > 0 && (
                    <details className="group rounded-xl overflow-hidden" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                      <summary className="flex items-center justify-between px-4 py-3 cursor-pointer list-none" style={{ color: "#15803D" }}>
                        <span className="text-xs font-semibold">↑ 순위 상승 {comparison.rankUp.length}개</span>
                        <span className="text-xs font-medium">
                          <span className="group-open:hidden">열기 ▾</span>
                          <span className="hidden group-open:inline">접기 ▴</span>
                        </span>
                      </summary>
                      <div className="px-4 pb-3 space-y-2">
                        {comparison.rankUp.map((item, i) => (
                          <div key={i} className="flex items-center justify-between gap-2">
                            <a href={`https://search.naver.com/search.naver?ssc=tab.blog.all&sm=tab_jum&query=${encodeURIComponent(item.keyword)}`} target="_blank" rel="noopener noreferrer" className="text-sm truncate hover:underline" style={{ color: "#166534" }}>{item.keyword}</a>
                            <span className="text-xs shrink-0" style={{ color: "#15803D" }}>{item.from}위 → <span className="font-bold">{item.to}위</span></span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                  {comparison.rankDown.length > 0 && (
                    <details className="group rounded-xl overflow-hidden" style={{ background: "#FFF7ED", border: "1px solid #FED7AA" }}>
                      <summary className="flex items-center justify-between px-4 py-3 cursor-pointer list-none" style={{ color: "#C2410C" }}>
                        <span className="text-xs font-semibold">↓ 순위 하락 {comparison.rankDown.length}개</span>
                        <span className="text-xs font-medium">
                          <span className="group-open:hidden">열기 ▾</span>
                          <span className="hidden group-open:inline">접기 ▴</span>
                        </span>
                      </summary>
                      <div className="px-4 pb-3 space-y-2">
                        {comparison.rankDown.map((item, i) => (
                          <div key={i} className="flex items-center justify-between gap-2">
                            <a href={`https://search.naver.com/search.naver?ssc=tab.blog.all&sm=tab_jum&query=${encodeURIComponent(item.keyword)}`} target="_blank" rel="noopener noreferrer" className="text-sm truncate hover:underline" style={{ color: "#9A3412" }}>{item.keyword}</a>
                            <span className="text-xs shrink-0" style={{ color: "#EA580C" }}>{item.from}위 → <span className="font-bold">{item.to}위</span></span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              )}
            </div>
          )}
          {historyDates.length === 0 && (
            <p className="mt-3 text-sm" style={{ color: "var(--color-text-muted)" }}>수집 이력이 없습니다. 전체갱신을 실행하면 이력이 생성됩니다.</p>
          )}
        </div>

      {/* 키워드 순위 현황 */}
      <div className="rounded-2xl p-6" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>키워드 순위 현황</h2>
          <div className="flex items-center gap-2">
            {keywords.length > 0 && (
              <>
                {lastRefreshed && (
                  <span className="text-xs mr-1" style={{ color: "var(--color-text-muted)" }}>최근갱신: {lastRefreshed}</span>
                )}
                <button onClick={checkAll} disabled={busy} title={`예상 약 ${Math.ceil(visibleKeywords.length / 10) * 2}초`} className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50" style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}>전체갱신 (~{Math.ceil(visibleKeywords.length / 10) * 2}s)</button>
                <button onClick={() => setShowDeleteModal(true)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "#EF4444" }}>전체삭제</button>
              </>
            )}
            <button onClick={() => setShowGroupModal(true)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}>그룹관리</button>
            {keywords.length > 0 && (
              <button
                onClick={() => editMode ? exitEditMode() : setEditMode(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: editMode ? "var(--color-primary)" : "var(--color-bg)", border: `1px solid ${editMode ? "var(--color-primary)" : "var(--color-border)"}`, color: editMode ? "#fff" : "var(--color-text-secondary)" }}
              >
                {editMode ? "편집 종료" : "편집"}
              </button>
            )}
            <button onClick={() => setShowAddForm((v) => !v)} className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: "var(--color-primary)" }}>+ 키워드 추가</button>
          </div>
        </div>

        {/* 그룹 필터 */}
        {groups.length > 0 && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {([{ id: "all", name: "전체" }, { id: "ungrouped", name: "미분류" }, ...groups] as Group[]).map((g) => {
              const count = g.id === "all"
                ? keywords.length
                : g.id === "ungrouped"
                  ? keywords.filter((k) => !k.groupId).length
                  : keywords.filter((k) => k.groupId === g.id).length;
              const active = selectedGroupId === g.id;
              return (
                <button
                  key={g.id}
                  onClick={() => setSelectedGroupId(g.id)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                  style={{
                    background: active ? "var(--color-primary)" : "var(--color-bg)",
                    color: active ? "#fff" : "var(--color-text-secondary)",
                    border: `1px solid ${active ? "var(--color-primary)" : "var(--color-border)"}`,
                  }}
                >
                  {g.name} <span style={{ opacity: 0.7 }}>({count})</span>
                </button>
              );
            })}
          </div>
        )}

        {showAddForm && (
          <div className="rounded-xl p-4 mb-4" style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
            <div className="flex gap-1 mb-4 p-1 rounded-lg w-fit" style={{ background: "var(--color-surface)" }}>
              {(["single", "bulk"] as const).map((mode) => (
                <button key={mode} onClick={() => setAddMode(mode)} className="px-4 py-1.5 rounded-md text-xs font-semibold transition-colors"
                  style={{ background: addMode === mode ? "var(--color-primary)" : "transparent", color: addMode === mode ? "#fff" : "var(--color-text-muted)" }}>
                  {mode === "single" ? "단건 등록" : "대량 등록"}
                </button>
              ))}
            </div>

            {addMode === "single" && (
              <>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>검색 키워드</label>
                    <input type="text" placeholder="예: 강남 맛집" value={form.keyword}
                      onChange={(e) => setForm({ ...form, keyword: e.target.value })}
                      onKeyDown={(e) => e.key === "Enter" && addKeyword()}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>타겟 (블로그 제목에 포함된 단어)</label>
                    <input type="text" placeholder="예: 단소상회" value={form.target}
                      onChange={(e) => setForm({ ...form, target: e.target.value })}
                      onKeyDown={(e) => e.key === "Enter" && addKeyword()}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }} />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>상위</span>
                  <div className="flex gap-1">
                    {[5, 10, 15, 20].map((n) => (
                      <button key={n} onClick={() => setForm({ ...form, maxRank: n })} className="px-2.5 py-1 rounded-md text-xs font-medium"
                        style={{ background: form.maxRank === n ? "var(--color-primary)" : "var(--color-surface)", color: form.maxRank === n ? "#fff" : "var(--color-text-secondary)", border: `1px solid ${form.maxRank === n ? "var(--color-primary)" : "var(--color-border)"}` }}>
                        {n}개
                      </button>
                    ))}
                  </div>
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>까지</span>
                  <div className="ml-auto flex gap-2">
                    <button onClick={() => setShowAddForm(false)} className="px-3 py-1.5 rounded-lg text-xs" style={{ color: "var(--color-text-muted)" }}>취소</button>
                    <button onClick={addKeyword} disabled={!form.keyword.trim() || !form.target.trim()} className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50" style={{ background: "var(--color-primary)" }}>추가</button>
                  </div>
                </div>
              </>
            )}

            {addMode === "bulk" && (
              <>
                <textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)}
                  placeholder={"한우갈비찜\n단체회식하기좋은소고기집\n주차되는갈비집\n..."} rows={6}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none mb-3"
                  style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)", fontFamily: "inherit" }} />
                <div className="flex items-center gap-3 flex-wrap mb-3">
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>타겟 (블로그 제목에서 찾을 업체명)</label>
                    <input type="text" placeholder="예: 이동갈비 한우집" value={bulkTarget}
                      onChange={(e) => setBulkTarget(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>상위</label>
                    <div className="flex gap-1">
                      {[5, 10, 15, 20].map((n) => (
                        <button key={n} onClick={() => setBulkMaxRank(n)} className="px-2.5 py-1.5 rounded-md text-xs font-medium"
                          style={{ background: bulkMaxRank === n ? "var(--color-primary)" : "var(--color-surface)", color: bulkMaxRank === n ? "#fff" : "var(--color-text-secondary)", border: `1px solid ${bulkMaxRank === n ? "var(--color-primary)" : "var(--color-border)"}` }}>
                          {n}개
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{bulkText.split("\n").filter((l) => l.trim()).length}개 입력됨</span>
                  <div className="flex gap-2">
                    <button onClick={() => setShowAddForm(false)} className="px-3 py-1.5 rounded-lg text-xs" style={{ color: "var(--color-text-muted)" }}>취소</button>
                    <button onClick={addBulk} disabled={!bulkText.trim() || !bulkTarget.trim()} className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50" style={{ background: "var(--color-primary)" }}>등록</button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* 편집 모드 일괄 이동 바 */}
        {editMode && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-3 flex-wrap"
            style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
            <button
              onClick={toggleSelectAll}
              className="text-xs font-medium px-3 py-1.5 rounded-lg"
              style={{ border: "1px solid var(--color-border)", color: "var(--color-text-secondary)", background: "var(--color-surface)" }}
            >
              {selectedIds.size === visibleKeywords.length && visibleKeywords.length > 0 ? "전체 해제" : "전체 선택"}
            </button>
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              {selectedIds.size}개 선택됨
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <select
                value={bulkTargetGroup}
                onChange={(e) => setBulkTargetGroup(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs outline-none"
                style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
              >
                <option value="">미분류</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
              <button
                onClick={moveSelectedToGroup}
                disabled={selectedIds.size === 0}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-40"
                style={{ background: "var(--color-primary)" }}
              >
                이동
              </button>
            </div>
          </div>
        )}

        {keywords.length === 0 && !showAddForm ? (
          <div className="flex flex-col items-center justify-center py-16 text-sm" style={{ color: "var(--color-text-muted)" }}>
            <p>아직 등록된 키워드가 없어요</p>
            <button onClick={() => setShowAddForm(true)} className="mt-3 text-sm font-medium" style={{ color: "var(--color-primary)" }}>키워드 추가하기 →</button>
          </div>
        ) : visibleKeywords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-sm" style={{ color: "var(--color-text-muted)" }}>
            <p>이 그룹에 등록된 키워드가 없어요</p>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleKeywords.map((kw) => (
              <KeywordCard
                key={kw.id}
                kw={kw}
                groups={groups}
                editMode={editMode}
                selected={selectedIds.has(kw.id)}
                onToggleSelect={() => toggleSelect(kw.id)}
                onCheck={() => checkRank(kw.id)}
                onDelete={() => deleteKeyword(kw.id)}
                onHistory={() => setHistoryKeyword(kw)}
                onGroupChange={(groupId) => updateKeywordGroup(kw.id, groupId)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 순위 이력 모달 */}
      {historyKeyword && user && (
        <KeywordHistoryModal
          kw={historyKeyword}
          userId={user.id}
          onClose={() => setHistoryKeyword(null)}
        />
      )}

      {/* 수집 중 오버레이 */}
      {bulkProgress && (() => {
        const { done, total } = bulkProgress;
        const pct = total > 0 ? (done / total) * 100 : 0;
        const estTotal = Math.ceil(total / 10) * 2; // httpx 기준 ~2s/batch
        const remaining = done > 0
          ? Math.max(0, Math.round(elapsedSec * (total - done) / done))
          : Math.max(0, estTotal - elapsedSec);
        const fmt = (s: number) => s >= 60 ? `${Math.floor(s / 60)}분 ${s % 60}초` : `${s}초`;
        return (
          <div className="fixed inset-0 flex flex-col items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.6)" }}>
            <div className="rounded-2xl px-10 py-8 flex flex-col items-center gap-4 w-80" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
              <p className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>수집 중...</p>
              <div className="w-full">
                <div className="w-full rounded-full h-2.5 overflow-hidden" style={{ background: "var(--color-border)" }}>
                  <div className="h-2.5 rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: "var(--color-primary)" }} />
                </div>
                <div className="flex justify-between mt-2">
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{done} / {total}개</p>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>경과 {fmt(elapsedSec)}</p>
                </div>
                {done >= total && (
                  <p className="text-xs text-center mt-1" style={{ color: "var(--color-text-secondary)" }}>마무리 중...</p>
                )}
              </div>
              <button
                onClick={() => { setBulkProgress(null); setBusy(false); }}
                className="text-xs px-4 py-1.5 rounded-lg"
                style={{ color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}
              >
                취소
              </button>
            </div>
          </div>
        );
      })()}

      {/* 전체삭제 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setShowDeleteModal(false)}>
          <div className="rounded-2xl px-8 py-6 flex flex-col items-center gap-4 w-72" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }} onClick={(e) => e.stopPropagation()}>
            <p className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>전체 삭제</p>
            <p className="text-sm text-center" style={{ color: "var(--color-text-secondary)" }}>키워드 {visibleKeywords.length}개를 모두 삭제할까요?</p>
            <div className="flex gap-2 w-full">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}>아니오</button>
              <button onClick={deleteAll} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "#EF4444" }}>예</button>
            </div>
          </div>
        </div>
      )}

      {/* 그룹 관리 모달 */}
      {showGroupModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setShowGroupModal(false)}>
          <div className="rounded-2xl p-6 w-80" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>그룹 관리</p>
              <button onClick={() => setShowGroupModal(false)} className="text-xl leading-none" style={{ color: "var(--color-text-muted)" }}>✕</button>
            </div>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="새 그룹 이름"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addGroup()}
                className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
              />
              <button
                onClick={addGroup}
                disabled={!newGroupName.trim()}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-40"
                style={{ background: "var(--color-primary)" }}
              >
                추가
              </button>
            </div>

            {groups.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: "var(--color-text-muted)" }}>아직 그룹이 없습니다</p>
            ) : (
              <div className="space-y-2">
                {groups.map((g) => (
                  <div key={g.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg" style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
                    <div>
                      <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{g.name}</span>
                      <span className="ml-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
                        {keywords.filter((k) => k.groupId === g.id).length}개
                      </span>
                    </div>
                    <button
                      onClick={() => deleteGroup(g.id)}
                      className="text-xs px-2 py-1 rounded"
                      style={{ color: "#EF4444" }}
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 수집완료 모달 */}
      {showDoneModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="rounded-2xl px-10 py-8 flex flex-col items-center gap-5 w-72" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            <p className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>수집완료 ✓</p>
            <p className="text-sm text-center" style={{ color: "var(--color-text-secondary)" }}>{keywords.length}개 키워드 순위 확인 완료</p>
            <button onClick={() => setShowDoneModal(false)} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "var(--color-primary)" }}>확인</button>
          </div>
        </div>
      )}
    </div>
  );
}

// 순위별 색상
function rankStyle(ranks: number[]): { bg: string; text: string; label: string } {
  if (ranks.length === 0) return { bg: "#374151", text: "#9CA3AF", label: "미노출" };
  const r = ranks[0];
  if (r <= 5)  return { bg: "#22C55E", text: "#fff", label: `${r}위` };
  if (r <= 10) return { bg: "#3B82F6", text: "#fff", label: `${r}위` };
  if (r <= 20) return { bg: "#F59E0B", text: "#fff", label: `${r}위` };
  return { bg: "#EF4444", text: "#fff", label: `${r}위` };
}

function KeywordHistoryModal({
  kw,
  userId,
  onClose,
}: {
  kw: TrackedKeyword;
  userId: string;
  onClose: () => void;
}) {
  const supabase = createClient();
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await supabase
          .from("rank_history")
          .select("date, ranks")
          .eq("user_id", userId)
          .eq("keyword_id", kw.id)
          .order("date", { ascending: false })
          .limit(90);
        setHistory((data ?? []) as HistoryRow[]);
      } catch {
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [kw.id, userId]);

  const DAYS = ["일", "월", "화", "수", "목", "금", "토"];
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return { short: `${mm}.${dd}`, day: DAYS[d.getDay()] };
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl w-full max-w-2xl overflow-hidden"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <div>
            <p className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>{kw.keyword}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>필터: {kw.target} · 상위 {kw.maxRank}개</p>
          </div>
          <button onClick={onClose} className="text-xl leading-none" style={{ color: "var(--color-text-muted)" }}>✕</button>
        </div>

        {/* 범례 */}
        <div className="flex items-center gap-3 px-6 pt-4 pb-2 flex-wrap">
          {[
            { bg: "#22C55E", label: "1~5위" },
            { bg: "#3B82F6", label: "6~10위" },
            { bg: "#F59E0B", label: "11~20위" },
            { bg: "#EF4444", label: "21위+" },
            { bg: "#374151", label: "미노출" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ background: item.bg }} />
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{item.label}</span>
            </div>
          ))}
        </div>

        {/* 그리드 */}
        <div className="px-6 pb-6 overflow-y-auto" style={{ maxHeight: "60vh" }}>
          {loading ? (
            <p className="text-sm text-center py-10" style={{ color: "var(--color-text-muted)" }}>불러오는 중...</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-center py-10" style={{ color: "var(--color-text-muted)" }}>아직 수집 이력이 없습니다.</p>
          ) : (
            <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
              {history.map((row) => {
                const { short, day } = formatDate(row.date);
                const style = rankStyle(row.ranks);
                return (
                  <div
                    key={row.date}
                    className="rounded-xl flex flex-col items-center py-3 gap-1"
                    style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ background: style.bg, color: style.text }}
                    >
                      {style.label}
                    </div>
                    {row.ranks.length > 1 && (
                      <p className="text-center leading-tight" style={{ fontSize: 9, color: style.bg }}>
                        {row.ranks.join(",")}위
                      </p>
                    )}
                    <p className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>{short}</p>
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{day}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KeywordCard({
  kw,
  groups,
  editMode,
  selected,
  onToggleSelect,
  onCheck,
  onDelete,
  onHistory,
  onGroupChange,
}: {
  kw: TrackedKeyword;
  groups: Group[];
  editMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onCheck: () => void;
  onDelete: () => void;
  onHistory: () => void;
  onGroupChange: (groupId: string | undefined) => void;
}) {
  const [showLinkModal, setShowLinkModal] = useState(false);
  const exposed = kw.checked && kw.lastRanks.length > 0;
  const notExposed = kw.checked && kw.lastRanks.length === 0;
  const badgeBg = exposed ? "var(--color-success)" : notExposed ? "#6B7280" : "var(--color-border)";
  const badgeText = exposed ? `${kw.lastRanks[0]}위` : "–";

  let subText = `필터: ${kw.target}, 상위${kw.maxRank}개`;
  if (exposed) subText += `, ${kw.lastRanks.join(", ")}위 노출`;
  else if (notExposed) subText += `, 미노출`;

  const hasVolume = kw.pc != null || kw.mobile != null;
  const searchUrl = `https://search.naver.com/search.naver?ssc=tab.blog.all&sm=tab_jum&query=${encodeURIComponent(kw.keyword)}`;

  return (
    <>
      {showLinkModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setShowLinkModal(false)}>
          <div className="rounded-2xl px-8 py-6 flex flex-col items-center gap-4 w-72" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }} onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-semibold text-center" style={{ color: "var(--color-text-primary)" }}>링크를 열까요?</p>
            <p className="text-xs text-center" style={{ color: "var(--color-text-muted)" }}>
              네이버 블로그 검색 — <span className="font-medium" style={{ color: "var(--color-text-secondary)" }}>{kw.keyword}</span>
            </p>
            <div className="flex gap-2 w-full">
              <button onClick={() => setShowLinkModal(false)} className="flex-1 py-2 rounded-xl text-sm" style={{ border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}>아니오</button>
              <button onClick={() => { window.open(searchUrl, "_blank"); setShowLinkModal(false); }} className="flex-1 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: "var(--color-primary)" }}>예</button>
            </div>
          </div>
        </div>
      )}
      <div
        className="flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer"
        onClick={editMode ? onToggleSelect : undefined}
        style={{ background: selected ? `color-mix(in srgb, var(--color-primary) 10%, var(--color-bg))` : "var(--color-bg)", border: `1px solid ${selected ? "var(--color-primary)" : notExposed ? "#374151" : "var(--color-border)"}`, opacity: !editMode && notExposed ? 0.6 : 1 }}
      >
        {editMode && (
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 shrink-0 accent-primary"
            style={{ accentColor: "var(--color-primary)" }}
          />
        )}
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white" style={{ background: badgeBg }}>
          {badgeText}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setShowLinkModal(true)} className="text-sm font-medium text-left hover:underline" style={{ color: "var(--color-text-primary)" }}>
              {kw.keyword}
            </button>
            {hasVolume && (
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                PC {(kw.pc ?? 0).toLocaleString()} · MO {(kw.mobile ?? 0).toLocaleString()}
              </span>
            )}
          </div>
          <p className="text-xs mt-0.5" style={{ color: notExposed ? "#6B7280" : "var(--color-text-muted)" }}>{subText}</p>
        </div>
        {!editMode && (
          <div className="flex items-center gap-2 shrink-0">
            {groups.length > 0 && (
              <select
                value={kw.groupId ?? ""}
                onChange={(e) => onGroupChange(e.target.value || undefined)}
                onClick={(e) => e.stopPropagation()}
                className="px-2 py-1.5 rounded-lg text-xs outline-none"
                style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
              >
                <option value="">미분류</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            )}
            <button
              onClick={onHistory}
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
            >
              이력
            </button>
            <button onClick={onCheck} disabled={kw.loading} className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
              style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}>
              {kw.loading ? "확인 중..." : kw.checked ? "수집완료!" : "순위 확인"}
            </button>
            <button onClick={onDelete} className="px-2 py-1.5 rounded-lg text-xs" style={{ color: "var(--color-text-muted)" }}>✕</button>
          </div>
        )}
      </div>
    </>
  );
}

function StatCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
      <p className="text-xs font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>{label}</p>
      <p className="text-3xl font-bold" style={{ color: "var(--color-text-primary)" }}>
        {value}
        <span className="text-sm font-normal ml-1" style={{ color: "var(--color-text-muted)" }}>{unit}</span>
      </p>
    </div>
  );
}
