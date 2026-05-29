"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { activateLicense, getLicenseStatus, hasAccess } from "@/lib/license";
import { getCurrentDeviceId } from "@/lib/license";

export default function ActivatePage() {
  const router = useRouter();

  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState("");

  useEffect(() => {
    setDeviceId(getCurrentDeviceId());
    // 이미 접근 권한 있으면 바로 이동
    const status = getLicenseStatus();
    if (hasAccess(status)) {
      router.replace("/todolist/notice");
    }
  }, []);  // eslint-disable-line

  const handleKeyInput = (val: string) => {
    // 자동 포맷: TDRI-XXXX-XXXX
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, "");
    let formatted = clean;
    if (clean.length > 4 && !clean.startsWith("TDRI")) {
      // 이미 TDRI로 시작하지 않으면 그냥 처리
    }
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
      router.replace("/todolist/notice");
    } else {
      setError(result.error);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--color-bg)" }}
    >
      <div className="w-full max-w-sm">
        {/* 로고 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-1 tracking-tight" style={{ color: "var(--color-primary)" }}>
            투두리
          </h1>
          <p className="text-sm tracking-widest" style={{ color: "var(--color-text-muted)" }}>
            자영업자 To do list
          </p>
        </div>

        <div
          className="rounded-2xl p-6"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
          <h2 className="text-base font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>
            라이선스 키 입력
          </h2>
          <p className="text-xs mb-6" style={{ color: "var(--color-text-muted)" }}>
            체험 기간이 만료되었습니다.<br />
            라이선스 키를 입력하면 계속 사용할 수 있어요.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={key}
                onChange={(e) => handleKeyInput(e.target.value)}
                placeholder="TDRI-XXXX-XXXX"
                maxLength={14}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none font-mono tracking-widest text-center"
                style={{
                  background: "var(--color-bg)",
                  border: `1px solid ${error ? "#EF4444" : "var(--color-border)"}`,
                  color: "var(--color-text-primary)",
                  letterSpacing: "0.1em",
                }}
                autoFocus
                autoComplete="off"
                spellCheck={false}
              />
              {error && (
                <p className="text-xs mt-2" style={{ color: "#EF4444" }}>
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || key.length < 14}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
              style={{ background: "var(--color-primary)" }}
            >
              {loading ? "확인 중..." : "활성화"}
            </button>
          </form>

          {/* 후원 안내 */}
          <div
            className="mt-6 rounded-xl overflow-hidden text-xs"
            style={{ border: "1px solid var(--color-border)" }}
          >
            <div
              className="px-4 py-2.5 font-semibold text-center"
              style={{ background: "rgba(201,168,76,0.08)", color: "var(--color-text-secondary)", borderBottom: "1px solid var(--color-border)" }}
            >
              ☕ 커피값 후원 → 라이선스 발급
            </div>
            <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
              {[
                { amount: "3,000원", period: "1개월", badge: "" },
                { amount: "5,000원", period: "2개월", badge: "인기" },
                { amount: "9,000원", period: "4개월", badge: "" },
                { amount: "15,000원", period: "8개월", badge: "" },
                { amount: "25,000원", period: "14개월", badge: "최대할인" },
              ].map(({ amount, period, badge }) => (
                <div
                  key={amount}
                  className="flex items-center justify-between px-4 py-2"
                  style={{ background: "var(--color-bg)" }}
                >
                  <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>
                    {amount}
                  </span>
                  <div className="flex items-center gap-2">
                    {badge && (
                      <span
                        className="px-1.5 py-0.5 rounded text-xs font-bold"
                        style={{ background: "rgba(201,168,76,0.12)", color: "var(--color-primary)" }}
                      >
                        {badge}
                      </span>
                    )}
                    <span style={{ color: "var(--color-text-secondary)" }}>{period}</span>
                  </div>
                </div>
              ))}
            </div>
            <div
              className="px-4 py-3 text-center space-y-1.5"
              style={{ background: "var(--color-bg)", borderTop: "1px solid var(--color-border)" }}
            >
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>카카오채널 또는 인스타 DM으로 문의</p>
              <a
                href="mailto:qwerty21341@gmail.com"
                className="text-xs block hover:underline"
                style={{ color: "var(--color-primary)" }}
              >
                ✉ qwerty21341@gmail.com
              </a>
            </div>
          </div>
        </div>

        {/* 기기 ID (디버깅/문의용) */}
        <p className="mt-4 text-center text-xs" style={{ color: "var(--color-text-muted)" }}>
          기기 ID: <span className="font-mono">{deviceId.slice(0, 16)}...</span>
        </p>
      </div>
    </div>
  );
}
