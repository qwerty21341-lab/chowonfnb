"use client";

import { useState } from "react";
import { useLicense } from "@/lib/useLicense";
import { LicenseInputModal } from "@/components/LicenseInputModal";

export default function LicenseBanner() {
  const { status, refresh } = useLicense();
  const [showModal, setShowModal] = useState(false);

  if (!status || status.type === "active") return null;

  const urgent = status.type === "trial" && status.daysLeft <= 2;
  const expired = status.type === "expired";

  return (
    <>
      <div
        className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
        style={{
          background: expired || urgent ? "rgba(239,68,68,0.1)" : "rgba(99,102,241,0.08)",
          borderBottom: `1px solid ${expired || urgent ? "rgba(239,68,68,0.2)" : "rgba(99,102,241,0.2)"}`,
        }}
      >
        <span style={{ color: expired || urgent ? "#EF4444" : "var(--color-text-secondary)" }}>
          {expired
            ? "🔒 체험 기간이 만료되었습니다. 라이선스 키를 입력해주세요."
            : `${urgent ? "⚠️" : "🎁"} 무료 체험 `}
          {status.type === "trial" && (
            <>
              <strong>{status.daysLeft}일</strong> 남았어요
              {urgent && " — 라이선스 키를 입력하면 계속 사용할 수 있습니다"}
            </>
          )}
        </span>
        <button
          onClick={() => setShowModal(true)}
          className="shrink-0 px-3 py-1 rounded-lg text-xs font-semibold text-white"
          style={{ background: expired || urgent ? "#EF4444" : "var(--color-primary)" }}
        >
          키 입력
        </button>
      </div>

      {showModal && (
        <LicenseInputModal
          onClose={() => setShowModal(false)}
          onSuccess={() => { refresh(); setShowModal(false); }}
        />
      )}
    </>
  );
}
