"use client";

import React, { useState } from "react";
import { activateLicense } from "@/lib/license";

export function LicenseInputModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleKeyInput = (val: string) => {
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, "");
    let formatted = clean;
    if (clean.startsWith("TDRI")) {
      const body = clean.slice(4);
      if (body.length <= 4) {
        formatted = body.length > 0 ? `TDRI-${body}` : "TDRI";
      } else {
        formatted = `TDRI-${body.slice(0, 4)}-${body.slice(4, 8)}`;
      }
    }
    setKey(formatted);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await activateLicense(key);
    setLoading(false);
    if (result.success) {
      setDone(true);
      setTimeout(() => onSuccess(), 1400);
    } else {
      setError(result.error ?? "오류가 발생했습니다");
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: "rgba(0,0,0,0.72)" }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl p-6 mx-4"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
          width: 320,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>
              라이선스 키 입력
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
              인증 시 이 기기에 자동 바인딩됩니다
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-sm shrink-0"
            style={{ color: "var(--color-text-muted)" }}
          >
            ✕
          </button>
        </div>

        {done ? (
          <div className="text-center py-5">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-xl mx-auto mb-3"
              style={{ background: "rgba(201,168,76,0.15)", color: "#c9a84c" }}
            >
              ✓
            </div>
            <p className="text-sm font-bold" style={{ color: "#c9a84c" }}>
              활성화 완료!
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
              이 기기에 라이선스가 바인딩되었습니다
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              value={key}
              onChange={(e) => handleKeyInput(e.target.value)}
              placeholder="TDRI-XXXX-XXXX"
              maxLength={14}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none font-mono text-center"
              style={{
                background: "var(--color-bg)",
                border: `1px solid ${error ? "#EF4444" : "var(--color-border)"}`,
                color: "var(--color-text-primary)",
                letterSpacing: "0.12em",
              }}
              autoFocus
              autoComplete="off"
              spellCheck={false}
            />
            {error && (
              <p className="text-xs" style={{ color: "#EF4444" }}>
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading || key.length < 14}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-opacity"
              style={{ background: "var(--color-primary)" }}
            >
              {loading ? "확인 중..." : "활성화"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
