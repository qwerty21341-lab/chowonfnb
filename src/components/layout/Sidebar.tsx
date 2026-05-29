"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLicense } from "@/lib/useLicense";
import { LicenseInputModal } from "@/components/LicenseInputModal";

interface NavItem {
  href?: string;
  label: string;
  icon: string;
  soon?: boolean;
  desc?: string;
}

interface Section {
  id: string;
  label: string;
  badge?: string;
  badgeColor: string;
  sectionIcon: string;
  items: NavItem[];
}

const SECTIONS: Section[] = [
  {
    id: "setup",
    label: "기초 세팅",
    badge: "1회",
    badgeColor: "#8B5CF6",
    sectionIcon: "⚙",
    items: [
      { href: "/todolist/settings/naver",  label: "네이버 설정",  icon: "N", desc: "네이버 플레이스·블로그 채널 초기 설정 및 사용법 안내" },
      { href: "/todolist/settings/kakao",  label: "카카오 설정",  icon: "K", desc: "카카오맵·카카오채널 초기 설정 및 사용법 안내" },
      { href: "/todolist/settings/google", label: "구글 설정",    icon: "G", desc: "구글 비즈니스 프로필 초기 설정 및 사용법 안내" },
    ],
  },
  {
    id: "daily",
    label: "매일 관리",
    badge: "15-40분",
    badgeColor: "#10B981",
    sectionIcon: "📋",
    items: [
      { href: "/todolist/ai/place-reply",       label: "네이버 플레이스 답글",  icon: "N", desc: "AI가 네이버 플레이스 리뷰에 달 자연스러운 답글을 자동 생성합니다" },
      { href: "/todolist/ai/google-reply",      label: "구글 비즈니스 답글",    icon: "G", desc: "AI가 구글 비즈니스 리뷰에 달 전문적인 답글을 자동 생성합니다" },
      { href: "/todolist/ai/kakao-reply",       label: "카카오맵 답글",         icon: "K", desc: "AI가 카카오맵 리뷰에 달 답글을 빠르게 생성합니다" },
      { href: "/todolist/ai/blog-review",       label: "배달앱 답글",           icon: "배", desc: "AI가 배달의민족·쿠팡이츠 리뷰 답글을 자동 생성합니다" },
      { href: "/todolist/ai/instagram-caption", label: "인스타그램 캡션",       icon: "In", desc: "사진·영상에 어울리는 인스타그램 캡션을 AI가 작성합니다" },
      { href: "/todolist/ai/instagram-hashtag", label: "인스타 해시태그",       icon: "#", desc: "업종과 게시물 내용에 맞는 최적의 해시태그를 추천합니다" },
      { href: "/todolist/ai/instagram-story",   label: "인스타 스토리 문구",    icon: "◎", desc: "인스타그램 스토리에 올릴 매력적인 문구를 AI가 생성합니다" },
      { href: "/todolist/ai/threads-post",      label: "스레드 게시글",         icon: "@", desc: "스레드에 올릴 트렌디한 게시글을 AI가 작성합니다" },
      { href: "/todolist/ai/daangn-promo",      label: "당근마켓 홍보글",       icon: "당", desc: "당근마켓에 올릴 클릭률 높은 홍보글을 AI가 작성합니다" },
      { href: "/todolist/ai/kakao-message",     label: "카카오채널 메시지",     icon: "K", desc: "단골 고객에게 보낼 카카오채널 홍보 메시지를 AI가 작성합니다" },
    ],
  },
  {
    id: "blog",
    label: "블로그 마케팅",
    badge: "매주",
    badgeColor: "#F59E0B",
    sectionIcon: "✍",
    items: [
      { href: "/todolist/rank",                label: "키워드 관리",         icon: "↑", desc: "키워드별 네이버 블로그 검색 순위를 실시간으로 조회합니다" },
      { href: "/todolist/ai/keyword-finder",   label: "키워드 찾기",         icon: "✦", desc: "AI가 내 업종·지역에 맞는 최적의 블로그 키워드를 추천합니다" },
      { href: "/todolist/keywords",            label: "검색량 조회",         icon: "◎", desc: "네이버 키워드의 월별 검색량 데이터를 확인하세요" },
      { href: "/todolist/ai/menu-description", label: "메뉴 설명 최적화",   icon: "📋", desc: "AI가 메뉴 설명을 더 맛있고 매력적으로 재작성해 주문율을 높입니다" },
    ],
  },
  {
    id: "analytics",
    label: "성과 분석",
    badge: "매월",
    badgeColor: "#3B82F6",
    sectionIcon: "📊",
    items: [
      { href: "/todolist/dashboard",        label: "대시보드",        icon: "⊞", desc: "블로그·플레이스 핵심 지표를 한눈에 확인하세요" },
      { href: "/todolist/naver/place-rank", label: "플레이스 순위",   icon: "📍", desc: "키워드별 네이버 플레이스 상위 노출 순위를 실시간으로 조회합니다" },
    ],
  },
];

function isSectionActive(section: Section, pathname: string) {
  return section.items.some(
    (item) => item.href && (pathname === item.href || pathname.startsWith(item.href + "/")),
  );
}

function Tooltip({ top, desc }: { top: number; desc: string }) {
  return (
    <div
      style={{
        position: "fixed",
        left: 252,
        top,
        transform: "translateY(-50%)",
        background: "#1a1917",
        color: "#e8dcc8",
        fontSize: 12,
        lineHeight: 1.55,
        padding: "8px 12px",
        borderRadius: 8,
        maxWidth: 220,
        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        border: "1px solid #2d2b27",
        zIndex: 9999,
        pointerEvents: "none",
        animation: "tooltipIn 0.15s ease",
      }}
    >
      {desc}
    </div>
  );
}

function NavItemRow({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const [tooltipTop, setTooltipTop] = useState<number | null>(null);

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    if (!item.desc) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipTop(rect.top + rect.height / 2);
  };
  const handleMouseLeave = () => setTooltipTop(null);

  const isActive =
    item.href &&
    (pathname === item.href || pathname.startsWith(item.href + "/"));

  if (item.soon) {
    return (
      <div
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg"
        style={{ opacity: 0.35, cursor: "default" }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <span
          className="text-xs w-4 text-center shrink-0"
          style={{ color: "#5a5048" }}
        >
          {item.icon}
        </span>
        <span className="flex-1 text-xs" style={{ color: "#5a5048" }}>
          {item.label}
        </span>
        <span
          className="text-xs px-1.5 py-0.5 rounded font-medium"
          style={{ background: "#1a1917", color: "#5a5048", fontSize: 9 }}
        >
          준비중
        </span>
        {tooltipTop !== null && item.desc && (
          <Tooltip top={tooltipTop} desc={item.desc} />
        )}
      </div>
    );
  }

  return (
    <>
      <Link
        href={item.href!}
        onClick={onNavigate}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 group"
        style={{
          background: isActive ? "rgba(201,168,76,0.12)" : "transparent",
          color: isActive ? "#f0d98a" : "#5a5048",
          borderLeft: isActive ? "2px solid #c9a84c" : "2px solid transparent",
        }}
        onMouseEnter={(e) => {
          handleMouseEnter(e);
          if (!isActive) {
            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
            e.currentTarget.style.color = "#c4b49e";
          }
        }}
        onMouseLeave={(e) => {
          handleMouseLeave();
          if (!isActive) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#5a5048";
          }
        }}
      >
        <span className="text-xs w-4 text-center shrink-0">{item.icon}</span>
        <span>{item.label}</span>
      </Link>
      {tooltipTop !== null && item.desc && (
        <Tooltip top={tooltipTop} desc={item.desc} />
      )}
    </>
  );
}

/* ─── Collapsed icon sidebar popup ─── */
function CollapsedPopup({
  section,
  top,
  pathname,
  onClose,
  onMouseEnter,
  onMouseLeave,
}: {
  section: Section;
  top: number;
  pathname: string;
  onClose: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: "fixed",
        left: 56,
        top,
        zIndex: 9999,
        background: "#100f0d",
        border: "1px solid #2d2b27",
        borderRadius: 12,
        padding: "8px 0",
        minWidth: 196,
        boxShadow: "0 12px 36px rgba(0,0,0,0.6)",
        animation: "tooltipIn 0.12s ease",
      }}
    >
      <div className="flex items-center gap-2 px-4 pb-2 mb-1" style={{ borderBottom: "1px solid #2d2b27" }}>
        <span className="text-xs font-bold" style={{ color: "#c4b49e" }}>
          {section.label}
        </span>
        <span
          className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
          style={{ background: section.badgeColor + "22", color: section.badgeColor, fontSize: 10 }}
        >
          {section.badge}
        </span>
      </div>
      {section.items.map((item, i) => {
        const isActive =
          item.href &&
          (pathname === item.href || pathname.startsWith(item.href + "/"));
        if (item.soon) {
          return (
            <div
              key={i}
              className="flex items-center gap-2 px-4 py-2 text-xs"
              style={{ color: "#5a5048", opacity: 0.5 }}
            >
              <span className="w-4 text-center shrink-0">{item.icon}</span>
              {item.label}
              <span style={{ fontSize: 9, marginLeft: "auto", color: "#5a5048" }}>준비중</span>
            </div>
          );
        }
        return (
          <Link
            key={i}
            href={item.href!}
            className="flex items-center gap-2 px-4 py-2 text-xs transition-colors"
            style={{
              color: isActive ? "#f0d98a" : "#9a8d7c",
              background: isActive ? "rgba(201,168,76,0.12)" : "transparent",
              borderLeft: isActive ? "2px solid #c9a84c" : "2px solid transparent",
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                e.currentTarget.style.color = "#c4b49e";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#9a8d7c";
              }
            }}
            onClick={onClose}
          >
            <span className="w-4 text-center shrink-0">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

/* ─── Full sidebar content ─── */
function SidebarContent({
  openIds,
  toggle,
  onNavigate,
}: {
  openIds: Set<string>;
  toggle: (id: string) => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto space-y-1 pr-1">
      {SECTIONS.map((section) => {
        const isOpen = openIds.has(section.id);
        const active = isSectionActive(section, pathname);

        return (
          <div key={section.id}>
            {/* Section header button */}
            <button
              onClick={() => toggle(section.id)}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-xl transition-colors"
              style={{
                background: active
                  ? "rgba(201,168,76,0.07)"
                  : isOpen
                  ? "rgba(255,255,255,0.04)"
                  : "transparent",
              }}
              onMouseEnter={(e) => {
                if (!active && !isOpen)
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              }}
              onMouseLeave={(e) => {
                if (!active && !isOpen)
                  e.currentTarget.style.background = "transparent";
              }}
            >
              {/* Section icon bubble */}
              <span
                className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0"
                style={{
                  background: active
                    ? section.badgeColor + "28"
                    : "rgba(255,255,255,0.06)",
                  color: active ? section.badgeColor : "#5a5048",
                }}
              >
                {section.sectionIcon}
              </span>

              <span
                className="flex-1 text-left text-sm font-semibold"
                style={{ color: active ? "#e8dcc8" : "#9a8d7c" }}
              >
                {section.label}
              </span>

              {/* Badge */}
              {section.badge && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full font-semibold mr-1"
                  style={{
                    background: section.badgeColor + "22",
                    color: section.badgeColor,
                    fontSize: 10,
                  }}
                >
                  {section.badge}
                </span>
              )}

              {/* Chevron */}
              <span
                style={{
                  color: "#5a5048",
                  fontSize: 10,
                  transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                  display: "inline-block",
                }}
              >
                ▾
              </span>
            </button>

            {/* Items */}
            {isOpen && (
              <div className="mt-0.5 mb-1 ml-2 space-y-0.5">
                {section.items.map((item, i) => (
                  <NavItemRow key={i} item={item} onNavigate={onNavigate} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

/* ─── Main export ─── */
export default function Sidebar({
  mobileOpen = false,
  onMobileOpen,
  onMobileClose,
  desktopCollapsed = false,
  onDesktopToggle,
}: {
  mobileOpen?: boolean;
  onMobileOpen?: () => void;
  onMobileClose?: () => void;
  desktopCollapsed?: boolean;
  onDesktopToggle?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { status, refresh } = useLicense();

  // 관리자 여부 (admin 페이지 인증 후 localStorage에 플래그 저장됨)
  const [isMaster, setIsMaster] = useState(false);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  useEffect(() => {
    setIsMaster(localStorage.getItem("tduri_admin_unlocked") === "true");
  }, []);

  // Determine which section is active initially
  const activeSectionId =
    SECTIONS.find((s) => isSectionActive(s, pathname))?.id ?? "blog";

  const [openIds, setOpenIds] = useState<Set<string>>(
    new Set([activeSectionId]),
  );
  const [showHomeModal, setShowHomeModal] = useState(false);

  // Collapsed hover popup
  const [hoveredSectionId, setHoveredSectionId] = useState<string | null>(null);
  const [popupTop, setPopupTop] = useState(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showPopup = (id: string, e: React.MouseEvent<HTMLElement>) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    const rect = e.currentTarget.getBoundingClientRect();
    setPopupTop(rect.top);
    setHoveredSectionId(id);
  };
  const scheduleHide = () => {
    hideTimer.current = setTimeout(() => setHoveredSectionId(null), 120);
  };
  const cancelHide = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  };

  useEffect(() => {
    setOpenIds((prev) => new Set([...prev, activeSectionId]));
  }, [activeSectionId]);

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const SIDEBAR_BG = "var(--color-sidebar)";
  const SIDEBAR_WIDTH = 248;
  const ICON_WIDTH = 56;

  const LogoBlock = ({ onClose }: { onClose?: () => void }) => (
    <div className="flex items-start justify-between mb-5 px-1">
      <button className="flex-1 text-left" onClick={() => setShowHomeModal(true)}>
        <div className="flex items-baseline gap-2">
          <span
            className="text-2xl font-bold tracking-tight"
            style={{ color: "var(--color-primary)" }}
          >
            투두리
          </span>
          <span
            className="text-xs font-medium px-1.5 py-0.5 rounded-md"
            style={{ background: "rgba(201,168,76,0.12)", color: "#d4b560" }}
          >
            v0.1
          </span>
        </div>
        <p className="text-xs mt-0.5 tracking-wide" style={{ color: "#5a5048" }}>
          자영업자 To do list
        </p>
      </button>

      {/* Mobile close */}
      {onClose && (
        <button
          onClick={onClose}
          className="md:hidden flex items-center justify-center w-7 h-7 rounded-lg ml-2 mt-0.5 text-sm transition-colors hover:bg-white/10"
          style={{ color: "#5a5048" }}
        >
          ✕
        </button>
      )}

      {/* Desktop collapse */}
      <button
        onClick={onDesktopToggle}
        className="hidden md:flex items-center justify-center w-7 h-7 rounded-lg ml-2 mt-0.5 transition-colors hover:bg-white/10"
        style={{ color: "#5a5048" }}
        aria-label="사이드바 접기"
      >
        ◂
      </button>
    </div>
  );

  const NoticeBanner = ({ onNavigate }: { onNavigate?: () => void }) => (
    <Link
      href="/todolist/notice"
      onClick={onNavigate}
      className="mb-4 w-full rounded-xl px-3 py-2.5 flex items-center justify-between gap-2 transition-opacity hover:opacity-80"
      style={{ background: "linear-gradient(135deg, #2a2118, #1c1a15)", border: "1px solid rgba(201,168,76,0.25)" }}
    >
      <span className="text-xs font-bold" style={{ color: "#c9a84c" }}>📢 공지사항 / 사용법</span>
      <span className="text-xs opacity-60" style={{ color: "#c9a84c" }}>▸</span>
    </Link>
  );

  const licenseLabel = (() => {
    if (!status) return null;
    if (status.type === "trial") return `체험 ${status.daysLeft}일 남음`;
    if (status.type === "active") return "라이선스 활성";
    return "체험 만료";
  })();

  const BottomNav = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div
      className="pt-4 space-y-0.5"
      style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
    >
      <Link
        href="/todolist/settings"
        onClick={onNavigate}
        className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors"
        style={{ color: "#5a5048" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#c4b49e")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#5a5048")}
      >
        <span>⚙</span>설정
      </Link>
      {licenseLabel && (
        <button
          onClick={() => { onNavigate?.(); setShowLicenseModal(true); }}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors w-full text-left"
          style={{
            color: status?.type === "expired"
              ? "#EF4444"
              : status?.type === "trial" && (status.daysLeft ?? 99) <= 2
              ? "#F59E0B"
              : "#5a5048",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#c4b49e")}
          onMouseLeave={(e) => {
            e.currentTarget.style.color =
              status?.type === "expired"
                ? "#EF4444"
                : status?.type === "trial" && (status.daysLeft ?? 99) <= 2
                ? "#F59E0B"
                : "#5a5048";
          }}
        >
          <span>🔑</span>{licenseLabel}
        </button>
      )}
      {isMaster && (
        <Link
          href="/todolist/admin"
          onClick={onNavigate}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors"
          style={{ color: "#c9a84c" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#f0d98a")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#c9a84c")}
        >
          <span>🛠</span>관리자
        </Link>
      )}
    </div>
  );

  const HomeModal = () =>
    showHomeModal ? (
      <div
        className="fixed inset-0 flex items-center justify-center z-50"
        style={{ background: "rgba(0,0,0,0.6)" }}
        onClick={() => setShowHomeModal(false)}
      >
        <div
          className="rounded-2xl px-8 py-6 flex flex-col items-center gap-4 w-72"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>
            홈으로 이동할까요?
          </p>
          <div className="flex gap-2 w-full">
            <button
              onClick={() => setShowHomeModal(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{
                border: "1px solid var(--color-border)",
                color: "var(--color-text-secondary)",
              }}
            >
              아니오
            </button>
            <button
              onClick={() => {
                setShowHomeModal(false);
                onMobileClose?.();
                router.push("/todolist/notice");
              }}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
              style={{ background: "var(--color-primary)" }}
            >
              예
            </button>
          </div>
        </div>
      </div>
    ) : null;

  /* ── Desktop collapsed (icon-only) ── */
  if (desktopCollapsed) {
    return (
      <>
        <aside
          className="hidden md:flex flex-col items-center py-4 shrink-0"
          style={{
            background: SIDEBAR_BG,
            width: ICON_WIDTH,
            minHeight: "100vh",
            borderRight: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          {/* Expand button */}
          <button
            onClick={onDesktopToggle}
            className="flex items-center justify-center w-9 h-9 rounded-xl mb-5 transition-colors hover:bg-white/10"
            style={{ color: "#5a5048" }}
            title="사이드바 열기"
          >
            ▸
          </button>

          {/* Section icons */}
          <nav className="flex flex-col items-center gap-2 flex-1">
            {SECTIONS.map((section) => {
              const active = isSectionActive(section, pathname);
              return (
                <button
                  key={section.id}
                  title={section.label}
                  onMouseEnter={(e) => showPopup(section.id, e)}
                  onMouseLeave={scheduleHide}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0 transition-all"
                  style={{
                    background: active
                      ? section.badgeColor + "28"
                      : "rgba(255,255,255,0.06)",
                    color: active ? section.badgeColor : "#5a5048",
                    boxShadow: active
                      ? `0 0 0 1.5px ${section.badgeColor}55`
                      : "none",
                  }}
                >
                  {section.sectionIcon}
                </button>
              );
            })}
          </nav>

          {/* Bottom */}
          <div
            className="flex flex-col items-center gap-2 pt-4"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <Link
              href="/todolist/settings"
              title="설정"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm hover:bg-white/10 transition-colors"
              style={{ color: "#5a5048" }}
            >
              ⚙
            </Link>
            <button
              onClick={() => setShowLicenseModal(true)}
              title="라이선스"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm hover:bg-white/10 transition-colors"
              style={{ color: "#5a5048" }}
            >
              🔑
            </button>
          </div>
        </aside>

        {/* Hover popup */}
        {hoveredSectionId &&
          (() => {
            const section = SECTIONS.find((s) => s.id === hoveredSectionId);
            if (!section) return null;
            return (
              <CollapsedPopup
                section={section}
                top={popupTop}
                pathname={pathname}
                onClose={() => setHoveredSectionId(null)}
                onMouseEnter={cancelHide}
                onMouseLeave={scheduleHide}
              />
            );
          })()}

        {/* Mobile full sidebar (shows on top even when desktop collapsed) */}
        {mobileOpen && (
          <aside
            style={{
              background: SIDEBAR_BG,
              width: SIDEBAR_WIDTH,
              minHeight: "100vh",
            }}
            className="fixed inset-y-0 left-0 z-40 flex flex-col py-6 px-4 shrink-0 overflow-y-auto md:hidden"
          >
            <LogoBlock onClose={onMobileClose} />
            <NoticeBanner onNavigate={onMobileClose} />
            <SidebarContent
              openIds={openIds}
              toggle={toggle}
              onNavigate={onMobileClose}
            />
            <BottomNav onNavigate={onMobileClose} />
          </aside>
        )}

        <HomeModal />
        {showLicenseModal && (
          <LicenseInputModal
            onClose={() => setShowLicenseModal(false)}
            onSuccess={() => { refresh(); setShowLicenseModal(false); }}
          />
        )}
      </>
    );
  }

  /* ── Desktop expanded + mobile ── */
  return (
    <>
      {/* Mobile icon bar (hidden when full sidebar is open) */}
      <aside
        className={`${mobileOpen ? "hidden" : "flex"} md:hidden flex-col items-center py-4 shrink-0`}
        style={{
          background: SIDEBAR_BG,
          width: ICON_WIDTH,
          minHeight: "100vh",
          borderRight: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <button
          onClick={onMobileOpen}
          className="flex items-center justify-center w-9 h-9 rounded-xl mb-5 hover:bg-white/10 transition-colors"
          style={{ color: "#5a5048" }}
        >
          ☰
        </button>
        <nav className="flex flex-col items-center gap-2 flex-1">
          {SECTIONS.map((section) => {
            const active = isSectionActive(section, pathname);
            return (
              <button
                key={section.id}
                title={section.label}
                onMouseEnter={(e) => showPopup(section.id, e)}
                onMouseLeave={scheduleHide}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0 transition-all"
                style={{
                  background: active
                    ? section.badgeColor + "28"
                    : "rgba(255,255,255,0.06)",
                  color: active ? section.badgeColor : "#5a5048",
                  boxShadow: active
                    ? `0 0 0 1.5px ${section.badgeColor}55`
                    : "none",
                }}
              >
                {section.sectionIcon}
              </button>
            );
          })}
        </nav>
        <div
          className="flex flex-col items-center gap-2 pt-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <Link
            href="/todolist/settings"
            title="설정"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm hover:bg-white/10 transition-colors"
            style={{ color: "#5a5048" }}
          >
            ⚙
          </Link>
          <button
            onClick={() => router.push("/todolist/activate")}
            title="라이선스"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm hover:bg-white/10 transition-colors"
            style={{ color: "#5a5048" }}
          >
            🔑
          </button>
        </div>
      </aside>

      {/* Mobile icon hover popup */}
      {hoveredSectionId &&
        (() => {
          const section = SECTIONS.find((s) => s.id === hoveredSectionId);
          if (!section) return null;
          return (
            <CollapsedPopup
              section={section}
              top={popupTop}
              pathname={pathname}
              onClose={() => setHoveredSectionId(null)}
              onMouseEnter={cancelHide}
              onMouseLeave={scheduleHide}
            />
          );
        })()}

      {/* Desktop full sidebar + mobile slide-out */}
      <aside
        style={{ background: SIDEBAR_BG, width: SIDEBAR_WIDTH, minHeight: "100vh" }}
        className={[
          "flex-col py-6 px-4 shrink-0 overflow-y-auto",
          mobileOpen ? "fixed inset-y-0 left-0 z-40 flex" : "hidden",
          "md:flex",
        ].join(" ")}
      >
        <LogoBlock onClose={onMobileClose} />
        <NoticeBanner onNavigate={onMobileClose} />
        <SidebarContent
          openIds={openIds}
          toggle={toggle}
          onNavigate={onMobileClose}
        />
        <BottomNav onNavigate={onMobileClose} />
      </aside>

      <HomeModal />
    </>
  );
}
