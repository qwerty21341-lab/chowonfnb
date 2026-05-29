"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const MENU_ITEMS = [
  {
    icon: "🏢",
    title: "업체 설정",
    desc: "업체 정보, 위치, 특징 관리",
    href: "/todolist/settings/business",
  },
  {
    icon: "👤",
    title: "계정",
    desc: "이메일, 비밀번호 변경",
    href: "/todolist/settings/account",
    disabled: true,
  },
  {
    icon: "💳",
    title: "플랜 & 결제",
    desc: "구독 플랜 변경 및 결제 수단 관리",
    href: "/todolist/settings/plan",
    disabled: true,
  },
  {
    icon: "🔔",
    title: "알림",
    desc: "이메일, 앱 알림 설정",
    href: "/todolist/settings/notifications",
    disabled: true,
  },
];

export function SettingsPage() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  const [upgradeToast, setUpgradeToast] = useState(false);

  const handleUpgrade = () => {
    setUpgradeToast(true);
    setTimeout(() => setUpgradeToast(false), 2500);
  };

  useEffect(() => {
    const saved = localStorage.getItem("tduri_theme");
    if (saved === "dark") setIsDark(true);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("tduri_theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("tduri_theme", "light");
    }
  };

  return (
    <div>
      {upgradeToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-medium text-white shadow-lg"
          style={{ background: "var(--color-primary)" }}>
          플랜 업그레이드 기능은 준비 중입니다
        </div>
      )}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
          설정
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          계정 및 업체 정보를 관리하세요
        </p>
      </div>

      <div className="max-w-xl space-y-3">

        {/* 메뉴 목록 */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid var(--color-border)" }}
        >
          {MENU_ITEMS.map((item, i) => (
            <button
              key={item.href}
              onClick={() => !item.disabled && router.push(item.href)}
              className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors"
              style={{
                background: "var(--color-surface)",
                borderBottom: i < MENU_ITEMS.length - 1 ? "1px solid var(--color-border)" : "none",
                opacity: item.disabled ? 0.4 : 1,
                cursor: item.disabled ? "not-allowed" : "pointer",
              }}
            >
              <span className="text-2xl w-8 text-center shrink-0">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                  {item.title}
                  {item.disabled && (
                    <span
                      className="ml-2 text-xs px-1.5 py-0.5 rounded-full"
                      style={{ background: "var(--color-border)", color: "var(--color-text-muted)" }}
                    >
                      준비중
                    </span>
                  )}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                  {item.desc}
                </p>
              </div>
              {!item.disabled && (
                <span style={{ color: "var(--color-text-muted)" }}>›</span>
              )}
            </button>
          ))}
        </div>

        {/* 화면 모드 */}
        <div
          className="rounded-2xl p-5"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-2xl w-8 text-center">🌙</span>
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                  {isDark ? "다크 모드" : "라이트 모드"}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                  {isDark ? "어두운 배경으로 표시됩니다" : "밝은 배경으로 표시됩니다"}
                </p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0"
              style={{ background: isDark ? "var(--color-primary)" : "var(--color-border)" }}
            >
              <span
                className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform"
                style={{ transform: isDark ? "translateX(22px)" : "translateX(4px)" }}
              />
            </button>
          </div>
        </div>

        {/* 현재 플랜 */}
        <div
          className="rounded-2xl p-5"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
          <div className="flex items-center gap-4">
            <span className="text-2xl w-8 text-center">⚡</span>
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                현재 플랜: <span className="font-bold">Free</span>
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                키워드 3개 · AI 답글 월 5회
              </p>
            </div>
            <button
              onClick={handleUpgrade}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white shrink-0"
              style={{ background: "var(--color-primary)" }}
            >
              업그레이드
            </button>
          </div>
        </div>

        {/* 버전 */}
        <p className="text-center text-xs pt-2" style={{ color: "var(--color-text-muted)" }}>
          투두리 v0.1.0
        </p>

      </div>
    </div>
  );
}
