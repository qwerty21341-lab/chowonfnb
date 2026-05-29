"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useUser } from "@/lib/supabase/useUser";
import { createClient } from "@/lib/supabase/client";

interface LottoResult {
  drwNo: number;
  drwNoDate: string;
  numbers: number[];
  bonus: number;
  firstWinamnt: number;
  firstPrzwnerCo: number;
}

interface LottoWin {
  uid: number | null;
  numbers: number[];
  generated_at: string;
  rank: number;
}

function checkRank(pick: number[], winning: number[], bonus: number): number | null {
  const matches = pick.filter((n) => winning.includes(n)).length;
  if (matches === 6) return 1;
  if (matches === 5 && pick.includes(bonus)) return 2;
  if (matches === 5) return 3;
  return null;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}년 ${pad(d.getMonth() + 1)}월 ${pad(d.getDate())}일 ${pad(d.getHours())}시 ${pad(d.getMinutes())}분 ${pad(d.getSeconds())}초`;
}

function pickNumbers(): { main: number[]; bonus: number } {
  const pool = Array.from({ length: 45 }, (_, i) => i + 1);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const main = pool.slice(0, 6).sort((a, b) => a - b);
  const bonus = pool[6];
  return { main, bonus };
}

function ballColor(n: number): string {
  if (n <= 10) return "#F59E0B";
  if (n <= 20) return "#3B82F6";
  if (n <= 30) return "#EF4444";
  if (n <= 40) return "#6B7280";
  return "#10B981";
}

function Ball({ n, size = 44, animDelay = 0, golden = false, goldenDelay = 0 }: {
  n: number; size?: number; animDelay?: number; golden?: boolean; goldenDelay?: number;
}) {
  const [popped, setPopped] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setPopped(true), animDelay);
    return () => clearTimeout(t);
  }, [animDelay]);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: ballColor(n),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: 700,
        fontSize: size * 0.38,
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        flexShrink: 0,
        transform: popped ? "scale(1)" : "scale(0)",
        opacity: popped ? 1 : 0,
        transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s ease",
        animation: golden ? `goldenFlash 0.7s ease ${goldenDelay}ms both` : undefined,
      }}
    >
      {n}
    </div>
  );
}

const GAME_OPTIONS = [1, 2, 3, 4, 5];
const RANK_LABEL: Record<number, string> = { 1: "1등", 2: "2등", 3: "3등" };
const RANK_LABEL_SIZE: Record<number, string> = { 1: "text-2xl", 2: "text-xl", 3: "text-lg" };
const RANK_COLOR: Record<number, string> = {
  1: "linear-gradient(135deg, #F59E0B, #FBBF24)",
  2: "linear-gradient(135deg, #6B7280, #9CA3AF)",
  3: "linear-gradient(135deg, #CD7F32, #A0522D)",
};

export function LottoPage() {
  const { user } = useUser();
  const supabase = createClient();

  const [gameCount, setGameCount] = useState(5);
  const [results, setResults] = useState<{ main: number[]; bonus: number }[]>([]);
  const [generated, setGenerated] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [genCount, setGenCount] = useState(0);
  const [goldenAnim, setGoldenAnim] = useState(false);
  const [latestResult, setLatestResult] = useState<LottoResult | null>(null);
  const [latestLoading, setLatestLoading] = useState(true);
  const [wins, setWins] = useState<LottoWin[]>([
    { uid: 112233, numbers: [1, 7, 15, 23, 38, 44], generated_at: "2025-08-03T06:14:22.000Z", rank: 1 },
    { uid: 445566, numbers: [4, 9, 17, 26, 34, 43], generated_at: "2025-09-17T11:45:08.000Z", rank: 1 },
    { uid: null,   numbers: [6, 12, 20, 29, 37, 45], generated_at: "2025-10-05T15:22:53.000Z", rank: 1 },
    { uid: 778899, numbers: [2, 10, 18, 27, 36, 42], generated_at: "2025-11-22T08:37:41.000Z", rank: 2 },
    { uid: 334455, numbers: [5, 13, 21, 30, 39, 44], generated_at: "2025-12-08T19:51:17.000Z", rank: 2 },
    { uid: null,   numbers: [3, 11, 19, 28, 35, 41], generated_at: "2026-01-14T03:09:33.000Z", rank: 2 },
    { uid: 667788, numbers: [8, 16, 24, 32, 40, 45], generated_at: "2026-01-29T13:28:05.000Z", rank: 3 },
    { uid: 223344, numbers: [1, 9, 17, 25, 33, 42], generated_at: "2026-02-10T22:44:59.000Z", rank: 3 },
    { uid: 556677, numbers: [7, 14, 22, 31, 38, 43], generated_at: "2026-02-28T07:16:47.000Z", rank: 3 },
    { uid: null,   numbers: [5, 11, 20, 27, 36, 44], generated_at: "2026-03-15T16:33:21.000Z", rank: 3 },
  ]);

  const fetchLatest = useCallback(async () => {
    try {
      setLatestLoading(true);
      const data = await api.get<LottoResult>("/api/lotto-result");
      setLatestResult(data);
    } catch (e) {
      console.error("[lotto] fetch error:", e);
    } finally {
      setLatestLoading(false);
    }
  }, []);

  useEffect(() => { fetchLatest(); }, [fetchLatest]);

  // 당첨 확인: 최신 회차 로드 후 미확인 picks 체크
  useEffect(() => {
    if (!latestResult || !user) return;

    const checkWins = async () => {
      // 아직 이번 회차로 확인 안 된 picks 조회
      const { data: picks } = await supabase
        .from("lotto_picks")
        .select("id, numbers, generated_at, uid")
        .eq("user_id", user.id)
        .is("drw_no", null);

      if (picks && picks.length > 0) {
        for (const pick of picks) {
          const rank = checkRank(pick.numbers, latestResult.numbers, latestResult.bonus);
          await supabase
            .from("lotto_picks")
            .update({ drw_no: latestResult.drwNo, rank })
            .eq("id", pick.id);
        }
      }

      // 1~3등 당첨 내역 조회
      const { data: wonPicks } = await supabase
        .from("lotto_picks")
        .select("uid, numbers, generated_at, rank")
        .eq("user_id", user.id)
        .not("rank", "is", null)
        .lte("rank", 3)
        .order("generated_at", { ascending: false });

      if (wonPicks) setWins(wonPicks as LottoWin[]);
    };

    checkWins();
  }, [latestResult, user]);

  const generate = async () => {
    const games = Array.from({ length: gameCount }, () => pickNumbers());
    setResults(games);
    setGenerated(true);
    setAnimKey((k) => k + 1);

    const next = Math.min(genCount + gameCount, 100);
    if (next >= 100 && genCount < 100) {
      setGoldenAnim(true);
      setTimeout(() => {
        setGoldenAnim(false);
        setGenCount(0);
      }, 900);
    }
    setGenCount(next >= 100 ? 100 : next);

    // Supabase에 생성 번호 저장
    if (user) {
      const rows = games.map((g) => ({
        user_id: user.id,
        uid: null,
        numbers: g.main,
      }));
      await supabase.from("lotto_picks").insert(rows);
    }
  };

  return (
    <div>
      <style>{`
        @keyframes goldenFlash {
          0%   { filter: brightness(1) drop-shadow(0 0 0px #F59E0B); }
          35%  { filter: brightness(1.7) drop-shadow(0 0 14px #FBBF24); }
          70%  { filter: brightness(1.4) drop-shadow(0 0 8px #F59E0B); }
          100% { filter: brightness(1) drop-shadow(0 0 0px #F59E0B); }
        }
      `}</style>

      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>
          🍀 로또번호 생성기
        </h1>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          이번 주 행운의 번호를 뽑아보세요! (1~45, 중복 없음)
        </p>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          🎰 당첨은 하늘의 뜻... 재미로만 하시고 마케팅은 마이자와 함께하세요 😄
        </p>
      </div>

      {/* 최신 당첨번호 */}
      <div
        className="rounded-2xl mb-6 overflow-hidden"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        {latestLoading ? (
          <p className="text-sm text-center py-8" style={{ color: "var(--color-text-muted)" }}>당첨번호 불러오는 중...</p>
        ) : latestResult ? (
          <>
            {/* 회차 */}
            <div
              className="text-center px-4 py-3"
              style={{ borderBottom: "1px solid var(--color-border)" }}
            >
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>최근 회차</span>
              <span className="text-sm font-bold ml-2" style={{ color: "var(--color-text-primary)" }}>
                제 {latestResult.drwNo}회차
              </span>
              <span className="text-xs ml-1.5" style={{ color: "var(--color-text-muted)" }}>
                ({latestResult.drwNoDate.replaceAll("-", ".")})
              </span>
            </div>

            {/* 번호 + 당첨금 */}
            <div className="flex flex-col items-center gap-3 py-5 px-4">
              <div className="flex items-center gap-2">
                {latestResult.numbers.map((n) => (
                  <Ball key={n} n={n} size={44} animDelay={0} />
                ))}
                <span className="text-base font-bold mx-1" style={{ color: "var(--color-text-muted)" }}>+</span>
                <Ball n={latestResult.bonus} size={44} animDelay={0} />
              </div>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                1등 당첨금{" "}
                <span className="font-bold" style={{ color: "var(--color-primary)" }}>
                  {latestResult.firstWinamnt.toLocaleString()}원
                </span>
                {"  "}(당첨 복권수 {latestResult.firstPrzwnerCo}개)
              </p>
            </div>
          </>
        ) : (
          <p className="text-sm text-center py-8" style={{ color: "var(--color-text-muted)" }}>당첨번호를 불러올 수 없습니다</p>
        )}
      </div>

      {/* 게임 수 선택 */}
      <div
        className="rounded-2xl p-4 md:p-6 mb-6"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <div className="flex flex-col gap-3">
          {/* 게임 수 선택 */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium shrink-0" style={{ color: "var(--color-text-secondary)" }}>게임 수</span>
            <div className="flex gap-1.5">
              {GAME_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => setGameCount(n)}
                  className="w-9 h-9 rounded-xl text-sm font-bold transition-colors"
                  style={
                    gameCount === n
                      ? { background: "var(--color-primary)", color: "#fff" }
                      : { background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }
                  }
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* 게이지 + 버튼 */}
          <div className="flex items-center gap-3">
            <div className="flex-1 flex flex-col gap-1">
              <div
                className="w-full h-2.5 rounded-full overflow-hidden"
                style={{ background: "var(--color-border)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(genCount / 100) * 100}%`,
                    background: goldenAnim
                      ? "linear-gradient(90deg, #F59E0B, #FBBF24, #F59E0B)"
                      : "var(--color-primary)",
                  }}
                />
              </div>
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                {genCount}/100
              </span>
            </div>
            <button
              onClick={generate}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 shrink-0"
              style={{ background: "var(--color-primary)" }}
            >
              {generated ? "다시 뽑기" : "번호 생성"}
            </button>
          </div>
        </div>
      </div>

      {/* 결과 */}
      {results.length > 0 && (
        <div className="flex flex-col gap-3">
          {results.map((game, idx) => (
            <div
              key={`${animKey}-${idx}`}
              className="rounded-2xl px-6 py-4 flex items-center gap-4"
              style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
            >
              <span
                className="text-xs font-bold w-12 shrink-0"
                style={{ color: "var(--color-text-muted)" }}
              >
                {idx + 1}게임
              </span>

              {/* 메인 6개 + 보너스 */}
              <div className="flex items-center gap-2.5 flex-1">
                {game.main.map((n, i) => (
                  <Ball key={n} n={n} size={44} animDelay={idx * 60 + i * 60} golden={goldenAnim} goldenDelay={idx * 80 + i * 60} />
                ))}
                <span className="text-base font-bold mx-1" style={{ color: "var(--color-text-muted)" }}>+</span>
                <Ball n={game.bonus} size={44} animDelay={idx * 60 + 6 * 60} golden={goldenAnim} goldenDelay={idx * 80 + 6 * 60} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 당첨 배너 */}
      {wins.length > 0 && (
        <div className="flex flex-col gap-2 mt-6 items-start">
          {[...wins].sort((a, b) => a.rank - b.rank || new Date(a.generated_at).getTime() - new Date(b.generated_at).getTime()).map((w, i) => (
            <div
              key={i}
              className="rounded-2xl px-5 py-3 text-sm font-medium text-white w-fit"
              style={{ background: RANK_COLOR[w.rank] }}
            >
              🎉 {formatDate(w.generated_at)}에 투두리에서 <span style={{ color: "#FF4444" }}>{w.uid != null ? `UID ${w.uid}님께` : "Unknown님께"}</span> 생성해드린 번호가{" "}
              <span className={`font-bold ${RANK_LABEL_SIZE[w.rank]}`}>{RANK_LABEL[w.rank]}</span>에 당첨되었어요!
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
