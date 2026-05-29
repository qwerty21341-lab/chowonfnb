"use client";

import { useState, useRef } from "react";
import { api } from "@/lib/api";

export interface OnboardingConfig {
  platform: "naver" | "google" | "kakao";
  platformName: string;
  platformColor: string;
  platformLogo: string;
}

type StepItem = { text: string; inlineLink?: { label: string; href: string } };

/* ─── 플랫폼별 채널 생성 가이드 ──────────────────────────────── */
const CHANNEL_GUIDES: Record<string, {
  steps: StepItem[];
  link: string;
  linkText: string;
  tip: string;
}> = {
  naver: {
    steps: [
      { text: " 접속 후 '업체 등록' 클릭", inlineLink: { label: "스마트플레이스", href: "https://smartplace.naver.com" } },
      { text: "사업자등록번호 입력 또는 '사업자 없음' 선택 → 업체명 · 주소 · 전화번호 입력" },
      { text: "업종 카테고리 선택 — 대표 업종 1개 + 추가 업종 최대 5개까지 설정 가능" },
      { text: "영업시간 · 주차 · 예약 가능 여부 설정, '업체 소개 및 키워드' 탭에서 대표 키워드 직접 입력" },
      { text: "대표 이미지 최소 3장 이상 업로드 후 검수 신청 (심사 2~3 영업일)" },
    ],
    link: "https://smartplace.naver.com",
    linkText: "스마트플레이스 바로가기 →",
    tip: "카테고리는 나중에 수정하면 재검수가 필요합니다. 처음에 정확히 설정하세요. 키워드는 지역명 포함 2~3개가 효과적입니다.",
  },
  google: {
    steps: [
      { text: " 접속 후 비즈니스 이름 검색", inlineLink: { label: "Google 비즈니스 프로필", href: "https://business.google.com" } },
      { text: "기존 업체가 있으면 '소유권 주장', 없으면 '비즈니스 추가' 선택" },
      { text: "업종 카테고리 · 주소 · 전화번호 · 웹사이트(선택) 입력" },
      { text: "인증 방법 선택 — 영상 촬영(매장 내·외부) / 전화 / 문자 / 이메일 중 제시되는 옵션으로" },
      { text: "인증 완료 후 영업시간·메뉴·사진·소개 등 정보를 최대한 채워 넣기" },
    ],
    link: "https://business.google.com",
    linkText: "Google 비즈니스 바로가기 →",
    tip: "2024년 기준 영상 인증(매장 내외부 촬영)이 가장 일반적입니다. 우편 인증은 거의 제공되지 않습니다. 정보를 100% 입력할수록 Google 검색·지도 노출에 유리합니다.",
  },
  kakao: {
    steps: [
      { text: " 접속 → '카카오톡 채널' 관리자 센터 진입", inlineLink: { label: "카카오비즈니스", href: "https://business.kakao.com" } },
      { text: "채널 개설 → 채널명 · 카테고리 · 프로필 사진 · 한줄 소개 입력" },
      { text: "카카오맵 업체 등록: ", inlineLink: { label: "카카오맵 사업자 등록", href: "https://business.kakao.com/info/kakaomapbiz" }, },
      { text: "업체명 · 주소 · 전화번호 · 영업시간 · 대표 이미지 등록 (심사 2~5 영업일)" },
      { text: "카카오맵 업체 페이지 → '채널 연결' 메뉴에서 개설한 카카오채널과 연결" },
    ],
    link: "https://business.kakao.com",
    linkText: "카카오비즈니스 바로가기 →",
    tip: "카카오채널(메시지·쿠폰)과 카카오맵(지도 노출)은 별도 개설 후 연결해야 합니다. 채널 홈을 예쁘게 꾸며야 친구 추가율이 높아집니다.",
  },
};

/* ─── 예약메뉴 & 쿠폰 가이드 ──────────────────────────────────── */
const RESERVATION_GUIDES = {
  naver: [
    "스마트플레이스 → 좌측 메뉴 '예약·주문' 탭 진입",
    "이용 서비스 선택: 네이버 예약(무료) 또는 네이버 주문 중 택 1",
    "서비스 항목 추가: 메뉴명 · 가격 · 소요시간 · 최대 인원 설정",
    "예약 가능 요일·시간 캘린더 설정, 선불/후불 여부 결정",
    "취소 정책(무료 취소 기한) 설정 후 저장 — 명확할수록 노쇼 감소",
  ],
  google: [
    "Google 비즈니스 프로필 → '예약 링크 추가' 항목 진입",
    "네이버 예약·카카오 예약 등 기존 예약 URL을 직접 붙여넣기",
    "또는 '서비스' 탭에서 제공 서비스 항목과 가격 직접 등록 (예약 연동 없이도 정보 표시)",
    "Google Maps에서 고객이 바로 예약 버튼을 누를 수 있게 됨",
  ],
  kakao: [
    "카카오채널 관리자 → '채널 홈 관리' → 버튼 편집",
    "버튼 추가: '예약하기' 텍스트 + 네이버 예약·자체 예약 URL 연결",
    "카카오맵 업체 페이지 → '예약' 탭 → 예약 URL 또는 전화 예약으로 설정",
    "카카오 챗봇(선택): 자동 응답으로 예약 문의 처리 설정 가능",
  ],
} as const;

const COUPON_GUIDES = {
  naver: [
    "스마트플레이스 → 좌측 메뉴 '혜택·이벤트' → '쿠폰' 탭 진입",
    "쿠폰 종류 선택: 할인 쿠폰 / 서비스(무료 제공) 쿠폰 / 스탬프 쿠폰 중 택 1",
    "혜택 내용 · 사용 조건 · 유효기간 · 발급 수량(무제한 가능) 설정",
    "QR코드 또는 바코드 자동 생성 — 매장에서 스캔으로 확인·소진 처리",
    "발행 후 '공유하기'로 SNS·카카오톡에 배포, 네이버 플레이스 페이지에도 자동 노출",
  ],
  google: [
    "Google 비즈니스 프로필 → '게시물' 탭 진입",
    "'혜택' 유형 선택 후 할인 내용 · 유효기간 · 쿠폰 코드(선택) 입력",
    "이미지(1200×900px 권장) 첨부 후 게시 → Google 검색·지도에 최대 6개월 노출",
    "게시물은 만료 후 자동 제거 — 월 1~2회 주기적 업데이트가 SEO에 유리",
  ],
  kakao: [
    "카카오채널 관리자 → 좌측 '쿠폰' 메뉴 진입",
    "쿠폰명 · 혜택 내용(할인율/금액/서비스) · 사용 조건 · 유효기간 설정",
    "발급 수량 제한 여부 설정 → '쿠폰 발행' 완료",
    "채널 메시지 발송 시 쿠폰 동봉 가능 — 단골 고객 재방문 유도에 효과적",
    "채널 홈 '쿠폰' 배너 설정으로 새 친구 추가 시 자동 발급 설정 가능",
  ],
} as const;

/* ─── 사진 촬영 가이드 ─────────────────────────────────────────── */
const PHOTO_CHECKLIST = [
  { icon: "🏪", text: "외관 전경 — 낮/저녁 각 1장, 간판과 입구가 명확하게" },
  { icon: "🪟", text: "내부 전경 — 구석 모서리에서 광각으로 넓어 보이게 촬영" },
  { icon: "⭐", text: "대표 서비스·메뉴 클로즈업 3~5장 (가장 클릭률 높은 사진)" },
  { icon: "🧹", text: "청결한 작업공간 또는 깔끔한 테이블 세팅" },
  { icon: "👤", text: "직원·대표 자연스러운 모습 1~2장 (신뢰도 향상)" },
  { icon: "🎬", text: "숏폼 영상 15~30초 1편 — 네이버·구글 모두 영상 우선 노출" },
];

const PHOTO_TIPS = [
  "자연광 활용 — 오전 10시~오후 2시 촬영이 가장 밝고 자연스럽습니다",
  "가로(16:9) 기준으로 촬영, 세로(9:16)는 릴스·숏폼용으로 별도 촬영",
  "최소 1200×900px 이상, 5MB 이하 (네이버·구글 권장 규격)",
  "필터·보정 과다 금지 — 실제와 차이가 크면 방문 후 실망 리뷰 발생",
  "사진은 최소 10장 이상 등록할수록 플레이스 노출 순위에 유리",
];

const MENU_PHOTO_TIPS = [
  "메뉴별 클로즈업 사진 각 1~2장, 배경은 단색·나무 결 테이블 추천",
  "실제 제공 그릇·접시·포장 그대로 촬영 (기대치 일치)",
  "세트·사이드 구성 포함 샷 1장 (객단가 높이는 효과)",
  "가격 정보와 메뉴 설명을 플레이스 메뉴 탭과 연결해서 등록",
];

/* ─── 공통 서브컴포넌트 ─────────────────────────────────────────── */
function StepCard({
  number,
  title,
  done,
  onToggle,
  accent,
  isKakao,
  open,
  onOpenChange,
  divRef,
  children,
}: {
  number: number;
  title: string;
  done: boolean;
  onToggle: () => void;
  accent: string;
  isKakao: boolean;
  open: boolean;
  onOpenChange: () => void;
  divRef: (el: HTMLDivElement | null) => void;
  children: React.ReactNode;
}) {
  return (
    <div
      ref={divRef}
      className="rounded-2xl overflow-hidden transition-all"
      style={{
        border: done
          ? "1px solid #22C55E40"
          : `1px solid ${open ? accent + "60" : "var(--color-border)"}`,
        background: "var(--color-surface)",
        opacity: done ? 0.75 : 1,
      }}
    >
      {/* 헤더 */}
      <button
        className="w-full flex items-center gap-3 px-5 py-4 text-left"
        onClick={onOpenChange}
      >
        {/* 스텝 번호 */}
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          style={{
            background: done ? "#22C55E" : open ? accent : "var(--color-bg)",
            color: done ? "#fff" : open ? (isKakao ? "#1A1A1A" : "#fff") : "var(--color-text-muted)",
            border: done || open ? "none" : "1px solid var(--color-border)",
          }}
        >
          {done ? "✓" : number}
        </span>

        <span
          className="flex-1 text-sm font-semibold"
          style={{ color: done ? "var(--color-text-muted)" : "var(--color-text-primary)" }}
        >
          {title}
        </span>

        {/* 완료 체크박스 */}
        <label
          className="flex items-center gap-1.5 text-xs shrink-0"
          onClick={(e) => e.stopPropagation()}
          style={{ color: done ? "#22C55E" : "var(--color-text-muted)" }}
        >
          <input
            type="checkbox"
            checked={done}
            onChange={onToggle}
            className="w-3.5 h-3.5 accent-green-500"
          />
          완료
        </label>

        <span
          className="text-xs shrink-0 transition-transform"
          style={{
            color: "var(--color-text-muted)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            display: "inline-block",
          }}
        >
          ▾
        </span>
      </button>

      {/* 컨텐츠 */}
      {open && (
        <div className="px-5 pb-5 border-t" style={{ borderColor: "var(--color-border)" }}>
          <div className="pt-4">{children}</div>
        </div>
      )}
    </div>
  );
}

function GuideList({ items, accent }: { items: readonly (string | StepItem)[]; accent: string }) {
  return (
    <ol className="space-y-2.5">
      {items.map((item, i) => {
        const stepItem: StepItem = typeof item === "string" ? { text: item } : item;
        return (
        <li key={i} className="flex gap-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          <span
            className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
            style={{ background: accent + "20", color: accent }}
          >
            {i + 1}
          </span>
          <span>
            {stepItem.inlineLink && (
              <a
                href={stepItem.inlineLink.href}
                target="_blank"
                rel="noreferrer"
                className="font-semibold underline underline-offset-2"
                style={{ color: accent }}
              >
                {stepItem.inlineLink.label}
              </a>
            )}
            {stepItem.text}
          </span>
        </li>
        );
      })}
    </ol>
  );
}

function TipBox({ text }: { text: string }) {
  return (
    <div className="mt-4 p-3 rounded-xl text-xs flex gap-2" style={{ background: "#F0FDF4", color: "#15803D" }}>
      <span>💡</span>
      <span>{text}</span>
    </div>
  );
}

/* ─── 메인 컴포넌트 ────────────────────────────────────────────── */
export function PlatformOnboardingPage({ config }: { config: OnboardingConfig }) {
  const accent = config.platformColor;
  const isKakao = config.platform === "kakao";
  const platformKey = config.platform;

  // 완료 상태 (5 스텝)
  const [done, setDone] = useState<boolean[]>([false, false, false, false, false]);
  const [openStates, setOpenStates] = useState<boolean[]>([true, false, false, false, false]);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([null, null, null, null, null]);

  const isMobile = () => window.innerWidth < 768;

  const handleCardToggle = (i: number) => {
    const nextOpen = !openStates[i];
    setOpenStates((prev) => prev.map((v, idx) => (idx === i ? nextOpen : v)));
    if (nextOpen && isMobile()) {
      setTimeout(() => {
        cardRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
    }
  };

  const toggleDone = (i: number) => {
    const becomingDone = !done[i];
    setDone((prev) => prev.map((v, idx) => (idx === i ? !v : v)));

    if (becomingDone) {
      // 다음 미완료 카드 찾기 (현재 카드 제외)
      const nextIdx = done.findIndex((d, idx) => idx !== i && !d);
      setOpenStates((prev) =>
        prev.map((v, idx) => {
          if (idx === i) return false;       // 현재 카드 닫기
          if (idx === nextIdx) return true;  // 다음 미완료 카드 열기
          return v;
        })
      );
      if (nextIdx !== -1 && isMobile()) {
        setTimeout(() => {
          cardRefs.current[nextIdx]?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
      }
    }
  };
  const doneCount = done.filter(Boolean).length;

  // 업체 정보 (키워드·정보최적화에 공통 사용)
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [services, setServices] = useState("");
  const [features, setFeatures] = useState("");
  const [menuItems, setMenuItems] = useState("");

  // AI 결과
  const [infoResult, setInfoResult] = useState<string | null>(null);
  const [infoLoading, setInfoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 복사
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const callApi = async () => {
    if (!businessName.trim()) {
      setError("업체명을 먼저 입력해주세요");
      return;
    }
    setError(null);
    setInfoLoading(true);
    setInfoResult(null);
    try {
      const data = await api.post<{ result: string }>("/api/generate-onboarding-copy", {
        platform: platformKey,
        focus: "info",
        business_name: businessName,
        category,
        location,
        services,
        features,
        menu_items: menuItems,
      });
      setInfoResult(data.result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "서버 연결 실패");
    } finally {
      setInfoLoading(false);
    }
  };

  /* ─ 업체 정보 입력 공통 패널 ─ */
  const BusinessInputPanel = (
    <div className="mb-5 p-4 rounded-xl space-y-3" style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
      <p className="text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>업체 기본 정보 (AI 생성에 사용)</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>업체명 *</p>
          <input
            type="text" placeholder="예: 단소상회"
            value={businessName} onChange={(e) => setBusinessName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
          />
        </div>
        <div>
          <p className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>업종</p>
          <input
            type="text" placeholder="예: 미용실, 음식점, 카페"
            value={category} onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
          />
        </div>
        <div>
          <p className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>위치</p>
          <input
            type="text" placeholder="예: 강남구 역삼동"
            value={location} onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
          />
        </div>
        <div>
          <p className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>주요 서비스</p>
          <input
            type="text" placeholder="예: 커트, 펌, 염색"
            value={services} onChange={(e) => setServices(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
          />
        </div>
      </div>
      <div>
        <p className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
          판매 메뉴·상품
          <span className="ml-1 font-normal" style={{ color: "var(--color-text-muted)", opacity: 0.7 }}>(콤마로 구분)</span>
        </p>
        <input
          type="text" placeholder="예: 한우숯불구이, 된장찌개, 냉면, 갈비탕"
          value={menuItems} onChange={(e) => setMenuItems(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
        />
      </div>
      <div>
        <p className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>강점·특성</p>
        <input
          type="text" placeholder="예: 20년 경력, 당일 예약, 주차 가능"
          value={features} onChange={(e) => setFeatures(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
        />
      </div>
    </div>
  );

  /* ─ AI 결과 박스 ─ */
  const ResultBox = ({ text, id }: { text: string; id: string }) => (
    <div className="mt-3">
      <div
        className="p-4 rounded-xl text-sm whitespace-pre-wrap mb-2"
        style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)", lineHeight: 1.9, maxHeight: 360, overflowY: "auto" }}
      >
        {text}
      </div>
      <button
        onClick={() => copy(text, id)}
        className="text-xs px-4 py-1.5 rounded-lg font-medium transition-colors"
        style={{
          background: copiedId === id ? "#22C55E" : "var(--color-bg)",
          border: "1px solid var(--color-border)",
          color: copiedId === id ? "#fff" : "var(--color-text-secondary)",
        }}
      >
        {copiedId === id ? "✓ 복사됐습니다" : "복사"}
      </button>
    </div>
  );

  const guide = CHANNEL_GUIDES[platformKey];

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <span
            className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold shrink-0"
            style={{ background: accent, color: isKakao ? "#1A1A1A" : "#fff" }}
          >
            {config.platformLogo}
          </span>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
              {config.platformName} 초기 설정 가이드
            </h1>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              채널 개설 · 사진 등록 · 정보 최적화 · 예약 · 쿠폰 — 2025년 최신 기준
            </p>
          </div>
        </div>
      </div>

      {/* 진행 상황 */}
      <div
        className="rounded-2xl p-4 mb-6 flex items-center gap-4"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <div className="flex-1">
          <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--color-text-muted)" }}>
            <span>전체 진행률</span>
            <span style={{ color: accent, fontWeight: 600 }}>{doneCount} / 5 완료</span>
          </div>
          <div className="h-2 rounded-full" style={{ background: "var(--color-bg)" }}>
            <div
              className="h-2 rounded-full transition-all"
              style={{ width: `${(doneCount / 5) * 100}%`, background: accent }}
            />
          </div>
        </div>
        {doneCount === 5 && (
          <span className="text-sm font-bold" style={{ color: "#22C55E" }}>🎉 설정 완료!</span>
        )}
      </div>

      {/* 에러 */}
      {error && (
        <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: "#FEF2F2", color: "var(--color-danger)" }}>
          {error}
        </div>
      )}

      {/* 스텝 카드들 */}
      <div className="space-y-3">

        {/* STEP 1: 채널 생성 */}
        <StepCard number={1} title="채널 생성" done={done[0]} onToggle={() => toggleDone(0)} accent={accent} isKakao={isKakao} open={openStates[0]} onOpenChange={() => handleCardToggle(0)} divRef={(el) => { cardRefs.current[0] = el; }}>
          <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>
            {config.platformName} 플레이스·채널을 개설하는 방법입니다.
          </p>
          <GuideList items={guide.steps} accent={accent} />
          <TipBox text={guide.tip} />
          <a
            href={guide.link}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center text-xs font-semibold px-4 py-2 rounded-xl"
            style={{ background: accent + "15", color: accent, border: `1px solid ${accent}30` }}
          >
            {guide.linkText}
          </a>
        </StepCard>

        {/* STEP 2: 사진 등록 */}
        <StepCard number={2} title="사진 등록 (대표사진 · 메뉴사진)" done={done[1]} onToggle={() => toggleDone(1)} accent={accent} isKakao={isKakao} open={openStates[1]} onOpenChange={() => handleCardToggle(1)} divRef={(el) => { cardRefs.current[1] = el; }}>
          <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>
            첫인상을 결정하는 사진 — 품질이 클릭률·예약률에 직결됩니다.
          </p>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* 대표사진 */}
            <div className="p-3 rounded-xl" style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
              <p className="text-xs font-semibold mb-2" style={{ color: accent }}>📷 대표사진</p>
              <ul className="space-y-1.5">
                {PHOTO_CHECKLIST.map((item, i) => (
                  <li key={i} className="flex gap-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    <span>{item.icon}</span>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* 메뉴사진 */}
            <div className="p-3 rounded-xl" style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
              <p className="text-xs font-semibold mb-2" style={{ color: accent }}>🍽️ 메뉴사진</p>
              <ul className="space-y-1.5">
                {MENU_PHOTO_TIPS.map((tip, i) => (
                  <li key={i} className="flex gap-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    <span>·</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="p-3 rounded-xl" style={{ background: "var(--color-bg)" }}>
            <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--color-text-secondary)" }}>📌 촬영 원칙</p>
            <ul className="space-y-1">
              {PHOTO_TIPS.map((tip, i) => (
                <li key={i} className="text-xs flex gap-2" style={{ color: "var(--color-text-muted)" }}>
                  <span style={{ color: accent }}>·</span> {tip}
                </li>
              ))}
            </ul>
          </div>
        </StepCard>

        {/* STEP 3: 정보 최적화 */}
        <StepCard number={3} title="정보 최적화 (메뉴명 · 매장소개 · 오시는 길)" done={done[2]} onToggle={() => toggleDone(2)} accent={accent} isKakao={isKakao} open={openStates[2]} onOpenChange={() => handleCardToggle(2)} divRef={(el) => { cardRefs.current[2] = el; }}>
          <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>
            SEO에 최적화된 매장소개, 메뉴 설명, 오시는 길 안내 문구를 AI가 생성합니다.
          </p>
          {BusinessInputPanel}
          <button
            onClick={() => callApi()}
            disabled={!businessName.trim() || infoLoading}
            className="w-full py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40"
            style={{ background: accent, color: isKakao ? "#1A1A1A" : "#fff" }}
          >
            {infoLoading ? "문구 생성 중..." : "✦ 정보 최적화 문구 AI 생성"}
          </button>
          {infoResult && <ResultBox text={infoResult} id="info" />}
          <TipBox text="AI 생성 문구는 초안입니다. 실제 매장 정보와 다른 부분은 반드시 수정 후 등록하세요. 네이버는 키워드를 자연스럽게 포함한 소개글이 검색 노출에 유리합니다." />
        </StepCard>

        {/* STEP 4: 예약메뉴 생성 및 관리 */}
        <StepCard number={4} title="예약메뉴 생성 및 관리" done={done[3]} onToggle={() => toggleDone(3)} accent={accent} isKakao={isKakao} open={openStates[3]} onOpenChange={() => handleCardToggle(3)} divRef={(el) => { cardRefs.current[3] = el; }}>
          <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>
            고객이 바로 예약할 수 있도록 예약 메뉴를 설정합니다.
          </p>
          <GuideList items={RESERVATION_GUIDES[platformKey]} accent={accent} />
          <TipBox text="네이버 예약은 무료이고 플레이스 노출 순위에도 유리합니다. 예약 취소 기한(예: 1일 전까지 무료)을 명확히 설정할수록 노쇼(No-Show)가 줄어듭니다." />
        </StepCard>

        {/* STEP 5: 쿠폰 관리 */}
        <StepCard number={5} title="쿠폰 관리" done={done[4]} onToggle={() => toggleDone(4)} accent={accent} isKakao={isKakao} open={openStates[4]} onOpenChange={() => handleCardToggle(4)} divRef={(el) => { cardRefs.current[4] = el; }}>
          <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>
            첫 방문 유도와 재방문율 향상을 위한 쿠폰을 설정합니다.
          </p>
          <GuideList items={COUPON_GUIDES[platformKey]} accent={accent} />
          <div className="mt-4 p-3 rounded-xl" style={{ background: "var(--color-bg)" }}>
            <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--color-text-secondary)" }}>🎯 효과적인 쿠폰 전략</p>
            {[
              "첫 방문 쿠폰: 신규 고객 유입용 (예: 10% 할인 또는 서비스 1개 무료)",
              "스탬프 쿠폰: 재방문 유도 — n번 방문 시 무료 제공 (충성도 강화)",
              "카카오채널 친구 추가 쿠폰: 채널 팔로워 확보 + 재방문 동시 유도",
              "시즌·기념일 한정 쿠폰: 성수기 매출 극대화 (유효기간 짧게 설정)",
            ].map((tip, i) => (
              <p key={i} className="text-xs" style={{ color: "var(--color-text-muted)" }}>· {tip}</p>
            ))}
          </div>
        </StepCard>

      </div>
    </div>
  );
}
