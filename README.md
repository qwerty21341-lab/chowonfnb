# 초원에프앤비 (chowonfnb)

> **모그룹:** 초원에프앤비  
> **서브브랜드:** 단소상회 (포항 한우 식당) · 투두리 (소상공인 마케팅 툴)  
> **배포 URL:** https://chowonfnb.com  
> **Vercel 프로젝트:** https://vercel.com/chowonfnb/chowonfnb

---

## 프로젝트 구조 (단일 Next.js 앱)

이전에는 `chowonfnb`(식당)와 `myza-marketing`(투두리)이 별개의 Vercel 프로젝트로 분리되어  
Next.js Multi-Zone + beforeFiles rewrite로 연결되어 있었으나,  
**2025-05 통합 작업으로 단일 프로젝트로 병합**되었다.

```
chowonfnb.com/              → 허브 페이지 (단소상회 / 투두리 선택)
chowonfnb.com/danso/*       → 단소상회 (포항 참숯 한우 전문점)
chowonfnb.com/todolist/*    → 투두리 (소상공인 마케팅 관리 툴)
```

---

## 기술 스택

| 항목 | 내용 |
|------|------|
| 프레임워크 | Next.js 16 (App Router, Turbopack) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS v4 |
| 인증 | Supabase Auth (OAuth: Google, GitHub) |
| DB | Supabase (PostgreSQL) |
| 이메일 | Resend API |
| 배포 | Vercel (단일 프로젝트) |
| 도메인 | chowonfnb.com (Gabia) |

---

## 환경변수

`.env.local` 파일이 프로젝트 루트에 있어야 한다.  
Vercel에는 모두 Production 환경변수로 설정되어 있다.

```env
# Supabase (투두리 인증 + 라이선스 DB)
NEXT_PUBLIC_SUPABASE_URL=https://bvsezvvvgrxzxdnvqhja.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...         # 브라우저용 공개 키
SUPABASE_SERVICE_KEY=eyJ...                  # 서버 전용 service_role 키 (RLS 우회)

# 투두리 관리자 인증
ADMIN_SECRET=...                             # /todolist/admin 페이지 비밀번호

# 단소상회 예약 이메일
RESEND_API_KEY=re_...
RESERVATION_TO_EMAIL=이메일주소@gmail.com

# 공휴일 API (투두리 캘린더)
HOLIDAY_API_KEY=...

# 텔레그램 알림 (선택)
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
```

> **로컬 개발 시 주의:** Supabase Auth redirect URL이 `http://localhost:3000/**`으로  
> 허용되어 있으므로 로컬 포트를 3000으로 맞출 것.

---

## 로컬 실행

```bash
npm install
npx next dev --turbopack -p 3000
```

브라우저: `http://localhost:3000`

---

## URL 전체 구조

### 허브
| URL | 설명 |
|-----|------|
| `chowonfnb.com/` | 허브 페이지 — 단소상회·투두리 카드 선택 |

### 단소상회 `/danso`
| URL | 설명 |
|-----|------|
| `/danso` | 메인 (스플래시 → 히어로 → 메뉴 → 예약) |
| `/danso/menu` | 한우 부위 메뉴판 |
| `/danso/info` | 찾아오기 (지도 + 외관) |
| `/danso/blog` | 블로그 목록 |
| `/danso/blog/[slug]` | 블로그 포스트 (MDX) |
| `/danso/reservation` | 예약 요청 폼 |
| `/danso/privacy` | 개인정보처리방침 |

### 투두리 `/todolist`
| URL | 설명 |
|-----|------|
| `/todolist` | → `/todolist/notice` 리다이렉트 |
| `/todolist/login` | Supabase OAuth 로그인 |
| `/todolist/auth/callback` | OAuth 콜백 |
| `/todolist/activate` | 라이선스 키 입력 (페이지) |
| `/todolist/notice` | 공지사항 (로그인 후 첫 화면) |
| `/todolist/dashboard` | 대시보드 |
| `/todolist/rank` | 네이버 플레이스 순위 조회 |
| `/todolist/keywords` | 키워드 관리 |
| `/todolist/naver/place-rank` | 네이버 플레이스 상세 |
| `/todolist/ai/*` | AI 콘텐츠 생성 도구들 |
| `/todolist/settings` | 설정 |
| `/todolist/settings/business` | 사업장 정보 |
| `/todolist/settings/naver` | 네이버 연동 |
| `/todolist/settings/kakao` | 카카오 연동 |
| `/todolist/settings/google` | 구글 연동 |
| `/todolist/admin` | 라이선스 관리 (ADMIN_SECRET 인증) |
| `/todolist/fun/lotto` | 로또 번호 생성 |
| `/todolist/speedtest` | 속도 테스트 |

### 투두리 API
| URL | 설명 |
|-----|------|
| `/todolist/api/license/activate` | 라이선스 키 활성화 + 기기 바인딩 |
| `/todolist/api/license/generate` | 라이선스 키 생성 (admin) |
| `/todolist/api/license/list` | 라이선스 목록 조회 (admin) |
| `/todolist/api/license/revoke` | 라이선스 폐기 (admin) |
| `/todolist/api/holidays` | 공휴일 API 프록시 |

---

## 라이선스 시스템

투두리는 유료 라이선스 키로 접근을 제한한다.

### 키 형식
```
TDRI-XXXX-XXXX   (예: TDRI-U84X-WCFR)
```

### 흐름
1. 사용자가 로그인 후 라이선스 키 없으면 `LicenseBanner` 또는 Sidebar의 🔑 버튼으로 모달 표시
2. `LicenseInputModal` 컴포넌트에서 키 입력 → `/todolist/api/license/activate` 호출
3. Supabase `licenses` 테이블에서 키 유효성 확인 + `bound_device_id` 기기 바인딩
4. 활성화 성공 시 localStorage에 상태 저장 → 콘텐츠 접근 허용

### Supabase licenses 테이블 스키마
```sql
create table public.licenses (
  key            text primary key,
  note           text,
  expires_at     timestamptz,
  revoked        boolean not null default false,
  bound_device_id text,
  activated_at   timestamptz,
  created_at     timestamptz not null default now()
);
-- RLS 활성화됨. 접근은 service_role 키로만 가능.
```

### 관리자 페이지 (`/todolist/admin`)
- `ADMIN_SECRET` 비밀번호 입력 → localStorage `tduri_admin_unlocked` 저장
- 기능: 키 생성 / 검색·필터·정렬 / 복사 버튼 / 폐기

---

## 인증 (Supabase Auth)

| 설정 항목 | 값 |
|-----------|---|
| Supabase 프로젝트 | `bvsezvvvgrxzxdnvqhja` |
| site_url | `https://chowonfnb.com` |
| Redirect URLs | `https://chowonfnb.com/**`, `https://chowonfnb.com/todolist/auth/callback`, `http://localhost:3000/**` |

---

## 파일 구조

```
src/
├── app/
│   ├── layout.tsx                      # 루트 레이아웃 (폰트·메타)
│   ├── globals.css                     # 브랜드 컬러, 폰트 변수
│   ├── page.tsx                        # 허브 페이지 (단소상회 / 투두리 카드)
│   ├── icon.tsx                        # 동적 파비콘
│   ├── sitemap.ts
│   ├── robots.ts
│   ├── danso/
│   │   ├── page.tsx                    # 단소상회 메인 (서버 컴포넌트)
│   │   ├── danso-client.tsx            # 클라이언트 컴포넌트 (애니메이션 등)
│   │   ├── actions.ts                  # 예약 서버 액션 (Resend 이메일)
│   │   ├── menu/page.tsx
│   │   ├── info/page.tsx
│   │   ├── blog/page.tsx
│   │   ├── blog/[slug]/page.tsx
│   │   ├── reservation/page.tsx
│   │   └── privacy/page.tsx
│   └── todolist/
│       ├── page.tsx                    # → /todolist/notice 리다이렉트
│       ├── login/page.tsx              # OAuth 로그인
│       ├── activate/page.tsx           # 라이선스 키 입력 페이지
│       ├── auth/callback/route.ts      # OAuth 콜백
│       ├── admin/page.tsx              # 라이선스 관리자
│       ├── (app)/                      # 인증 필요 라우트 그룹
│       │   ├── layout.tsx              # 인증 미들웨어
│       │   ├── notice/page.tsx
│       │   ├── dashboard/page.tsx
│       │   ├── rank/page.tsx
│       │   ├── keywords/page.tsx
│       │   ├── naver/place-rank/page.tsx
│       │   ├── ai/*/page.tsx           # AI 도구 13종
│       │   ├── settings/*/page.tsx
│       │   └── fun/lotto/page.tsx
│       └── api/
│           ├── license/activate/route.ts
│           ├── license/generate/route.ts
│           ├── license/list/route.ts
│           ├── license/revoke/route.ts
│           └── holidays/route.ts
├── components/
│   ├── SiteNav.tsx                     # 단소상회 상단 네비게이션
│   ├── LicenseBanner.tsx               # 라이선스 미인증 배너
│   ├── LicenseInputModal.tsx           # 라이선스 키 입력 모달 (공용)
│   └── layout/
│       └── Sidebar.tsx                 # 투두리 사이드바
├── features/                           # 투두리 기능별 컴포넌트
├── lib/
│   ├── license.ts                      # 라이선스 활성화 로직 (basePath: /todolist)
│   ├── supabase/
│   │   ├── client.ts                   # 브라우저용 Supabase 클라이언트
│   │   ├── server.ts                   # 서버용 Supabase 클라이언트
│   │   └── useUser.ts                  # 유저 상태 훅
│   └── utils.ts
├── content/
│   └── blog/                           # 단소상회 블로그 MDX 파일
└── dictionaries/
    ├── ko.json                         # 단소상회 한국어 텍스트
    └── index.ts
```

---

## 단소상회 섹션 구성

| 섹션 | 설명 |
|------|------|
| `SplashScreen` | 오프닝 애니메이션 |
| `HeroSection` | 풀스크린 히어로 + 숯불 파티클 |
| `AboutSection` | 사장 스토리 |
| `StorySection` | STANDARD 차별화 포인트 5개 |
| `GallerySection` | 사진 8장 그리드 |
| `ReviewSection` | 후기 12장 |
| `MenuSection` | 한우 부위 13종 |
| `ReservationSection` | 예약 요청 폼 |
| `InfoSection` | 찾아오기 (지도 + 외관) |

---

## 브랜드 컬러

```
gold     #d4a843   프리미엄 포인트 (단소상회 메인)
ember    #ff6b2b   참숯/불
sage     #9dbfb0   공간/편안함
slate    #a0aab8   실용/신뢰
cream    #f5f0e8   본문 텍스트
charcoal #0d0d0d   다크 배경
panel    #111111   섹션 배경
```

---

## 자주 하는 작업

| 작업 | 수정 파일 |
|------|-----------|
| 단소상회 텍스트 수정 | `src/dictionaries/ko.json` |
| 메뉴 항목 변경 | `danso-client.tsx` → `BEEF_GRID`, `SIDE_ITEMS` 배열 |
| 영업시간/주소 변경 | `ko.json` + `app/layout.tsx` JSON-LD |
| 예약 수신 이메일 변경 | Vercel → `RESERVATION_TO_EMAIL` |
| 갤러리 사진 교체 | `public/gallery/g1~g8.jpg` 동일 파일명 덮어쓰기 |
| 블로그 포스트 추가 | `src/content/blog/` 에 MDX 파일 추가 |
| 허브 카드 추가 | `src/app/page.tsx` → `BRANDS` 배열에 항목 추가 |
| 라이선스 키 생성 | `chowonfnb.com/todolist/admin` 관리자 페이지 |
| 어드민 비밀번호 변경 | Vercel → `ADMIN_SECRET` 환경변수 |

---

## 예약 폼 & 이메일

1. 사용자 폼 작성 → `actions.ts` `submitReservation()` 서버 액션
2. Resend API → `RESERVATION_TO_EMAIL` 발송
3. 발신자: `단소상회 예약 <noreply@chowonfnb.com>`

**예약 가능 정책**
- 지난 날짜 불가
- 당일 예약은 한국 시간 오후 4시 전까지만

---

## 배포

```bash
vercel --prod
```

---

## 외부 서비스

| 서비스 | 용도 | 관리 URL |
|--------|------|----------|
| **Vercel** | 빌드·배포 | https://vercel.com/chowonfnb/chowonfnb |
| **Supabase** | 인증·DB | https://supabase.com/dashboard/project/bvsezvvvgrxzxdnvqhja |
| **Gabia** | 도메인 DNS | https://www.gabia.com |
| **Resend** | 예약 이메일 | https://resend.com |

---

## 통합 이력

| 날짜 | 내용 |
|------|------|
| 2025-05 | `myza-marketing` Vercel 프로젝트를 `chowonfnb`에 완전 병합. Multi-Zone 구조 제거, `/todolist/*` 라우트 네이티브 통합. Supabase Auth redirect URL을 `chowonfnb.com`으로 업데이트. |
