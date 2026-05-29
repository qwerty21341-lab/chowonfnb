"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// ── 상수 ──────────────────────────────────────────────
const CATEGORIES = [
  { label: "미용실", emoji: "✂️" },
  { label: "음식점", emoji: "🍽️" },
  { label: "네일샵", emoji: "💅" },
  { label: "학원", emoji: "📚" },
  { label: "병원/의원", emoji: "🏥" },
  { label: "카페", emoji: "☕" },
  { label: "헬스장/PT", emoji: "💪" },
  { label: "소매점/매장", emoji: "🛍️" },
  { label: "서비스업", emoji: "🔧" },
  { label: "기타", emoji: "🏢" },
];

const TARGET_TAGS = ["혼밥/혼자", "가족", "직장인", "연인/데이트", "학생", "중장년층", "외국인", "단체/모임"];
const DAYS = ["월", "화", "수", "목", "금", "토", "일"] as const;
type Day = typeof DAYS[number];
const WEEK_LABELS = ["1째주", "2째주", "3째주", "4째주", "5째주"] as const;
const DAY_DOW: Record<Day, number> = { 월: 1, 화: 2, 수: 3, 목: 4, 금: 5, 토: 6, 일: 0 };
const WEEK_ORDINALS = ["첫", "둘", "셋", "넷", "다섯"];

// ── 타입 ──────────────────────────────────────────────
interface DayHours { open: string; close: string; }
interface ClosedDayRule { day: Day; weeks: number[]; } // [] = 매주
interface Holiday { dateName: string; locdate: number; }

interface BusinessProfile {
  name: string;
  category: string;
  ownerName: string;
  includeOwnerInReply: boolean;
  address: string;
  directions: string;
  hasParking: boolean;
  parkingDetail: string;
  showParkingDetail: boolean;
  hasDifferentHours: boolean;
  hours: string;
  hoursByDay: Record<Day, DayHours>;
  hasClosedDays: boolean;
  closedDays: ClosedDayRule[];
  hasReservation: boolean;
  reservationLinks: string[];
  strengths: string;
  services: string;
  priceRange: string;
  targets: string[];
  naverPlace: string;
  instagram: string;
  kakao: string;
}

// ── 날짜 유틸 ──────────────────────────────────────────
function getWeekdaysInMonth(year: number, month: number, dow: number): Date[] {
  const result: Date[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    if (date.getDay() === dow) result.push(date);
  }
  return result;
}

function computeClosedDates(rules: ClosedDayRule[], year: number, month: number): Set<string> {
  const set = new Set<string>();
  for (const rule of rules) {
    const occurrences = getWeekdaysInMonth(year, month, DAY_DOW[rule.day]);
    const toMark = rule.weeks.length === 0
      ? occurrences
      : rule.weeks.map(w => occurrences[w - 1]).filter(Boolean);
    toMark.forEach(d =>
      set.add(`${year}-${String(month).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`)
    );
  }
  return set;
}

function ruleToText(rule: ClosedDayRule): string {
  if (rule.weeks.length === 0) return `매주 ${rule.day}요일`;
  const labels = [...rule.weeks].sort((a, b) => a - b).map(w => `${WEEK_ORDINALS[w - 1]}째`).join("·");
  return `매월 ${labels} ${rule.day}요일`;
}

// ── 기본값 ──────────────────────────────────────────────
const DEFAULT_HOURS_BY_DAY: Record<Day, DayHours> = {
  월: { open: "09:00", close: "21:00" },
  화: { open: "09:00", close: "21:00" },
  수: { open: "09:00", close: "21:00" },
  목: { open: "09:00", close: "21:00" },
  금: { open: "09:00", close: "21:00" },
  토: { open: "09:00", close: "18:00" },
  일: { open: "09:00", close: "18:00" },
};

const DEFAULT_PROFILE: BusinessProfile = {
  name: "", category: "", ownerName: "", includeOwnerInReply: false,
  address: "", directions: "",
  hasParking: false, parkingDetail: "", showParkingDetail: false,
  hasDifferentHours: false, hours: "",
  hoursByDay: DEFAULT_HOURS_BY_DAY,
  hasClosedDays: false, closedDays: [],
  hasReservation: false, reservationLinks: [],
  strengths: "", services: "", priceRange: "", targets: [],
  naverPlace: "", instagram: "", kakao: "",
};

// ── 공통 컴포넌트 ──────────────────────────────────────
function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle}
      className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0"
      style={{ background: on ? "var(--color-primary)" : "var(--color-border)" }}>
      <span className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform"
        style={{ transform: on ? "translateX(18px)" : "translateX(2px)" }} />
    </button>
  );
}

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none" onClick={onChange}>
      <span className="w-4 h-4 rounded flex items-center justify-center shrink-0"
        style={{
          background: checked ? "var(--color-primary)" : "var(--color-bg)",
          border: `1.5px solid ${checked ? "var(--color-primary)" : "var(--color-border)"}`,
        }}>
        {checked && <span className="text-white text-xs leading-none">✓</span>}
      </span>
      <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{label}</span>
    </label>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold mb-4 uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
      {children}
    </p>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
        {label}
      </label>
      {children}
      {hint && <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>{hint}</p>}
    </div>
  );
}

function TimeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const parts = value.split(":");
  const h = parseInt(parts[0] ?? "9", 10);
  const m = parseInt(parts[1] ?? "0", 10);
  const update = (newH: number, newM: number) =>
    onChange(`${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`);
  const selectCls = "px-2 py-1.5 rounded-lg text-sm outline-none text-center appearance-none";
  const selectStyle = {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    color: "var(--color-text-primary)",
  };
  return (
    <div className="flex items-center gap-1">
      <select value={h} onChange={(e) => update(Number(e.target.value), m)} className={selectCls} style={selectStyle}>
        {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2, "0")}</option>)}
      </select>
      <span className="text-sm font-bold" style={{ color: "var(--color-text-muted)" }}>:</span>
      <select value={m} onChange={(e) => update(h, Number(e.target.value))} className={selectCls} style={selectStyle}>
        {Array.from({ length: 60 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2, "0")}</option>)}
      </select>
    </div>
  );
}

// ── 달력 컴포넌트 ──────────────────────────────────────
function MiniCalendar({ year, month, closedDates, holidays }: {
  year: number; month: number;
  closedDates: Set<string>; holidays: Holiday[];
}) {
  const holidayMap = new Map(holidays.map(h => [String(h.locdate), h.dateName]));
  const firstDow = new Date(year, month - 1, 1).getDay();
  const offset = firstDow === 0 ? 6 : firstDow - 1;
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      <p className="text-xs font-semibold mb-2 text-center" style={{ color: "var(--color-text-secondary)" }}>
        {year}년 {month}월
      </p>
      <div className="grid grid-cols-7 gap-px text-center">
        {["월", "화", "수", "목", "금", "토", "일"].map((d, i) => (
          <div key={d} className="text-xs py-1"
            style={{ color: i >= 5 ? "#EF4444" : "var(--color-text-muted)" }}>
            {d}
          </div>
        ))}
        {cells.map((d, idx) => {
          if (!d) return <div key={`e${idx}`} className="py-1" />;
          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const isClosed = closedDates.has(dateStr);
          const holidayName = holidayMap.get(dateStr.replace(/-/g, ""));
          const dow = idx % 7;
          const isWeekend = dow >= 5;
          return (
            <div key={d} className="relative flex items-center justify-center rounded"
              style={{
                background: isClosed ? "#1F2937" : "transparent",
                height: "22px",
              }}>
              <span className="text-xs"
                style={{
                  color: isClosed && holidayName ? "#FCA5A5"
                    : isClosed ? "#E5E7EB"
                    : holidayName || isWeekend ? "#EF4444"
                    : "var(--color-text-secondary)",
                  fontWeight: isClosed ? 600 : 400,
                }}>
                {d}
              </span>
              {holidayName && (
                <span className="absolute w-full text-center"
                  style={{
                    fontSize: "6px",
                    color: "var(--color-text-muted)",
                    bottom: "-8px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    pointerEvents: "none",
                  }}>
                  {holidayName.replace("대체공휴일", "대체")}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* 공휴일 목록 */}
      {holidays.length > 0 && (
        <div className="mt-2 pt-2 space-y-1" style={{ borderTop: "1px solid var(--color-border)" }}>
          {holidays.map(h => {
            const s = String(h.locdate);
            const day = parseInt(s.slice(6));
            const dowIdx = new Date(year, month - 1, day).getDay();
            const dowLabel = ["일", "월", "화", "수", "목", "금", "토"][dowIdx];
            const dateStr = s.slice(0, 4) + "-" + s.slice(4, 6) + "-" + s.slice(6);
            const isClosed = closedDates.has(dateStr);
            return (
              <div key={h.locdate} className="flex items-center gap-2 text-xs">
                <span style={{ color: "#EF4444", minWidth: 48 }}>
                  {month}/{day}({dowLabel})
                </span>
                <span style={{ color: "var(--color-text-secondary)" }}>{h.dateName}</span>
                {isClosed && (
                  <span className="px-1.5 py-0.5 rounded text-xs"
                    style={{ background: "#1F2937", color: "#9CA3AF", fontSize: "10px" }}>
                    휴무
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const inputCls = "w-full px-3 py-2.5 rounded-xl text-sm outline-none";
const inputStyle = {
  background: "var(--color-bg)",
  border: "1px solid var(--color-border)",
  color: "var(--color-text-primary)",
} as const;

// ── 메인 컴포넌트 ──────────────────────────────────────
const BUSINESS_KEY = "tduri_business";

export function BusinessSettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<BusinessProfile>(DEFAULT_PROFILE);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [linkInput, setLinkInput] = useState("");
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  const now = new Date();
  const months = (() => {
    const cur = { year: now.getFullYear(), month: now.getMonth() + 1 };
    const next = now.getMonth() === 11
      ? { year: now.getFullYear() + 1, month: 1 }
      : { year: now.getFullYear(), month: now.getMonth() + 2 };
    return [cur, next];
  })();

  // 공휴일 fetch (현재 + 다음 달)
  useEffect(() => {
    const fetchMonth = async (year: number, month: number) => {
      try {
        const r = await fetch(`/todolist/api/holidays?year=${year}&month=${month}`);
        const d = await r.json();
        return (d.items ?? []) as Holiday[];
      } catch { return []; }
    };
    Promise.all(months.map(m => fetchMonth(m.year, m.month)))
      .then(results => setHolidays(results.flat()));
  }, []); // eslint-disable-line

  // localStorage에서 불러오기
  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(BUSINESS_KEY) ?? "null");
      if (!parsed) return;
      const rawClosed = parsed.closedDays ?? [];
      const closedDays: ClosedDayRule[] = rawClosed.map((item: Day | ClosedDayRule) =>
        typeof item === "string" ? { day: item, weeks: [] } : item
      );
      setProfile({
        ...DEFAULT_PROFILE, ...parsed,
        hoursByDay: { ...DEFAULT_HOURS_BY_DAY, ...(parsed.hoursByDay ?? {}) },
        reservationLinks: parsed.reservationLinks ?? [],
        closedDays,
      });
    } catch { /* 무시 */ }
  }, []);

  const set = <K extends keyof BusinessProfile>(key: K, value: BusinessProfile[K]) =>
    setProfile(prev => ({ ...prev, [key]: value }));

  const toggleTarget = (tag: string) =>
    setProfile(prev => ({
      ...prev,
      targets: prev.targets.includes(tag) ? prev.targets.filter(t => t !== tag) : [...prev.targets, tag],
    }));

  // 휴무 요일 규칙 핸들러
  const toggleClosedDay = (day: Day) =>
    setProfile(prev => {
      const exists = prev.closedDays.some(r => r.day === day);
      return {
        ...prev,
        closedDays: exists
          ? prev.closedDays.filter(r => r.day !== day)
          : [...prev.closedDays, { day, weeks: [] }],
      };
    });

  const setEveryWeek = (day: Day) =>
    setProfile(prev => ({
      ...prev,
      closedDays: prev.closedDays.map(r => r.day === day ? { ...r, weeks: [] } : r),
    }));

  const toggleRuleWeek = (day: Day, week: number) =>
    setProfile(prev => ({
      ...prev,
      closedDays: prev.closedDays.map(r => {
        if (r.day !== day) return r;
        const weeks = r.weeks.includes(week)
          ? r.weeks.filter(w => w !== week)
          : [...r.weeks, week].sort((a, b) => a - b);
        return { ...r, weeks };
      }),
    }));

  const setDayHours = (day: Day, field: keyof DayHours, value: string) =>
    setProfile(prev => ({
      ...prev,
      hoursByDay: { ...prev.hoursByDay, [day]: { ...prev.hoursByDay[day], [field]: value } },
    }));

  const setDayHours2 = (day: Day, open: string, close: string) =>
    setProfile(prev => ({
      ...prev,
      hoursByDay: { ...prev.hoursByDay, [day]: { ...prev.hoursByDay[day], open, close } },
    }));

  const addLink = () => {
    const url = linkInput.trim();
    if (!url) return;
    setProfile(prev => {
      const deduped = Array.from(new Set([...prev.reservationLinks, url]));
      return { ...prev, reservationLinks: deduped.slice(0, 3) };
    });
    setLinkInput("");
  };

  const removeLink = (url: string) =>
    setProfile(prev => ({ ...prev, reservationLinks: prev.reservationLinks.filter(l => l !== url) }));

  const fillDummy = () => {
    setProfile({
      ...DEFAULT_PROFILE,
      name: "단소상회",
      category: "음식점",
      ownerName: "김단소",
      includeOwnerInReply: true,
      address: "서울시 강남구 역삼동 123-4",
      directions: "2호선 역삼역 1번 출구에서 도보 3분",
      hasParking: true,
      parkingDetail: "건물 지하 주차장 2시간 무료",
      showParkingDetail: true,
      hasDifferentHours: false,
      hours: "11:00 - 21:00",
      hoursByDay: DEFAULT_HOURS_BY_DAY,
      hasClosedDays: true,
      closedDays: [{ day: "월" as Day, weeks: [] }],
      hasReservation: true,
      reservationLinks: ["https://booking.naver.com/sample"],
      strengths: "20년 경력 노포, 국내산 한우만 사용, 당일 예약 가능",
      services: "소고기 구이, 냉면, 된장찌개",
      priceRange: "1인 25,000~45,000원",
      targets: ["가족", "직장인", "단체/모임"],
      naverPlace: "https://map.naver.com/v5/search/단소상회",
      instagram: "@dansosanghoe",
      kakao: "",
    });
  };

  const saveProfile = () => {
    setSaveError(null);
    try {
      localStorage.setItem(BUSINESS_KEY, JSON.stringify(profile));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setSaveError("저장에 실패했습니다");
    }
  };

  // 영업시간 테이블: 매주 휴무인 요일만 비활성화
  const isFullyClosed = (day: Day) =>
    profile.hasClosedDays && profile.closedDays.some(r => r.day === day && r.weeks.length === 0);

  // 달력용 휴무 날짜 계산
  const closedDatesByMonth = months.map(({ year, month }) =>
    computeClosedDates(profile.hasClosedDays ? profile.closedDays : [], year, month)
  );

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <button onClick={() => router.back()} className="flex items-center gap-1 text-sm mb-4"
              style={{ color: "var(--color-text-muted)" }}>
              ‹ 설정
            </button>
            <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>업체 설정</h1>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              입력한 정보는 모든 AI 기능에 자동으로 적용됩니다
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
              *언제든지 추가, 변경, 삭제 할 수 있어요
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl space-y-4">

        {/* ── 기본 정보 ── */}
        <div className="rounded-2xl p-6" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <SectionLabel>기본 정보</SectionLabel>
          <div className="space-y-3">
            <Field label="업체명 *">
              <input type="text" placeholder="예: 단소상회" value={profile.name}
                onChange={(e) => set("name", e.target.value)} className={inputCls} style={inputStyle} />
            </Field>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
                대표자명
              </label>
              <div className="flex items-center gap-3">
                <input type="text" placeholder="예: 김민준" value={profile.ownerName}
                  onChange={(e) => set("ownerName", e.target.value)}
                  className={inputCls + " flex-1"} style={inputStyle} />
                <Checkbox checked={profile.includeOwnerInReply}
                  onChange={() => set("includeOwnerInReply", !profile.includeOwnerInReply)}
                  label="리뷰 답글에 이름 포함" />
              </div>
            </div>
            <Field label="업종 *">
              <div className="grid grid-cols-5 gap-2 mt-1">
                {CATEGORIES.map((cat) => (
                  <button key={cat.label}
                    onClick={() => set("category", profile.category === cat.label ? "" : cat.label)}
                    className="flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-medium"
                    style={{
                      background: profile.category === cat.label ? "var(--color-primary)" : "var(--color-bg)",
                      border: `1px solid ${profile.category === cat.label ? "var(--color-primary)" : "var(--color-border)"}`,
                      color: profile.category === cat.label ? "#fff" : "var(--color-text-secondary)",
                    }}>
                    <span className="text-base">{cat.emoji}</span>
                    {cat.label}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        </div>

        {/* ── 위치 ── */}
        <div className="rounded-2xl p-6" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <SectionLabel>위치</SectionLabel>
          <div className="space-y-3">
            <Field label="주소">
              <input type="text" placeholder="예: 서울시 강남구 테헤란로 123" value={profile.address}
                onChange={(e) => set("address", e.target.value)} className={inputCls} style={inputStyle} />
            </Field>
            <Field label="오시는 길" hint="지하철역·버스정류장·랜드마크 기준으로 작성하면 SEO에 유리합니다">
              <textarea rows={2} placeholder="예: 강남역 2번 출구 도보 3분, 스타벅스 옆 건물 2층"
                value={profile.directions} onChange={(e) => set("directions", e.target.value)}
                className={inputCls + " resize-none"} style={inputStyle} />
            </Field>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Toggle on={profile.hasParking} onToggle={() => set("hasParking", !profile.hasParking)} />
                <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>주차 가능</span>
                {profile.hasParking && (
                  <Checkbox checked={profile.showParkingDetail}
                    onChange={() => set("showParkingDetail", !profile.showParkingDetail)}
                    label="상세 정보 입력" />
                )}
              </div>
              {profile.hasParking && profile.showParkingDetail && (
                <input type="text"
                  placeholder="예: 건물 지하 주차장, 2시간 무료 / 발렛 가능"
                  value={profile.parkingDetail}
                  onChange={(e) => set("parkingDetail", e.target.value)}
                  className={inputCls} style={inputStyle} />
              )}
            </div>
          </div>
        </div>

        {/* ── 운영 정보 ── */}
        <div className="rounded-2xl p-6" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <SectionLabel>운영 정보</SectionLabel>
          <div className="space-y-4">

            <div className="flex flex-wrap gap-4">
              <Checkbox checked={profile.hasClosedDays}
                onChange={() => set("hasClosedDays", !profile.hasClosedDays)}
                label="휴무일이 있어요" />
              <Checkbox checked={profile.hasDifferentHours}
                onChange={() => set("hasDifferentHours", !profile.hasDifferentHours)}
                label="요일별로 시간이 달라요" />
            </div>

            {/* 휴무 요일 + 주차 선택 */}
            {profile.hasClosedDays && (
              <div className="space-y-3">
                <p className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>휴무 요일</p>

                {/* 요일 버튼 */}
                <div className="flex gap-2">
                  {DAYS.map((day) => {
                    const isActive = profile.closedDays.some(r => r.day === day);
                    const isWeekend = day === "토" || day === "일";
                    return (
                      <button key={day} onClick={() => toggleClosedDay(day)}
                        className="w-9 h-9 rounded-lg text-sm font-medium transition-colors"
                        style={{
                          background: isActive ? (isWeekend ? "#FEF2F2" : "#1F2937") : "var(--color-bg)",
                          border: `1px solid ${isActive ? (isWeekend ? "#FECACA" : "#374151") : "var(--color-border)"}`,
                          color: isActive ? (isWeekend ? "#EF4444" : "#9CA3AF") : "var(--color-text-secondary)",
                        }}>
                        {day}
                      </button>
                    );
                  })}
                </div>

                {/* 선택된 요일의 주차 세부 설정 */}
                {profile.closedDays.map(rule => (
                  <div key={rule.day} className="flex items-center gap-2 flex-wrap pl-1">
                    <span className="text-xs font-semibold w-10" style={{ color: "var(--color-text-secondary)" }}>
                      {rule.day}요일
                    </span>
                    <button onClick={() => setEveryWeek(rule.day)}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                      style={{
                        background: rule.weeks.length === 0 ? "var(--color-primary)" : "var(--color-bg)",
                        border: `1px solid ${rule.weeks.length === 0 ? "var(--color-primary)" : "var(--color-border)"}`,
                        color: rule.weeks.length === 0 ? "#fff" : "var(--color-text-secondary)",
                      }}>
                      매주
                    </button>
                    {WEEK_LABELS.map((label, i) => {
                      const weekNum = i + 1;
                      const isOn = rule.weeks.includes(weekNum);
                      return (
                        <button key={weekNum} onClick={() => toggleRuleWeek(rule.day, weekNum)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                          style={{
                            background: isOn ? "var(--color-primary)" + "20" : "var(--color-bg)",
                            border: `1px solid ${isOn ? "var(--color-primary)" : "var(--color-border)"}`,
                            color: isOn ? "var(--color-primary)" : "var(--color-text-secondary)",
                          }}>
                          {label}
                        </button>
                      );
                    })}
                  </div>
                ))}

                {/* 텍스트 요약 */}
                {profile.closedDays.length > 0 && (
                  <p className="text-xs pl-1" style={{ color: "var(--color-text-muted)" }}>
                    {profile.closedDays.map(ruleToText).join(", ")} 휴무
                  </p>
                )}

                {/* 달력 미리보기 */}
                {profile.closedDays.length > 0 && (
                  <div className="p-4 rounded-xl" style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
                    <p className="text-xs font-medium mb-3" style={{ color: "var(--color-text-secondary)" }}>
                      휴무 미리보기
                      <span className="ml-2 font-normal" style={{ color: "var(--color-text-muted)" }}>
                        · 어두운 날 = 휴무 · 빨간 점 = 공휴일
                      </span>
                    </p>
                    <div className="grid grid-cols-2 gap-6">
                      {months.map(({ year, month }, i) => (
                        <MiniCalendar key={`${year}-${month}`}
                          year={year} month={month}
                          closedDates={closedDatesByMonth[i]}
                          holidays={holidays.filter(h => {
                            const s = String(h.locdate);
                            return parseInt(s.slice(0, 4)) === year && parseInt(s.slice(4, 6)) === month;
                          })}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 영업시간 */}
            {profile.hasDifferentHours ? (
              <div>
                <p className="text-xs font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>
                  요일별 영업시간
                </p>
                <div className="space-y-1.5">
                  <div className="rounded-xl overflow-hidden"
                    style={{ border: "2px solid var(--color-border)" }}>
                    {/* 전체 일괄 설정 행 */}
                    <div className="flex items-center gap-3 px-3 py-2"
                      style={{ background: "color-mix(in srgb, var(--color-primary) 8%, var(--color-bg-card))" }}>
                      <span className="text-sm font-bold shrink-0" style={{ color: "var(--color-primary)", minWidth: 28 }}>전체</span>
                      <div className="flex items-center gap-2 flex-1">
                        <TimeInput value={profile.hoursByDay["월"].open}
                          onChange={(v) => setProfile(prev => ({
                            ...prev,
                            hoursByDay: Object.fromEntries(DAYS.map(d => [d, { ...prev.hoursByDay[d], open: v }])) as Record<Day, DayHours>,
                          }))} />
                        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>~</span>
                        <TimeInput value={profile.hoursByDay["월"].close}
                          onChange={(v) => setProfile(prev => ({
                            ...prev,
                            hoursByDay: Object.fromEntries(DAYS.map(d => [d, { ...prev.hoursByDay[d], close: v }])) as Record<Day, DayHours>,
                          }))} />
                        <div className="flex-1" />
                        <button
                          onClick={() => setProfile(prev => ({
                            ...prev,
                            hoursByDay: Object.fromEntries(DAYS.map(d => [d, { ...prev.hoursByDay[d], open: "10:00", close: "22:00" }])) as Record<Day, DayHours>,
                          }))}
                          className="text-xs px-2 py-0.5 rounded-md"
                          style={{
                            color: "var(--color-text-muted)",
                            border: "1px solid color-mix(in srgb, var(--color-border) 60%, transparent)",
                            background: "transparent",
                          }}>
                          초기화
                        </button>
                      </div>
                    </div>
                    {/* 구분선 */}
                    <div style={{ height: "2px", background: "var(--color-border)" }} />
                    {DAYS.map((day, idx) => {
                      const closed = isFullyClosed(day);
                      const isWeekend = day === "토" || day === "일";
                      return (
                        <div key={day}
                          className="flex items-center gap-3 px-3 py-2"
                          style={{
                            background: "var(--color-bg-card)",
                            borderTop: idx > 0 ? "1px solid color-mix(in srgb, var(--color-border) 40%, transparent)" : undefined,
                            opacity: closed ? 0.4 : 1,
                          }}>
                          <span className="text-sm font-semibold shrink-0"
                            style={{ minWidth: 28, color: isWeekend ? "#EF4444" : "var(--color-text-primary)" }}>
                            {day}
                          </span>
                          {closed ? (
                            <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>휴무</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <TimeInput value={profile.hoursByDay[day].open}
                                onChange={(v) => setDayHours(day, "open", v)} />
                              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>~</span>
                              <TimeInput value={profile.hoursByDay[day].close}
                                onChange={(v) => setDayHours(day, "close", v)} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <Field label="영업시간">
                <div className="flex items-center gap-2">
                  <TimeInput value={profile.hours || "09:00"}
                    onChange={(v) => set("hours", v)} />
                  <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>~</span>
                  <TimeInput value={profile.hours?.split("~")[1]?.trim() || "21:00"}
                    onChange={(v) => {
                      const open = profile.hours?.split("~")[0]?.trim() || "09:00";
                      set("hours", `${open} ~ ${v}`);
                    }} />
                </div>
              </Field>
            )}

            {/* 예약 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Toggle on={profile.hasReservation} onToggle={() => set("hasReservation", !profile.hasReservation)} />
                <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>예약 가능</span>
              </div>
              {profile.hasReservation && (
                <div className="space-y-2 pl-1">
                  <p className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
                    예약 링크 <span style={{ color: "var(--color-text-muted)" }}>({profile.reservationLinks.length}/3)</span>
                  </p>
                  {profile.reservationLinks.map((link) => (
                    <div key={link} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                      style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
                      <span className="text-xs flex-1 truncate" style={{ color: "var(--color-text-secondary)" }}>{link}</span>
                      <button onClick={() => removeLink(link)} className="text-xs shrink-0" style={{ color: "var(--color-text-muted)" }}>✕</button>
                    </div>
                  ))}
                  {profile.reservationLinks.length < 3 && (
                    <div className="flex gap-2">
                      <input type="text" placeholder="예: https://booking.naver.com/..."
                        value={linkInput} onChange={(e) => setLinkInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addLink()}
                        className={inputCls + " flex-1"} style={inputStyle} />
                      <button onClick={addLink} disabled={!linkInput.trim()}
                        className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-40 shrink-0"
                        style={{ background: "var(--color-primary)" }}>
                        추가
                      </button>
                    </div>
                  )}
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    네이버 예약, 카카오 예약, 자체 예약 페이지 등 최대 3개 · 중복 링크 자동 제거
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── 업체 특징 ── */}
        <div className="rounded-2xl p-6" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <SectionLabel>업체 특징</SectionLabel>
          <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>
            AI가 소개글·답글·콘텐츠 생성 시 가장 많이 참고합니다. 구체적일수록 좋아요.
          </p>
          <div className="space-y-3">
            <Field label="핵심 강점">
              <textarea rows={2} placeholder="예: 20년 경력, 국내산 재료만 사용, 당일 예약 가능"
                value={profile.strengths} onChange={(e) => set("strengths", e.target.value)}
                className={inputCls + " resize-none"} style={inputStyle} />
            </Field>
            <Field label="주요 서비스 / 메뉴">
              <textarea rows={2} placeholder="예: 수제 돈까스, 점심 특선 9,900원, 단체 케이터링"
                value={profile.services} onChange={(e) => set("services", e.target.value)}
                className={inputCls + " resize-none"} style={inputStyle} />
            </Field>
            <Field label="가격대">
              <input type="text" placeholder="예: 1인 1만원대, 런치 9,900원" value={profile.priceRange}
                onChange={(e) => set("priceRange", e.target.value)} className={inputCls} style={inputStyle} />
            </Field>
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>
                주요 고객층
              </label>
              <div className="flex flex-wrap gap-2">
                {TARGET_TAGS.map((tag) => (
                  <button key={tag} onClick={() => toggleTarget(tag)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{
                      background: profile.targets.includes(tag) ? "var(--color-primary)" : "var(--color-bg)",
                      border: `1px solid ${profile.targets.includes(tag) ? "var(--color-primary)" : "var(--color-border)"}`,
                      color: profile.targets.includes(tag) ? "#fff" : "var(--color-text-secondary)",
                    }}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── SNS / 플랫폼 ── */}
        <div className="rounded-2xl p-6" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <SectionLabel>SNS / 플랫폼 링크</SectionLabel>
          <div className="space-y-3">
            {[
              { key: "naverPlace", label: "네이버 플레이스", placeholder: "https://naver.me/..." },
              { key: "instagram", label: "인스타그램", placeholder: "@username 또는 URL" },
              { key: "kakao", label: "카카오 채널", placeholder: "https://pf.kakao.com/..." },
            ].map(({ key, label, placeholder }) => (
              <Field key={key} label={label}>
                <input type="text" placeholder={placeholder}
                  value={profile[key as keyof BusinessProfile] as string}
                  onChange={(e) => set(key as keyof BusinessProfile, e.target.value as never)}
                  className={inputCls} style={inputStyle} />
              </Field>
            ))}
          </div>
        </div>

        {/* 저장 */}
        {saveError && (
          <div className="px-4 py-3 rounded-xl text-sm" style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", color: "#DC2626" }}>
            저장 실패: {saveError}
          </div>
        )}
        <button onClick={saveProfile}
          className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white transition-colors"
          style={{ background: saved ? "var(--color-success)" : "var(--color-primary)" }}>
          {saved ? "✓ 저장되었습니다" : "저장하기"}
        </button>

      </div>
    </div>
  );
}
