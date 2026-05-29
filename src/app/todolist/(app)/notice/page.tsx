"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Notice {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

const ADMIN_FLAG_KEY = "tduri_admin_unlocked";

const DEFAULT_NOTICES: Notice[] = [
  {
    id: -1,
    title: "🚀 투두리 사용법 — 처음이라면 여기서 시작하세요",
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    content: `투두리는 자영업자가 매일 해야 할 마케팅 작업을 빠르게 처리할 수 있도록 도와주는 도구입니다.

📋 기초 세팅 (처음 1회)
사이드바 상단 [기초 세팅] 메뉴에서 네이버·카카오·구글 채널을 연결하고 사용법을 확인하세요.
한 번만 해두면 이후 작업이 훨씬 빨라집니다.

📌 매일 루틴 (15~40분)
[매일 관리] 메뉴에서 각 플랫폼별 리뷰 답글 작성, 인스타그램 캡션·해시태그, 카카오채널 메시지 등을 AI로 빠르게 처리하세요.

✍ 블로그 마케팅 (매주)
[블로그 마케팅] 메뉴에서 키워드 순위 확인, 새 키워드 발굴, 검색량 조회를 매주 챙기세요.
네이버 상위 노출이 꾸준한 신규 고객 유입으로 이어집니다.

📊 성과 분석 (매월)
[성과 분석] > [대시보드]에서 키워드별 순위 추이를 확인하세요.`,
  },
  {
    id: -2,
    title: "📝 리뷰 답글 작성 방법",
    created_at: "2026-05-02T00:00:00Z",
    updated_at: "2026-05-02T00:00:00Z",
    content: `네이버 플레이스·구글·카카오맵 리뷰에 빠르게 답글을 달 수 있습니다.

1. 사이드바에서 [매일 관리] > 원하는 플랫폼 답글 메뉴 클릭
2. 고객이 작성한 리뷰 내용을 붙여넣기
3. 가게 분위기·특징 등 추가 정보 입력 (선택)
4. [생성] 버튼 클릭 → AI가 자연스러운 답글 3가지 작성
5. 마음에 드는 답글 선택 후 [복사] → 해당 플랫폼에 직접 붙여넣기

💡 팁: 리뷰에 고객 이름이 있으면 함께 입력하면 더 개인화된 답글이 나옵니다.`,
  },
  {
    id: -3,
    title: "🔑 키워드 순위 조회 방법",
    created_at: "2026-05-03T00:00:00Z",
    updated_at: "2026-05-03T00:00:00Z",
    content: `네이버 블로그 검색에서 내 가게가 몇 위에 노출되는지 실시간으로 확인할 수 있습니다.

1. 사이드바 [블로그 마케팅] > [키워드 관리] 클릭
2. 조회할 키워드 입력 (예: "포항 한우 맛집")
3. 내 블로그 URL 또는 가게명 입력
4. [조회] 클릭 → 검색 결과 중 몇 위인지 확인

📌 주의사항
- 네이버 블로그 검색 기준으로 조회됩니다
- 순위는 로그인 여부·지역에 따라 다소 다를 수 있습니다
- 매주 같은 요일에 조회해 추이를 비교하면 효과적입니다

🔍 키워드 찾기가 막막하다면?
[키워드 찾기] 메뉴에서 업종·지역을 입력하면 AI가 공략 키워드를 추천해 드립니다.`,
  },
  {
    id: -4,
    title: "💡 자주 묻는 질문 (FAQ)",
    created_at: "2026-05-04T00:00:00Z",
    updated_at: "2026-05-04T00:00:00Z",
    content: `Q. AI가 생성한 내용을 그대로 써도 되나요?
A. 생성된 내용은 참고용입니다. 가게 상황에 맞게 살짝 수정해서 사용하면 더 자연스럽습니다.

Q. 라이선스는 어떻게 구매하나요?
A. 카카오채널, 인스타그램 DM 또는 이메일(qwerty21341@gmail.com)로 문의해 주세요. 커피값 후원 후 라이선스 키를 발급해 드립니다.

Q. 체험 기간은 얼마나 되나요?
A. 처음 접속 시 7일 무료 체험이 자동으로 시작됩니다.

Q. 여러 기기에서 사용할 수 있나요?
A. 라이선스 키는 기기당 1개로 등록됩니다. 기기 변경이 필요하면 문의해 주세요.

Q. 데이터가 저장되나요?
A. 키워드·업체 정보 등은 브라우저 로컬 스토리지에 저장됩니다. 브라우저 데이터를 초기화하면 삭제될 수 있습니다.`,
  },
];

export default function NoticePage() {
  const [isMaster, setIsMaster] = useState(false);
  const supabase = createClient();

  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  // 폼 상태
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Notice | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [saving, setSaving] = useState(false);

  // 삭제 확인
  const [deleteTarget, setDeleteTarget] = useState<Notice | null>(null);

  useEffect(() => {
    // 관리자 페이지(/todolist/admin)에서 인증 후 설정되는 플래그
    setIsMaster(localStorage.getItem(ADMIN_FLAG_KEY) === "true");
  }, []);

  const fetchNotices = async () => {
    const { data } = await supabase
      .from("notices")
      .select("*")
      .order("created_at", { ascending: false });
    setNotices((data as Notice[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchNotices(); }, []);

  const openWrite = () => {
    setEditTarget(null);
    setFormTitle("");
    setFormContent("");
    setShowForm(true);
  };

  const openEdit = (notice: Notice) => {
    setEditTarget(notice);
    setFormTitle(notice.title);
    setFormContent(notice.content);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditTarget(null);
  };

  const save = async () => {
    if (!formTitle.trim() || !formContent.trim()) return;
    setSaving(true);
    if (editTarget) {
      await supabase
        .from("notices")
        .update({ title: formTitle.trim(), content: formContent.trim(), updated_at: new Date().toISOString() })
        .eq("id", editTarget.id);
    } else {
      await supabase
        .from("notices")
        .insert({ title: formTitle.trim(), content: formContent.trim() });
    }
    setSaving(false);
    closeForm();
    fetchNotices();
  };

  const deleteNotice = async () => {
    if (!deleteTarget) return;
    await supabase.from("notices").delete().eq("id", deleteTarget.id);
    setDeleteTarget(null);
    fetchNotices();
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\. /g, "-").replace(".", "");

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>
            공지사항
          </h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            투두리의 새로운 소식을 전달합니다
          </p>
        </div>
        {isMaster && (
          <button
            onClick={openWrite}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: "var(--color-primary)" }}
          >
            + 글쓰기
          </button>
        )}
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid var(--color-border)", background: "var(--color-surface)" }}
      >
        {/* 테이블 헤더 */}
        <div
          className="grid px-6 py-3 text-xs font-semibold"
          style={{
            gridTemplateColumns: "1fr 120px" + (isMaster ? " 80px" : ""),
            background: "var(--color-bg)",
            borderBottom: "1px solid var(--color-border)",
            color: "var(--color-text-muted)",
          }}
        >
          <span>제목</span>
          <span className="text-right">날짜</span>
          {isMaster && <span className="text-right">관리</span>}
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>불러오는 중...</div>
        ) : (
          [...notices, ...DEFAULT_NOTICES].map((notice, idx, arr) => (
            <PostRow
              key={notice.id}
              notice={notice}
              isLast={idx === arr.length - 1}
              isMaster={isMaster && notice.id > 0}
              onEdit={() => notice.id > 0 && openEdit(notice)}
              onDelete={() => notice.id > 0 && setDeleteTarget(notice)}
              formatDate={formatDate}
            />
          ))
        )}
      </div>

      {/* 글쓰기 / 수정 폼 모달 */}
      {showForm && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={closeForm}
        >
          <div
            className="rounded-2xl w-full max-w-lg mx-4 overflow-hidden"
            style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-6 pb-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
              <h2 className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>
                {editTarget ? "공지 수정" : "공지 작성"}
              </h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>제목</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="제목을 입력하세요"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>내용</label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="내용을 입력하세요"
                  rows={8}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)", fontFamily: "inherit" }}
                />
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-2">
              <button
                onClick={closeForm}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}
              >
                취소
              </button>
              <button
                onClick={save}
                disabled={saving || !formTitle.trim() || !formContent.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "var(--color-primary)" }}
              >
                {saving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="rounded-2xl px-8 py-6 flex flex-col items-center gap-4 w-72"
            style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>공지 삭제</p>
            <p className="text-sm text-center" style={{ color: "var(--color-text-secondary)" }}>
              &ldquo;{deleteTarget.title}&rdquo;을 삭제할까요?
            </p>
            <div className="flex gap-2 w-full">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}
              >
                취소
              </button>
              <button
                onClick={deleteNotice}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: "#EF4444" }}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PostRow({
  notice,
  isLast,
  isMaster,
  onEdit,
  onDelete,
  formatDate,
}: {
  notice: Notice;
  isLast: boolean;
  isMaster: boolean;
  onEdit: () => void;
  onDelete: () => void;
  formatDate: (iso: string) => string;
}) {
  return (
    <details
      className="group"
      style={{ borderBottom: isLast ? "none" : "1px solid var(--color-border)" }}
    >
      <summary
        className="grid px-6 py-4 cursor-pointer list-none items-center"
        style={{ gridTemplateColumns: "1fr 120px" + (isMaster ? " 80px" : ""), userSelect: "none" }}
      >
        <span
          className="text-sm font-medium group-open:font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          {notice.title}
        </span>
        <span className="text-xs text-right" style={{ color: "var(--color-text-muted)" }}>
          {formatDate(notice.created_at)}
        </span>
        {isMaster && (
          <div className="flex justify-end gap-1" onClick={(e) => e.preventDefault()}>
            <button
              onClick={onEdit}
              className="px-2 py-0.5 rounded text-xs whitespace-nowrap"
              style={{ color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}
            >
              수정
            </button>
            <button
              onClick={onDelete}
              className="px-2 py-0.5 rounded text-xs whitespace-nowrap"
              style={{ color: "#EF4444", border: "1px solid #EF444440" }}
            >
              삭제
            </button>
          </div>
        )}
      </summary>
      <div
        className="px-6 py-5 text-sm whitespace-pre-wrap"
        style={{
          background: "var(--color-bg)",
          borderTop: "1px solid var(--color-border)",
          color: "var(--color-text-secondary)",
          lineHeight: 1.8,
        }}
      >
        {notice.content}
      </div>
    </details>
  );
}
