# 단소상회 (chowonfnb)

포항 한우 전문점 **단소상회** 공식 웹사이트.  
Next.js App Router 기반, Vercel 배포, Resend 이메일 예약 알림.

---

## 기술 스택

| 항목 | 내용 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS v4 |
| 폰트 | Noto Serif KR / Noto Sans KR (KO), Playfair Display (EN 헤딩) |
| 이메일 | Resend API |
| 번역 | MyMemory API (무료, 키 불필요) |
| 배포 | Vercel |
| 도메인 | chowonfnb.com (Gabia) |

---

## 로컬 실행

```bash
npm install
npx next dev --turbopack
```

브라우저에서 `http://localhost:3000/ko/danso` 열기 (루트 `/` → `/ko` → `/ko/danso` 자동 리다이렉트)

---

## 환경변수

`.env.local` 파일이 프로젝트 루트에 있어야 함 (`.gitignore`에 포함)

```env
RESEND_API_KEY=re_xxxxxxxxxxxx
RESERVATION_TO_EMAIL=이메일주소@gmail.com
```

Vercel 환경변수 확인: `npx vercel env ls production`

---

## 다국어 (i18n)

URL 기반 라우팅. `/ko` 또는 `/en` 로케일 프리픽스로 페이지가 분리된다.

| URL | 설명 |
|-----|------|
| `chowonfnb.com/` | → `/ko` 308 리다이렉트 |
| `chowonfnb.com/ko/danso` | 한국어 메인 |
| `chowonfnb.com/en/danso` | 영문 메인 |
| `chowonfnb.com/ko/danso/menu` | 한국어 메뉴 |
| `chowonfnb.com/en/danso/menu` | 영문 메뉴 |
| `chowonfnb.com/ko/danso/info` | 한국어 찾아오기 |
| `chowonfnb.com/en/danso/info` | 영문 찾아오기 |
| `chowonfnb.com/ko/danso/privacy` | 개인정보처리방침 |
| `chowonfnb.com/en/danso/privacy` | Privacy Policy |

### 구조

- **`src/proxy.ts`** — Next.js 16 프록시 (미들웨어 역할). 로케일 없는 경로를 `/ko`로 리다이렉트
- **`src/dictionaries/ko.json`** — 한국어 텍스트 전체
- **`src/dictionaries/en.json`** — 영문 텍스트 전체
- **`src/dictionaries/index.ts`** — `Dict` 타입 (`typeof koJson`), `getDictionary()`, `hasLocale()`
- **`src/app/[lang]/layout.tsx`** — 로케일 검증 + `LanguageSwitcher` 렌더링 + `data-lang` 래퍼
- **`src/components/LanguageSwitcher.tsx`** — 우상단 고정 한국어/English 드롭다운

### 텍스트 수정

```
한국어 → src/dictionaries/ko.json
영문   → src/dictionaries/en.json
```

### EN 페이지 폰트

`[data-lang="en"]` 래퍼에서 CSS custom property `--font-serif`를 Playfair Display로 재정의.  
KO 페이지는 Noto Serif KR 그대로 유지. `globals.css` 참고.

---

## 파일 구조

```
src/
├── proxy.ts                        # 로케일 리다이렉트 (Next.js 16 프록시)
├── dictionaries/
│   ├── ko.json                     # 한국어 텍스트
│   ├── en.json                     # 영문 텍스트
│   └── index.ts                    # Dict 타입 · getDictionary · hasLocale
├── components/
│   └── LanguageSwitcher.tsx        # 언어 전환 드롭다운 (고정 우상단)
└── app/
    ├── layout.tsx                  # 루트 레이아웃 (폰트 로딩, Restaurant JSON-LD)
    ├── page.tsx                    # / → /ko 리다이렉트
    ├── icon.tsx                    # 동적 파비콘 (골드 "牛")
    ├── sitemap.ts                  # 사이트맵 (6개 URL: ko+en × danso+menu+info)
    ├── robots.ts                   # robots.txt
    ├── globals.css                 # Tailwind @theme, 브랜드 컬러, 폰트 변수
    │
    ├── danso/                      # 레거시 리다이렉트 (구 URL 호환)
    │   ├── page.tsx                # → /ko/danso
    │   ├── menu/page.tsx           # → /ko/danso/menu
    │   └── info/page.tsx           # → /ko/danso/info
    │
    └── [lang]/
        ├── layout.tsx              # 로케일 검증 + LanguageSwitcher + data-lang 래퍼
        ├── page.tsx                # /ko → /ko/danso, /en → /en/danso 리다이렉트
        └── danso/
            ├── layout.tsx          # /danso 전용 메타데이터 + FAQ JSON-LD + hreflang
            ├── page.tsx            # 서버: getDictionary → DansoPage 렌더
            ├── danso-client.tsx    # 클라이언트: 전체 섹션 컴포넌트 (DictContext)
            ├── actions.ts          # 서버 액션: 예약 폼 처리 + Resend 이메일 + 번역
            ├── menu/
            │   └── page.tsx        # 메뉴 상세 + 로케일별 설명
            ├── info/
            │   └── page.tsx        # 찾아오기 + 로케일별 메타데이터
            └── privacy/
                └── page.tsx        # 개인정보처리방침 (KO/EN, noindex)

public/
├── og/danso-ssam.jpg               # OG 이미지 (1200×630)
├── gallery/g1~g8.jpg               # 갤러리 이미지 8장
├── reviews/r1~r12.jpg              # 네이버 방문 후기 이미지 12장
├── story/raw-marbling.jpg          # STANDARD 01 원육 마블링
└── exterior.jpg                    # 매장 외관
```

---

## 주요 섹션 (danso-client.tsx)

| 섹션 | 설명 |
|------|------|
| `SplashScreen` | 오프닝 애니메이션 — 포항·한우·1++(9)·참숯 순차 등장 후 단소상회 골드 출력 |
| `HeroSection` | 풀스크린 히어로, 숯불 파티클 + SCROLL 꺽쇠 |
| `AboutSection` | 사장 스토리 (Born 1991 · 어느 여름) |
| `StorySection` | STANDARD — 차별화 포인트 5개, 01~05 넘버링 + 브랜드 컬러 |
| `GallerySection` | 사진 8장 그리드 (와이드 2장 + 정사각 6장) |
| `ReviewSection` | 후기 12장, 4→8→12 더보기 / EN 페이지엔 사진 아래 인용구 표시 |
| `MenuSection` | 한우 부위 13종, SIGNATURE 히어로 + 2열 그리드 |
| `ReservationSection` | 예약 요청 폼 → Resend 이메일 발송 |
| `InfoSection` | 찾아오기 — 지도 임베드 + 카카오/네이버/구글 버튼 + 외관 사진 |
| `Footer` | 인스타그램 링크 + 개인정보처리방침 링크 (언어 자동 전환) |
| `BottomBar` | 하단 고정바 (예약하기 / 전화) |

### STANDARD 섹션 블록

| 번호 | 제목 | 컬러 | 특이사항 |
|------|------|------|----------|
| 01 | 1++(9) 특상한우의 의미 | `gold` | 희소성 반전 게이지 바 + 원육 마블링 사진 |
| 02 | 참숯을 쓰는 이유 | `ember` | EmberParticles 파티클 효과 |
| 03 | 콜키지 프리 | `cream` | 각주(*) 소자 처리 |
| 04 | 단체, 단독룸도 있습니다. | `sage` | 6인~30인 단독룸(분리 가능) |
| 05 | 주차 스트레스 없는 너른 주차장 | `slate` | 2층~옥상 150여 대 |

---

## 예약 폼 & 이메일

### 처리 흐름

1. 사용자 폼 작성 → 프론트 1차 검증 (날짜·전화번호)
2. `actions.ts` `submitReservation()` 서버 액션 호출
3. 서버에서 허니팟·날짜 정책·전화번호 재검증
4. Resend API → `RESERVATION_TO_EMAIL` 발송
5. 성공 시 감사 화면 표시

발신자: `단소상회 예약 <noreply@chowonfnb.com>`

### 이메일 번역

| 상황 | 이메일 내용 |
|------|------------|
| KO 페이지, 한글 입력 | 원문 그대로 |
| KO 페이지, **외국어 입력** | 원문 + `*(번역)` 인라인 번역 (한글 없으면 자동 감지) |
| EN 페이지 | 제목에 `[EN]` 프리픽스 + 본문 원문 + 하단 **한국어 요약 블록** (날짜·시간·인원·요청사항 번역) |

번역 엔진: MyMemory API (`https://api.mymemory.translated.net`) — 무료, API 키 불필요

### 날짜/인원 포맷 (이메일)

- 날짜 → `2026-05-29(금)` 자동 변환
- 인원 예시: 아기의자 2명 포함 10명 → `8+2(아기의자)명`
- EN 한국어 요약: `4명` / `3명 (유아 1명 포함)`

### 예약 가능 정책

- 지난 날짜 선택·제출 불가
- 당일 예약은 한국 시간 기준 오후 4시 전까지만 가능

---

## 개인정보처리방침

`/[lang]/danso/privacy` — SSG, `robots: noindex`

- 수집 항목: 이름, 휴대폰 번호, 방문 희망 일시, 인원, 요청사항
- 보유 기간: 예약 확인 완료 후 3개월 이내 파기
- 제3자 제공 없음
- 개인정보 보호책임자: 김준후 · 0507-1443-2080

보유 기간 변경 시 `privacy/page.tsx` 내 KO/EN 양쪽 수정.

---

## 브랜드 컬러 (globals.css `@theme`)

```
gold     #d4a843   프리미엄 포인트 (01 등급, CTA)
ember    #ff6b2b   참숯/불 (02 참숯 블록, 파티클)
sage     #9dbfb0   공간/편안함 (04 단체룸)
slate    #a0aab8   실용/신뢰 (05 주차)
cream    #f5f0e8   본문 텍스트, 03 콜키지 중립 톤
charcoal #0d0d0d   다크 배경 (메인)
panel    #111111   섹션 배경 (charcoal보다 약간 밝음)
```

---

## 자주 하는 작업

| 작업 | 수정 파일 |
|------|-----------|
| 한국어 텍스트 수정 | `src/dictionaries/ko.json` |
| 영문 텍스트 수정 | `src/dictionaries/en.json` |
| 메뉴 항목 변경 | `src/app/[lang]/danso/danso-client.tsx` → `MENU_ITEMS` 배열 |
| 영업시간/주소 변경 | `ko.json` + `en.json` + `app/layout.tsx` JSON-LD |
| 예약 수신 이메일 변경 | Vercel 대시보드 → `RESERVATION_TO_EMAIL` |
| SEO 키워드 변경 | `app/layout.tsx` + `app/[lang]/danso/layout.tsx` |
| 공유 썸네일 변경 | `public/og/danso-ssam.jpg` 교체 |
| 파비콘 변경 | `src/app/icon.tsx` |
| 브랜드 컬러 변경 | `src/app/globals.css` → `@theme` |
| 갤러리 사진 교체 | `public/gallery/g1~g8.jpg` 동일 파일명 덮어쓰기 |
| 리뷰 사진 추가 | `public/reviews/rN.jpg` + `REVIEW_SRCS` 배열 추가 |
| 리뷰 인용구 수정 (EN) | `src/dictionaries/en.json` → `review.quotes` 배열 |
| 개인정보처리방침 수정 | `src/app/[lang]/danso/privacy/page.tsx` |
| 외관 사진 교체 | `public/exterior.jpg` 덮어쓰기 |

---

## SEO / AEO / GEO

| 항목 | 위치 |
|------|------|
| 전역 메타데이터 | `app/layout.tsx` |
| `/danso` 메타데이터 + hreflang | `app/[lang]/danso/layout.tsx` |
| Restaurant JSON-LD | `app/layout.tsx` |
| FAQ JSON-LD (10개) | `app/[lang]/danso/layout.tsx` |
| 사이트맵 (6 URL) | `app/sitemap.ts` |
| robots.txt | `app/robots.ts` |

hreflang: `ko-KR` ↔ `en-US` 양방향 설정됨.

---

## 외부 서비스 연동

| 서비스 | 용도 | 플랜 | 관리 |
|--------|------|------|------|
| **Vercel** | 빌드·배포·호스팅 | Hobby (무료) | https://vercel.com/chowonfnb/chowonfnb |
| **Gabia** | 도메인 등록·DNS | 유료 | https://www.gabia.com |
| **Resend** | 예약 이메일 발송 | Free (3,000건/월) | https://resend.com |

### 연결 구조

```
사용자 브라우저
    │
    ▼
chowonfnb.com (Gabia — DNS A레코드 → Vercel IP)
    │
    ▼
Vercel (Next.js + 서버리스 함수)
    │  RESEND_API_KEY / RESERVATION_TO_EMAIL
    ▼
Resend API  →  수신 이메일
    (발신: noreply@chowonfnb.com)
```

### 이메일 도메인 인증 (Gabia DNS — 이미 적용됨)

| 타입 | 호스트 | 내용 |
|------|--------|------|
| TXT | `resend._domainkey` | DKIM 공개키 |
| MX | `send` | `feedback-smtp.ap-northeast-1.amazonses.com` (우선순위 10) |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` |
| TXT | `_dmarc` | `v=DMARC1; p=none;` |

확인: https://resend.com/domains

---

## 배포

git push → Vercel 자동 배포 (2~3분 소요)

```bash
git add .
git commit -m "커밋 메시지"
git push
```

- 최신 배포 확인: https://vercel.com/chowonfnb/chowonfnb
- 배포 후 Ctrl+Shift+R 강새로고침으로 확인
