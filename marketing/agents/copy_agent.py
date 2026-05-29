"""
카피 에이전트 — Claude API
키워드/메뉴명 → 플랫폼별 최적화 카피 자동 생성
인스타그램 / 구글 비즈니스 / 카카오 / 네이버 블로그
"""

import os
import json
import re
import anthropic
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).parent.parent

# 단소상회 브랜드 맥락 (모든 카피에 반영)
BRAND_CONTEXT = """
- 식당명: 단소상회
- 위치: 경북 포항시 남구 대이로 159번길 12-8 (포항 이동)
- 전화: 0507-1443-2080
- 영업: 매일 17:00~23:00 (라스트오더 22:00), 연중무휴
- 특징: 1++(9) 특상한우, 참숯 직화구이, 콜키지 프리, 단체룸 가능, 150대 주차
- 톤앤매너: 품격있고 진중하지만 따뜻함. 과도한 호들갑 없음.
"""

PLATFORM_PROMPTS = {
    "instagram": """
인스타그램 게시물 카피를 작성하세요.
- 첫 줄: 시선을 끄는 짧은 문장 (이모지 1~2개)
- 2~4줄: 메뉴/분위기 묘사 (감각적으로)
- 마지막: 예약/방문 유도 1줄
- 해시태그: 20~25개 (포항맛집, 포항한우, 한우맛집, 특상한우 등 포함)
- 총 길이: 150~250자 (해시태그 제외)
""",
    "threads": """
스레드(Threads) 게시물 3개를 연속으로 작성하세요.
각 게시물은 ---로 구분.
- 1번: 임팩트 있는 핵심 한 줄 (이모지 포함, 60자 이내)
- 2번: 감성적 묘사 or 스토리 (80자 이내)
- 3번: 방문/예약 유도 (전화번호 0507-1443-2080 포함, 70자 이내)
- 해시태그 없음 (스레드는 해시태그 불필요)
""",
    "naver_post": """
네이버 플레이스 소식을 작성하세요.
- 이모지 1~2개로 시작
- 핵심 내용 + 방문/예약 유도
- 100자 이내로 짧고 명확하게
- 해시태그 3~5개 (끝에 붙이기)
""",
    "google_business": """
구글 비즈니스 프로필 게시물을 작성하세요.
- 검색 유입을 고려한 자연스러운 키워드 포함
- 격식체, 신뢰감 있는 문체
- 위치/영업시간 언급 포함
- Call-to-action: 예약 권장
- 길이: 150~200자
- 해시태그 없음
""",
    "kakao": """
카카오 채널 메시지를 작성하세요.
- 친근하고 따뜻한 말투
- 짧고 읽기 쉽게
- 오늘/이번 주 방문 유도
- 전화번호 포함
- 길이: 80~120자
""",
    "naver_blog": """
네이버 블로그 포스팅 초안을 작성하세요.
- 제목: SEO 친화적 (포항 + 메뉴명 + 특징 포함)
- 소제목 3~4개로 구조화
- 메뉴 상세 설명, 분위기, 접근성
- 방문 후기 형식 or 소개 형식
- 길이: 600~800자
- 검색 키워드: 포항맛집, 포항한우, 포항이동맛집 자연 삽입
""",
}


def generate(
    keyword: str,
    platforms: list[str] | None = None,
    occasion: str = "",
    extra_context: str = "",
    api_key: str | None = None,
) -> dict[str, str]:
    """
    키워드 → 각 플랫폼별 카피 생성

    Args:
        keyword: 메뉴명 또는 키워드 (예: "오늘 갈빗살 입고", "주말 특선")
        platforms: 생성할 플랫폼 리스트. None이면 전체
        occasion: 특별 상황 (예: "어버이날", "주말")
        extra_context: 추가 맥락
        api_key: Anthropic API 키. None이면 환경변수 사용

    Returns:
        {"instagram": "...", "google_business": "...", ...}
    """
    platforms = platforms or list(PLATFORM_PROMPTS.keys())
    key = api_key or os.environ.get("ANTHROPIC_API_KEY", "")
    if not key:
        raise RuntimeError("ANTHROPIC_API_KEY 없음 — .env.local 확인")
    client = anthropic.Anthropic(api_key=key)
    results = {}

    for platform in platforms:
        if platform not in PLATFORM_PROMPTS:
            continue

        prompt = f"""당신은 단소상회의 마케터입니다.

브랜드 정보:
{BRAND_CONTEXT}

오늘 날짜: {datetime.now().strftime('%Y년 %m월 %d일')}
키워드/주제: {keyword}
{f'특별 상황: {occasion}' if occasion else ''}
{f'추가 맥락: {extra_context}' if extra_context else ''}

{PLATFORM_PROMPTS[platform]}

결과만 출력하세요. 설명이나 인삿말 없이 카피 텍스트만."""

        message = client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}]
        )
        results[platform] = message.content[0].text.strip()
        print(f"  ✅ {platform} 카피 생성 완료")

    return results


def save(results: dict[str, str], keyword: str) -> str:
    """생성된 카피를 JSON으로 저장"""
    out_dir = ROOT / "output" / "copy"
    out_dir.mkdir(parents=True, exist_ok=True)
    safe = re.sub(r'[\\/*?:"<>|]', "_", keyword)[:30]
    ts = datetime.now().strftime("%m%d_%H%M")
    out_path = out_dir / f"{ts}_{safe}.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump({"keyword": keyword, "copy": results}, f, ensure_ascii=False, indent=2)
    print(f"  💾 저장: {out_path.name}")
    return str(out_path)


# ─── CLI ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys
    keyword = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "오늘 특상한우 갈빗살"
    print(f"\n✍️  카피 에이전트 시작: '{keyword}'")
    results = generate(keyword)
    save(results, keyword)
    print("\n─── 생성된 카피 미리보기 ───")
    for platform, copy in results.items():
        print(f"\n[{platform.upper()}]\n{copy[:100]}...")
