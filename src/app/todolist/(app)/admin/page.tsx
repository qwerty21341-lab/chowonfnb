"use client";

import { useState, useEffect, useCallback } from "react";

interface License {
  key: string;
  note: string | null;
  expires_at: string | null;
  revoked: boolean;
  bound_device_id: string | null;
  activated_at: string | null;
  created_at: string;
}

const basePath = "/todolist";

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");

  // 키 목록
  const [licenses, setLicenses] = useState<License[]>([]);
  const [listLoading, setListLoading] = useState(false);

  // 검색 & 필터
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "unused" | "active" | "revoked">("all");
  const [sortBy, setSortBy] = useState<"created" | "expires" | "activated">("created");

  // 키 생성 폼
  const [note, setNote] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [genError, setGenError] = useState("");

  const fetchLicenses = useCallback(async (s: string) => {
    setListLoading(true);
    const res = await fetch(`${basePath}/api/license/list?adminSecret=${encodeURIComponent(s)}`);
    const data = await res.json();
    if (data.success) setLicenses(data.licenses);
    setListLoading(false);
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      const res = await fetch(`${basePath}/api/license/list?adminSecret=${encodeURIComponent(secret)}`);
      const data = await res.json();
      if (data.success) {
        setAuthed(true);
        setLicenses(data.licenses ?? []);
        localStorage.setItem("tduri_admin_unlocked", "true");
        if (data.dbError) {
          console.warn("DB 연결 오류:", data.dbError);
        }
      } else {
        setAuthError(data.error ?? "인증 실패");
      }
    } catch {
      setAuthError("네트워크 오류. 다시 시도해주세요.");
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setGenError("");
    setNewKey(null);

    const res = await fetch(`${basePath}/api/license/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminSecret: secret,
        note: note || undefined,
        expiresAt: expiresAt || undefined,
      }),
    });
    const data = await res.json();
    setGenerating(false);

    if (data.success) {
      setNewKey(data.key);
      setNote("");
      setExpiresAt("");
      fetchLicenses(secret);
    } else {
      setGenError(data.error ?? "오류");
    }
  };

  const handleAction = async (key: string, action: "revoke" | "reset_device") => {
    const label = action === "revoke" ? "이 키를 취소하시겠습니까?" : "기기 바인딩을 초기화하시겠습니까?";
    if (!confirm(label)) return;

    await fetch(`${basePath}/api/license/revoke`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminSecret: secret, key, action }),
    });
    fetchLicenses(secret);
  };

  const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString("ko-KR") : "-";

  // 필터링 + 정렬
  const filtered = licenses
    .filter((lic) => {
      const q = search.trim().toLowerCase();
      if (q && !lic.key.toLowerCase().includes(q) && !(lic.note ?? "").toLowerCase().includes(q)) return false;
      if (statusFilter === "revoked" && !lic.revoked) return false;
      if (statusFilter === "active" && (lic.revoked || !lic.bound_device_id)) return false;
      if (statusFilter === "unused" && (lic.revoked || lic.bound_device_id)) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "expires") return (a.expires_at ?? "9999") < (b.expires_at ?? "9999") ? -1 : 1;
      if (sortBy === "activated") return (b.activated_at ?? "") > (a.activated_at ?? "") ? 1 : -1;
      return (b.created_at ?? "") > (a.created_at ?? "") ? 1 : -1;
    });

  // ── 인증 전 ──
  if (!authed) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: "var(--color-bg)" }}
      >
        <div
          className="w-full max-w-xs rounded-2xl p-6"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
          <h2 className="text-base font-bold mb-4" style={{ color: "var(--color-text-primary)" }}>
            🔑 관리자 인증
          </h2>
          <form onSubmit={handleAuth} className="space-y-3">
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="관리자 비밀번호"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{
                background: "var(--color-bg)",
                border: `1px solid ${authError ? "#EF4444" : "var(--color-border)"}`,
                color: "var(--color-text-primary)",
              }}
              autoFocus
            />
            {authError && (
              <p className="text-xs" style={{ color: "#EF4444" }}>{authError}</p>
            )}
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: "var(--color-primary)" }}
            >
              확인
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── 인증 후 ──
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
          라이선스 관리
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
          키 발급 · 취소 · 기기 초기화
        </p>
      </div>

      {/* 키 생성 */}
      <div
        className="rounded-2xl p-6 mb-6"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <h2 className="text-sm font-bold mb-4" style={{ color: "var(--color-text-secondary)" }}>
          새 키 발급
        </h2>
        <form onSubmit={handleGenerate} className="space-y-3">
          <div className="flex gap-3">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="메모 (예: 홍길동, 2026-06)"
              className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{
                background: "var(--color-bg)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-primary)",
              }}
            />
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{
                background: "var(--color-bg)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-primary)",
              }}
              title="만료일 (비워두면 무기한)"
            />
          </div>
          {genError && (
            <p className="text-xs" style={{ color: "#EF4444" }}>{genError}</p>
          )}
          {newKey && (
            <div
              className="flex items-center justify-between px-4 py-3 rounded-xl"
              style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.3)" }}
            >
              <span className="text-sm font-mono font-bold" style={{ color: "var(--color-primary)" }}>
                ✓ {newKey}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(newKey);
                }}
                className="ml-3 px-3 py-1 rounded-lg text-xs font-semibold transition-colors shrink-0"
                style={{ background: "rgba(201,168,76,0.15)", color: "var(--color-primary)", border: "1px solid rgba(201,168,76,0.3)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(201,168,76,0.28)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(201,168,76,0.15)")}
              >
                복사
              </button>
            </div>
          )}
          <button
            type="submit"
            disabled={generating}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "var(--color-primary)" }}
          >
            {generating ? "생성 중..." : "+ 키 생성"}
          </button>
        </form>
      </div>

      {/* 검색 & 필터 */}
      <div className="flex flex-wrap gap-2 mb-3 items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="이름 또는 키 검색..."
          className="flex-1 min-w-40 px-3 py-2 rounded-xl text-xs outline-none"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-primary)",
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="px-3 py-2 rounded-xl text-xs outline-none"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-primary)",
          }}
        >
          <option value="all">전체 상태</option>
          <option value="unused">미사용</option>
          <option value="active">활성</option>
          <option value="revoked">취소됨</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="px-3 py-2 rounded-xl text-xs outline-none"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-primary)",
          }}
        >
          <option value="created">발급일순</option>
          <option value="expires">만료일순</option>
          <option value="activated">활성화일순</option>
        </select>
        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {filtered.length} / {licenses.length}건
        </span>
      </div>

      {/* 키 목록 */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <div
          className="px-4 py-3 text-xs font-semibold grid"
          style={{
            gridTemplateColumns: "170px 1fr 90px 90px 70px 120px",
            background: "var(--color-bg)",
            borderBottom: "1px solid var(--color-border)",
            color: "var(--color-text-muted)",
          }}
        >
          <span>키</span>
          <span>메모</span>
          <span>만료일</span>
          <span>활성화일</span>
          <span>상태</span>
          <span className="text-right">관리</span>
        </div>

        {listLoading ? (
          <div className="py-8 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
            불러오는 중...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
            {licenses.length === 0 ? "발급된 키가 없습니다" : "검색 결과가 없습니다"}
          </div>
        ) : (
          filtered.map((lic, idx) => (
            <div
              key={lic.key}
              className="grid px-4 py-3 items-center text-xs"
              style={{
                gridTemplateColumns: "170px 1fr 90px 90px 70px 120px",
                borderTop: idx === 0 ? "none" : "1px solid var(--color-border)",
                opacity: lic.revoked ? 0.45 : 1,
              }}
            >
              <span className="font-mono font-bold" style={{ color: "var(--color-primary)" }}>
                {lic.key}
              </span>
              <span style={{ color: "var(--color-text-secondary)" }} className="truncate pr-2">
                {lic.note ?? "-"}
              </span>
              <span style={{ color: "var(--color-text-muted)" }}>{fmt(lic.expires_at)}</span>
              <span style={{ color: "var(--color-text-muted)" }}>{fmt(lic.activated_at)}</span>
              <span>
                {lic.revoked ? (
                  <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: "#FEF2F2", color: "#EF4444" }}>취소</span>
                ) : lic.bound_device_id ? (
                  <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: "rgba(16,185,129,0.1)", color: "#10B981" }}>활성</span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: "var(--color-bg)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}>미사용</span>
                )}
              </span>
              <div className="flex justify-end gap-1">
                {!lic.revoked && lic.bound_device_id && (
                  <button
                    onClick={() => handleAction(lic.key, "reset_device")}
                    className="px-2 py-0.5 rounded text-xs"
                    style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
                  >
                    기기초기화
                  </button>
                )}
                {!lic.revoked && (
                  <button
                    onClick={() => handleAction(lic.key, "revoke")}
                    className="px-2 py-0.5 rounded text-xs"
                    style={{ border: "1px solid #EF444440", color: "#EF4444" }}
                  >
                    취소
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
