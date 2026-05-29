"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import LicenseBanner from "@/components/LicenseBanner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);
  const [showHomeModal, setShowHomeModal] = useState(false);
  const router = useRouter();

  return (
    <div className="flex flex-col h-screen overflow-hidden">
    <LicenseBanner />
    <div className="flex flex-1 overflow-hidden">
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onMobileOpen={() => setMobileSidebarOpen(true)}
        onMobileClose={() => setMobileSidebarOpen(false)}
        desktopCollapsed={desktopSidebarCollapsed}
        onDesktopToggle={() => setDesktopSidebarCollapsed((v) => !v)}
      />

      {/* 모바일 오버레이 백드롭 */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <main
        className="flex-1 overflow-y-auto"
        style={{ background: "var(--color-bg)", borderLeft: "1px solid var(--color-border)" }}
      >
        {/* 모바일 상단 헤더 */}
        <div
          className="md:hidden flex items-center gap-3 px-4 py-3 sticky top-0 z-20"
          style={{ background: "var(--color-bg)", borderBottom: "1px solid var(--color-border)" }}
        >
          <button onClick={() => setShowHomeModal(true)} className="flex items-baseline gap-2">
            <span className="text-3xl font-bold" style={{ color: "var(--color-primary)" }}>투두리</span>
            <span className="text-base font-normal" style={{ color: "var(--color-text-primary)" }}>자영업자 To do list</span>
          </button>
        </div>

        <div className="p-4 md:p-8 max-w-5xl mx-auto">{children}</div>
      </main>

      {/* 홈 이동 확인 모달 */}
      {showHomeModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowHomeModal(false)}
        >
          <div
            className="rounded-2xl px-8 py-6 flex flex-col items-center gap-4 w-72"
            style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>
              홈으로 이동할까요?
            </p>
            <div className="flex gap-2 w-full">
              <button
                onClick={() => setShowHomeModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}
              >
                아니오
              </button>
              <button
                onClick={() => { setShowHomeModal(false); router.push("/todolist/notice"); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: "var(--color-primary)" }}
              >
                예
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
